/**
 * Appointment Routes
 * 
 * GET    /api/appointments              — List appointments (filterable)
 * GET    /api/appointments/:id          — Get appointment details
 * POST   /api/appointments              — Create new appointment
 * PUT    /api/appointments/:id          — Update appointment
 * PATCH  /api/appointments/:id/status   — Update appointment status
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize, denyInsert, denyNonFinancial } = require('../middleware/rbac');
const { auditMiddleware } = require('../middleware/audit');
const { query } = require('../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { PAGINATION, APPOINTMENT_STATUS } = require('../config/constants');
const { v4: uuidv4 } = require('uuid');

router.use(authenticate);
router.use(denyNonFinancial()); // Accounts/Finance cannot access appointment routes
router.use(auditMiddleware);

/**
 * GET /api/appointments
 * Query params: doctor_id, patient_id, date, status, page, limit
 */
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(parseInt(req.query.limit, 10) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
        const offset = (page - 1) * limit;
        const { doctor_id, patient_id, date, status } = req.query;

        let whereClause = 'WHERE 1=1';
        const params = [];

        if (doctor_id) { params.push(doctor_id); whereClause += ` AND a.doctor_id = $${params.length}`; }
        if (patient_id) { params.push(patient_id); whereClause += ` AND a.patient_id = $${params.length}`; }
        if (date) { params.push(date); whereClause += ` AND a.appointment_date = $${params.length}`; }
        if (status) { params.push(status); whereClause += ` AND a.status = $${params.length}`; }

        const countResult = await query(
            `SELECT COUNT(*) FROM appointments a ${whereClause}`, params
        );
        const total = parseInt(countResult.rows[0].count, 10);

        params.push(limit, offset);
        const dataResult = await query(
            `SELECT a.*, 
              p.first_name AS patient_first_name, p.last_name AS patient_last_name, p.uhid,
              d.first_name AS doctor_first_name, d.last_name AS doctor_last_name,
              dep.name AS department_name
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       JOIN doctors d ON d.id = a.doctor_id
       JOIN departments dep ON dep.id = a.department_id
       ${whereClause}
       ORDER BY a.appointment_date DESC, a.appointment_time ASC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
            params
        );

        return paginatedResponse(res, dataResult.rows, total, page, limit);
    } catch (err) {
        return errorResponse(res, 'Failed to fetch appointments.', 500);
    }
});

/**
 * GET /api/appointments/:id
 */
router.get('/:id', async (req, res) => {
    try {
        const result = await query(
            `SELECT a.*, 
              p.first_name AS patient_first_name, p.last_name AS patient_last_name, p.uhid, p.phone AS patient_phone,
              d.first_name AS doctor_first_name, d.last_name AS doctor_last_name, d.specialization,
              dep.name AS department_name
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       JOIN doctors d ON d.id = a.doctor_id
       JOIN departments dep ON dep.id = a.department_id
       WHERE a.id = $1`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return errorResponse(res, 'Appointment not found.', 404);
        }

        return successResponse(res, result.rows[0]);
    } catch (err) {
        return errorResponse(res, 'Failed to fetch appointment.', 500);
    }
});

/**
 * POST /api/appointments
 */
router.post('/',
    authorize(['Super', 'Hospital', 'Department', 'Doctor', 'Nurse', 'Receptionist']),
    async (req, res) => {
        try {
            const {
                patient_id, doctor_id, department_id,
                appointment_date, appointment_time, duration_minutes, type, notes,
            } = req.body;

            if (!patient_id || !doctor_id || !department_id || !appointment_date || !appointment_time) {
                return errorResponse(res, 'Patient, doctor, department, date, and time are required.', 400);
            }

            // Check for scheduling conflicts
            const conflict = await query(
                `SELECT id FROM appointments 
         WHERE doctor_id = $1 AND appointment_date = $2 AND appointment_time = $3
         AND status NOT IN ('Cancelled', 'No-Show')`,
                [doctor_id, appointment_date, appointment_time]
            );

            if (conflict.rows.length > 0) {
                return errorResponse(res, 'Doctor already has an appointment at this time.', 409);
            }

            const appointmentNo = `APT-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 4).toUpperCase()}`;

            const result = await query(
                `INSERT INTO appointments 
           (appointment_no, patient_id, doctor_id, department_id,
            appointment_date, appointment_time, duration_minutes, type, notes, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING *`,
                [appointmentNo, patient_id, doctor_id, department_id,
                    appointment_date, appointment_time, duration_minutes || 30, type, notes,
                    req.user.employee_code]
            );

            await req.audit('CREATE_APPOINTMENT', 'Appointment', result.rows[0].id, null, result.rows[0]);

            return successResponse(res, result.rows[0], 'Appointment scheduled successfully.', 201);
        } catch (err) {
            return errorResponse(res, 'Failed to create appointment.', 500);
        }
    }
);

/**
 * PATCH /api/appointments/:id/status
 * Body: { status }
 */
router.patch('/:id/status',
    authorize(['Super', 'Hospital', 'Department', 'Doctor', 'Nurse', 'Receptionist']),
    async (req, res) => {
        try {
            const { status } = req.body;
            const validStatuses = Object.values(APPOINTMENT_STATUS);

            if (!validStatuses.includes(status)) {
                return errorResponse(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
            }

            const existing = await query(`SELECT * FROM appointments WHERE id = $1`, [req.params.id]);
            if (existing.rows.length === 0) {
                return errorResponse(res, 'Appointment not found.', 404);
            }

            const result = await query(
                `UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *`,
                [status, req.params.id]
            );

            await req.audit('UPDATE_APPOINTMENT_STATUS', 'Appointment', parseInt(req.params.id),
                { status: existing.rows[0].status }, { status });

            return successResponse(res, result.rows[0], `Appointment status updated to ${status}.`);
        } catch (err) {
            return errorResponse(res, 'Failed to update appointment status.', 500);
        }
    }
);

module.exports = router;
