/**
 * Ward & Bed Management Routes
 * 
 * GET    /api/wards                    — List wards with occupancy stats
 * GET    /api/wards/:id                — Get ward details with beds
 * POST   /api/wards                    — Create ward
 * POST   /api/wards/:id/beds           — Add beds to a ward
 * PATCH  /api/wards/beds/:bedId/status — Update bed status
 * 
 * Admissions:
 * POST   /api/wards/admissions         — Admit patient
 * PATCH  /api/wards/admissions/:id/discharge — Discharge patient
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize, denyNonFinancial } = require('../middleware/rbac');
const { auditMiddleware } = require('../middleware/audit');
const { query, getClient } = require('../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { v4: uuidv4 } = require('uuid');

router.use(authenticate);
router.use(denyNonFinancial()); // Accounts/Finance cannot access ward routes
router.use(auditMiddleware);

/**
 * GET /api/wards — List wards with occupancy
 */
router.get('/', async (req, res) => {
    try {
        const result = await query(
            `SELECT w.*, dep.name AS department_name,
              (SELECT COUNT(*) FROM beds b WHERE b.ward_id = w.id AND b.status = 'Available') AS available_beds,
              (SELECT COUNT(*) FROM beds b WHERE b.ward_id = w.id AND b.status = 'Occupied') AS occupied_beds
       FROM wards w
       LEFT JOIN departments dep ON dep.id = w.department_id
       WHERE w.is_active = TRUE
       ORDER BY w.name`
        );

        return successResponse(res, result.rows);
    } catch (err) {
        return errorResponse(res, 'Failed to fetch wards.', 500);
    }
});

/**
 * GET /api/wards/:id — Ward details with all beds
 */
router.get('/:id', async (req, res) => {
    try {
        const wardResult = await query(
            `SELECT w.*, dep.name AS department_name
       FROM wards w LEFT JOIN departments dep ON dep.id = w.department_id
       WHERE w.id = $1`, [req.params.id]
        );

        if (wardResult.rows.length === 0) return errorResponse(res, 'Ward not found.', 404);

        const bedsResult = await query(
            `SELECT b.*, 
              a.id AS admission_id, p.first_name AS patient_name, p.uhid
       FROM beds b
       LEFT JOIN admissions a ON a.bed_id = b.id AND a.status = 'Active'
       LEFT JOIN patients p ON p.id = a.patient_id
       WHERE b.ward_id = $1
       ORDER BY b.bed_number`, [req.params.id]
        );

        return successResponse(res, { ...wardResult.rows[0], beds: bedsResult.rows });
    } catch (err) {
        return errorResponse(res, 'Failed to fetch ward.', 500);
    }
});

/**
 * POST /api/wards — Create a new ward
 */
router.post('/',
    authorize(['Super', 'Hospital']),
    async (req, res) => {
        try {
            const { name, ward_code, department_id, ward_type, floor, total_beds, charge_per_day } = req.body;

            if (!name || !ward_code || !ward_type || !total_beds) {
                return errorResponse(res, 'Name, ward code, type, and total beds are required.', 400);
            }

            const result = await query(
                `INSERT INTO wards (name, ward_code, department_id, ward_type, floor, total_beds, charge_per_day)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
                [name, ward_code, department_id, ward_type, floor, total_beds, charge_per_day || 0]
            );

            await req.audit('CREATE_WARD', 'Ward', result.rows[0].id, null, result.rows[0]);
            return successResponse(res, result.rows[0], 'Ward created successfully.', 201);
        } catch (err) {
            if (err.code === '23505') return errorResponse(res, 'Ward code already exists.', 409);
            return errorResponse(res, 'Failed to create ward.', 500);
        }
    }
);

/**
 * POST /api/wards/:id/beds — Bulk-add beds
 * Body: { count: 10 }
 */
router.post('/:id/beds',
    authorize(['Super', 'Hospital']),
    async (req, res) => {
        try {
            const wardId = req.params.id;
            const { count } = req.body;

            if (!count || count < 1) return errorResponse(res, 'Bed count must be at least 1.', 400);

            // Find highest existing bed number
            const maxResult = await query(
                `SELECT MAX(CAST(bed_number AS INTEGER)) AS max_num FROM beds WHERE ward_id = $1`,
                [wardId]
            );
            let startNum = (maxResult.rows[0].max_num || 0) + 1;

            const values = [];
            const placeholders = [];
            for (let i = 0; i < count; i++) {
                const bedNum = String(startNum + i).padStart(2, '0');
                placeholders.push(`($${values.length + 1}, $${values.length + 2})`);
                values.push(bedNum, wardId);
            }

            await query(
                `INSERT INTO beds (bed_number, ward_id) VALUES ${placeholders.join(',')}`,
                values
            );

            await req.audit('ADD_BEDS', 'Ward', parseInt(wardId), null, { count, startNum });
            return successResponse(res, null, `${count} bed(s) added successfully.`, 201);
        } catch (err) {
            return errorResponse(res, 'Failed to add beds.', 500);
        }
    }
);

/**
 * POST /api/wards/admissions — Admit a patient
 */
router.post('/admissions',
    authorize(['Super', 'Hospital', 'Department', 'Doctor']),
    async (req, res) => {
        const client = await getClient();
        try {
            await client.query('BEGIN');

            const { patient_id, doctor_id, bed_id, department_id, diagnosis_at_admission } = req.body;

            if (!patient_id || !doctor_id || !bed_id || !department_id) {
                return errorResponse(res, 'Patient, doctor, bed, and department are required.', 400);
            }

            // Check bed availability
            const bed = await client.query(`SELECT status FROM beds WHERE id = $1`, [bed_id]);
            if (bed.rows.length === 0) return errorResponse(res, 'Bed not found.', 404);
            if (bed.rows[0].status !== 'Available') return errorResponse(res, 'Bed is not available.', 409);

            const admissionNo = `ADM-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 4).toUpperCase()}`;

            const result = await client.query(
                `INSERT INTO admissions (admission_no, patient_id, doctor_id, bed_id, department_id, diagnosis_at_admission)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
                [admissionNo, patient_id, doctor_id, bed_id, department_id, diagnosis_at_admission]
            );

            // Mark bed as occupied
            await client.query(`UPDATE beds SET status = 'Occupied' WHERE id = $1`, [bed_id]);

            await client.query('COMMIT');

            await req.audit('ADMIT_PATIENT', 'Admission', result.rows[0].id, null, result.rows[0]);
            return successResponse(res, result.rows[0], 'Patient admitted successfully.', 201);
        } catch (err) {
            await client.query('ROLLBACK');
            return errorResponse(res, 'Failed to admit patient.', 500);
        } finally {
            client.release();
        }
    }
);

/**
 * PATCH /api/wards/admissions/:id/discharge — Discharge patient
 */
router.patch('/admissions/:id/discharge',
    authorize(['Super', 'Hospital', 'Department', 'Doctor']),
    async (req, res) => {
        const client = await getClient();
        try {
            await client.query('BEGIN');

            const { discharge_summary } = req.body;

            const admission = await client.query(
                `SELECT * FROM admissions WHERE id = $1 AND status = 'Active'`, [req.params.id]
            );
            if (admission.rows.length === 0) {
                return errorResponse(res, 'Active admission not found.', 404);
            }

            await client.query(
                `UPDATE admissions SET status = 'Discharged', discharge_date = NOW(), discharge_summary = $1
         WHERE id = $2`,
                [discharge_summary, req.params.id]
            );

            // Free up the bed
            await client.query(
                `UPDATE beds SET status = 'Available' WHERE id = $1`,
                [admission.rows[0].bed_id]
            );

            await client.query('COMMIT');

            await req.audit('DISCHARGE_PATIENT', 'Admission', parseInt(req.params.id),
                { status: 'Active' }, { status: 'Discharged', discharge_summary });

            return successResponse(res, null, 'Patient discharged successfully.');
        } catch (err) {
            await client.query('ROLLBACK');
            return errorResponse(res, 'Failed to discharge patient.', 500);
        } finally {
            client.release();
        }
    }
);

module.exports = router;
