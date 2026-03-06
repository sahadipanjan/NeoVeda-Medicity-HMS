/**
 * Doctor Dashboard & EMR Routes
 * 
 * GET  /api/doctor/dashboard     — Personal dashboard (today's appointments, inpatients, tasks)
 * GET  /api/doctor/patients/:id/records — Get patient's medical records (own only)
 * POST /api/doctor/records       — Create a new clinical note / prescription
 * PUT  /api/doctor/records/:id   — Update an existing clinical record
 *
 * SECURITY: Uses queryWithContext() to enforce RLS via SET LOCAL session variables.
 *           Additionally applies explicit doctor_id WHERE clauses as a secondary safeguard.
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { auditMiddleware } = require('../middleware/audit');
const { queryWithContext } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

router.use(authenticate);
router.use(authorize(['Super', 'Hospital', 'Department', 'Doctor']));
router.use(auditMiddleware);

/**
 * GET /api/doctor/dashboard
 * Returns the authenticated doctor's personal dashboard data:
 *   - profile, today's appointments, current inpatients, pending tasks
 */
router.get('/dashboard', async (req, res) => {
    try {
        const ctx = req.dbContext;
        const doctorId = req.user.user_ref_id;

        if (!doctorId) {
            return errorResponse(res, 'Doctor ID not found in session.', 403);
        }

        const today = new Date().toISOString().split('T')[0];

        // 1. Doctor profile (RLS: doctor can read own + all doctors via global SELECT)
        const profileRes = await queryWithContext(
            `SELECT d.id, d.first_name, d.last_name, d.specialization, d.qualification,
                    d.phone, d.email, dep.name as department_name
             FROM doctors d
             LEFT JOIN departments dep ON d.department_id = dep.id
             WHERE d.id = $1`,
            [doctorId], ctx
        );
        const profile = profileRes.rows[0] || {};

        // 2. Today's appointments — explicit doctor_id filter + RLS
        const appointmentsRes = await queryWithContext(
            `SELECT a.id, a.patient_id, a.appointment_date, a.appointment_time,
                    a.status, a.type, a.notes,
                    p.first_name as patient_first, p.last_name as patient_last,
                    p.uhid, p.phone as patient_phone, p.gender, p.date_of_birth
             FROM appointments a
             JOIN patients p ON a.patient_id = p.id
             WHERE a.doctor_id = $1 AND a.appointment_date = $2
             ORDER BY a.appointment_time ASC`,
            [doctorId, today], ctx
        );

        // 3. Current inpatients — explicit doctor_id filter + RLS
        const inpatientsRes = await queryWithContext(
            `SELECT ad.id as admission_id, ad.patient_id, ad.admission_date,
                    ad.diagnosis_at_admission,
                    p.first_name as patient_first, p.last_name as patient_last,
                    p.uhid, p.blood_group, p.gender,
                    w.name as ward_name, b.bed_number
             FROM admissions ad
             JOIN patients p ON ad.patient_id = p.id
             LEFT JOIN beds b ON ad.bed_id = b.id
             LEFT JOIN wards w ON b.ward_id = w.id
             WHERE ad.doctor_id = $1 AND ad.status = 'Active'
             ORDER BY ad.admission_date DESC`,
            [doctorId], ctx
        );

        // 4. Today's stats — explicit doctor_id filter + RLS
        const pendingRes = await queryWithContext(
            `SELECT COUNT(*) FILTER (WHERE a.status = 'Scheduled') as pending_appointments,
                    COUNT(*) FILTER (WHERE a.status = 'In-Progress') as in_progress,
                    COUNT(*) FILTER (WHERE a.status = 'Completed') as completed,
                    COUNT(*) FILTER (WHERE a.status = 'Cancelled') as cancelled
             FROM appointments a
             WHERE a.doctor_id = $1 AND a.appointment_date = $2`,
            [doctorId, today], ctx
        );

        // 5. Total medical records — explicit doctor_id filter + RLS
        const recordsCountRes = await queryWithContext(
            `SELECT COUNT(*) as total_records FROM medical_records WHERE doctor_id = $1`,
            [doctorId], ctx
        );

        return successResponse(res, {
            profile,
            today_appointments: appointmentsRes.rows,
            inpatients: inpatientsRes.rows,
            stats: {
                pending_appointments: parseInt(pendingRes.rows[0]?.pending_appointments || 0),
                in_progress: parseInt(pendingRes.rows[0]?.in_progress || 0),
                completed: parseInt(pendingRes.rows[0]?.completed || 0),
                cancelled: parseInt(pendingRes.rows[0]?.cancelled || 0),
                total_records: parseInt(recordsCountRes.rows[0]?.total_records || 0),
                total_inpatients: inpatientsRes.rows.length,
            },
        });
    } catch (err) {
        console.error('Doctor dashboard error:', err);
        return errorResponse(res, 'Failed to load doctor dashboard.', 500);
    }
});


/**
 * GET /api/doctor/patients/:patientId/records
 * Returns medical records for a specific patient (RLS-enforced: only own records visible)
 */
router.get('/patients/:patientId/records', async (req, res) => {
    try {
        const ctx = req.dbContext;
        const { patientId } = req.params;

        // Get patient info (RLS: doctors have SELECT on patients)
        const patientRes = await queryWithContext(
            `SELECT id, uhid, first_name, last_name, date_of_birth, gender, phone,
                    blood_group, email, city, state
             FROM patients WHERE id = $1`,
            [patientId], ctx
        );

        if (patientRes.rows.length === 0) {
            return errorResponse(res, 'Patient not found.', 404);
        }

        // Get medical records (RLS: doctor_own_records enforces doctor_id match)
        const recordsRes = await queryWithContext(
            `SELECT mr.id, mr.record_no, mr.diagnosis, mr.symptoms, mr.prescription,
                    mr.vitals, mr.lab_results, mr.follow_up_date, mr.notes,
                    mr.created_at, mr.updated_at,
                    d.first_name as doctor_first, d.last_name as doctor_last,
                    d.specialization
             FROM medical_records mr
             JOIN doctors d ON mr.doctor_id = d.id
             WHERE mr.patient_id = $1
             ORDER BY mr.created_at DESC`,
            [patientId], ctx
        );

        return successResponse(res, {
            patient: patientRes.rows[0],
            records: recordsRes.rows,
        });
    } catch (err) {
        console.error('Patient records error:', err);
        return errorResponse(res, 'Failed to load patient records.', 500);
    }
});


/**
 * POST /api/doctor/records
 * Create a new clinical note / prescription
 * Body: { patient_id, appointment_id?, diagnosis, symptoms, prescription,
 *         vitals, lab_results, follow_up_date, notes }
 */
router.post('/records', async (req, res) => {
    try {
        const ctx = req.dbContext;
        const doctorId = req.user.user_ref_id;
        const {
            patient_id, appointment_id, diagnosis, symptoms, prescription,
            vitals, lab_results, follow_up_date, notes
        } = req.body;

        if (!patient_id) {
            return errorResponse(res, 'Patient ID is required.', 400);
        }

        // Generate record number
        const countRes = await queryWithContext(
            'SELECT COUNT(*) FROM medical_records WHERE doctor_id = $1',
            [doctorId], ctx
        );
        const recNum = `MR-${String(parseInt(countRes.rows[0].count) + 1).padStart(6, '0')}`;

        const result = await queryWithContext(
            `INSERT INTO medical_records
             (record_no, patient_id, doctor_id, appointment_id, diagnosis, symptoms,
              prescription, vitals, lab_results, follow_up_date, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING *`,
            [recNum, patient_id, doctorId, appointment_id || null, diagnosis || null,
                symptoms || null, prescription || null,
                vitals ? JSON.stringify(vitals) : null,
                lab_results ? JSON.stringify(lab_results) : null,
                follow_up_date || null, notes || null], ctx
        );

        // If linked to an appointment, mark it as completed
        if (appointment_id) {
            await queryWithContext(
                `UPDATE appointments SET status = 'Completed', updated_at = NOW()
                 WHERE id = $1 AND doctor_id = $2`,
                [appointment_id, doctorId], ctx
            );
        }

        return successResponse(res, result.rows[0], 'Clinical record created.', 201);
    } catch (err) {
        console.error('Create record error:', err);
        return errorResponse(res, 'Failed to create clinical record.', 500);
    }
});


/**
 * PUT /api/doctor/records/:id
 * Update an existing clinical record
 */
router.put('/records/:id', async (req, res) => {
    try {
        const ctx = req.dbContext;
        const doctorId = req.user.user_ref_id;
        const { id } = req.params;
        const { diagnosis, symptoms, prescription, vitals, lab_results, follow_up_date, notes } = req.body;

        const result = await queryWithContext(
            `UPDATE medical_records SET
                diagnosis = COALESCE($1, diagnosis),
                symptoms = COALESCE($2, symptoms),
                prescription = COALESCE($3, prescription),
                vitals = COALESCE($4, vitals),
                lab_results = COALESCE($5, lab_results),
                follow_up_date = COALESCE($6, follow_up_date),
                notes = COALESCE($7, notes),
                updated_at = NOW()
             WHERE id = $8 AND doctor_id = $9
             RETURNING *`,
            [diagnosis, symptoms, prescription,
                vitals ? JSON.stringify(vitals) : null,
                lab_results ? JSON.stringify(lab_results) : null,
                follow_up_date, notes, id, doctorId], ctx
        );

        if (result.rows.length === 0) {
            return errorResponse(res, 'Record not found or not authorized.', 404);
        }

        return successResponse(res, result.rows[0], 'Clinical record updated.');
    } catch (err) {
        console.error('Update record error:', err);
        return errorResponse(res, 'Failed to update clinical record.', 500);
    }
});

module.exports = router;
