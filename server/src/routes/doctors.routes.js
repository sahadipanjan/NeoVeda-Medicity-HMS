/**
 * Doctor Routes
 * 
 * GET    /api/doctors            — List doctors (paginated, filterable by department)
 * GET    /api/doctors/:id        — Get doctor by ID
 * POST   /api/doctors            — Register new doctor (creates auth credentials too)
 * PUT    /api/doctors/:id        — Update doctor profile
 * DELETE /api/doctors/:id        — Soft-delete doctor
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize, denyNonFinancial } = require('../middleware/rbac');
const { auditMiddleware } = require('../middleware/audit');
const { query, getClient } = require('../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { PAGINATION } = require('../config/constants');
const authService = require('../services/auth.service');

router.use(authenticate);
router.use(denyNonFinancial()); // Accounts/Finance cannot access doctor routes
router.use(auditMiddleware);

/**
 * GET /api/doctors
 */
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(parseInt(req.query.limit, 10) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
        const offset = (page - 1) * limit;
        const departmentId = req.query.department_id;

        let whereClause = 'WHERE d.is_active = TRUE';
        const params = [];

        if (departmentId) {
            params.push(departmentId);
            whereClause += ` AND d.department_id = $${params.length}`;
        }

        const countResult = await query(
            `SELECT COUNT(*) FROM doctors d ${whereClause}`, params
        );
        const total = parseInt(countResult.rows[0].count, 10);

        params.push(limit, offset);
        const dataResult = await query(
            `SELECT d.id, d.employee_code, d.first_name, d.last_name, d.specialization,
              d.qualification, d.consultation_fee, d.phone, d.email,
              d.blood_group, d.assigned_shift, d.medical_council_reg,
              dep.name AS department_name, dep.code AS department_code
       FROM doctors d
       JOIN departments dep ON dep.id = d.department_id
       ${whereClause}
       ORDER BY d.last_name, d.first_name
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
            params
        );

        return paginatedResponse(res, dataResult.rows, total, page, limit);
    } catch (err) {
        return errorResponse(res, 'Failed to fetch doctors.', 500);
    }
});

/**
 * GET /api/doctors/:id
 */
router.get('/:id', async (req, res) => {
    try {
        const result = await query(
            `SELECT d.*, dep.name AS department_name, dep.code AS department_code
       FROM doctors d
       JOIN departments dep ON dep.id = d.department_id
       WHERE d.id = $1 AND d.is_active = TRUE`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return errorResponse(res, 'Doctor not found.', 404);
        }

        return successResponse(res, result.rows[0]);
    } catch (err) {
        return errorResponse(res, 'Failed to fetch doctor.', 500);
    }
});

/**
 * POST /api/doctors
 * Creates doctor profile AND auth credentials in a transaction
 */
router.post('/',
    authorize(['Super', 'Hospital', 'Department']),
    async (req, res) => {
        const client = await getClient();
        try {
            await client.query('BEGIN');

            const {
                first_name, last_name, department_id, specialization, qualification,
                medical_council_reg, phone, email, consultation_fee, joined_date, password,
                blood_group, assigned_shift,
            } = req.body;

            if (!first_name || !last_name || !department_id || !email || !password) {
                return errorResponse(res, 'First name, last name, department, email, and password are required.', 400);
            }

            // Get department code for employee code generation
            const deptResult = await client.query('SELECT code FROM departments WHERE id = $1', [department_id]);
            if (deptResult.rows.length === 0) {
                return errorResponse(res, 'Department not found.', 404);
            }

            const doctorResult = await client.query(
                `INSERT INTO doctors 
           (first_name, last_name, department_id, specialization, qualification,
            medical_council_reg, phone, email, consultation_fee, joined_date, employee_code,
            blood_group, assigned_shift)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'TEMP',$11,$12)
         RETURNING *`,
                [first_name, last_name, department_id, specialization, qualification,
                    medical_council_reg, phone, email, consultation_fee || 0, joined_date,
                    blood_group, assigned_shift]
            );

            const doctor = doctorResult.rows[0];

            // Register auth credentials (generates employee code)
            const { employeeCode } = await authService.registerCredentials({
                userType: 'Doctor',
                userRefId: doctor.id,
                deptCode: deptResult.rows[0].code,
                password,
            });

            // Update doctor with real employee code
            await client.query(
                `UPDATE doctors SET employee_code = $1 WHERE id = $2`,
                [employeeCode, doctor.id]
            );

            await client.query('COMMIT');

            doctor.employee_code = employeeCode;
            await req.audit('CREATE_DOCTOR', 'Doctor', doctor.id, null, doctor);

            return successResponse(res, doctor, 'Doctor registered successfully.', 201);
        } catch (err) {
            await client.query('ROLLBACK');
            if (err.code === '23505') {
                return errorResponse(res, 'A doctor with this email already exists.', 409);
            }
            return errorResponse(res, err.message || 'Failed to register doctor.', err.status || 500);
        } finally {
            client.release();
        }
    }
);

/**
 * PUT /api/doctors/:id
 */
router.put('/:id',
    authorize(['Super', 'Hospital', 'Department', 'Doctor']),
    async (req, res) => {
        try {
            const existing = await query(`SELECT * FROM doctors WHERE id = $1 AND is_active = TRUE`, [req.params.id]);
            if (existing.rows.length === 0) {
                return errorResponse(res, 'Doctor not found.', 404);
            }

            const {
                first_name, last_name, specialization, qualification,
                medical_council_reg, phone, consultation_fee,
                blood_group, assigned_shift,
            } = req.body;

            const result = await query(
                `UPDATE doctors SET
           first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name),
           specialization = COALESCE($3, specialization), qualification = COALESCE($4, qualification),
           medical_council_reg = COALESCE($5, medical_council_reg), phone = COALESCE($6, phone),
           consultation_fee = COALESCE($7, consultation_fee),
           blood_group = COALESCE($8, blood_group), assigned_shift = COALESCE($9, assigned_shift)
         WHERE id = $10 RETURNING *`,
                [first_name, last_name, specialization, qualification,
                    medical_council_reg, phone, consultation_fee,
                    blood_group, assigned_shift, req.params.id]
            );

            await req.audit('UPDATE_DOCTOR', 'Doctor', parseInt(req.params.id), existing.rows[0], result.rows[0]);

            return successResponse(res, result.rows[0], 'Doctor updated successfully.');
        } catch (err) {
            return errorResponse(res, 'Failed to update doctor.', 500);
        }
    }
);

/**
 * DELETE /api/doctors/:id (soft delete)
 */
router.delete('/:id',
    authorize(['Super', 'Hospital']),
    async (req, res) => {
        try {
            const existing = await query(`SELECT * FROM doctors WHERE id = $1 AND is_active = TRUE`, [req.params.id]);
            if (existing.rows.length === 0) {
                return errorResponse(res, 'Doctor not found.', 404);
            }

            await query(`UPDATE doctors SET is_active = FALSE WHERE id = $1`, [req.params.id]);
            await req.audit('DELETE_DOCTOR', 'Doctor', parseInt(req.params.id), existing.rows[0], { is_active: false });

            return successResponse(res, null, 'Doctor deactivated successfully.');
        } catch (err) {
            return errorResponse(res, 'Failed to delete doctor.', 500);
        }
    }
);

module.exports = router;
