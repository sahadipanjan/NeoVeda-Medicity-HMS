/**
 * Patient Routes
 * 
 * GET    /api/patients         — List patients (paginated)
 * GET    /api/patients/:id     — Get patient by ID
 * POST   /api/patients         — Register new patient
 * PUT    /api/patients/:id     — Update patient
 * DELETE /api/patients/:id     — Soft-delete patient
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize, denyInsert, denyNonFinancial } = require('../middleware/rbac');
const { auditMiddleware } = require('../middleware/audit');
const { query } = require('../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { PAGINATION } = require('../config/constants');
const { v4: uuidv4 } = require('uuid');

// All patient routes require authentication
router.use(authenticate);
router.use(denyNonFinancial()); // Accounts/Finance cannot access patient routes
router.use(auditMiddleware);

/**
 * GET /api/patients
 */
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(parseInt(req.query.limit, 10) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        let whereClause = 'WHERE is_active = TRUE';
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            whereClause += ` AND (first_name ILIKE $${params.length} OR last_name ILIKE $${params.length} OR uhid ILIKE $${params.length} OR phone ILIKE $${params.length})`;
        }

        const countResult = await query(`SELECT COUNT(*) FROM patients ${whereClause}`, params);
        const total = parseInt(countResult.rows[0].count, 10);

        params.push(limit, offset);
        const dataResult = await query(
            `SELECT id, uhid, first_name, last_name, date_of_birth, gender, phone, email, 
              city, state, blood_group, created_at
       FROM patients ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
            params
        );

        return paginatedResponse(res, dataResult.rows, total, page, limit);
    } catch (err) {
        return errorResponse(res, 'Failed to fetch patients.', 500);
    }
});

/**
 * GET /api/patients/:id
 */
router.get('/:id', async (req, res) => {
    try {
        const result = await query(
            `SELECT * FROM patients WHERE id = $1 AND is_active = TRUE`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return errorResponse(res, 'Patient not found.', 404);
        }

        return successResponse(res, result.rows[0]);
    } catch (err) {
        return errorResponse(res, 'Failed to fetch patient.', 500);
    }
});

/**
 * POST /api/patients
 */
router.post('/',
    authorize(['Super', 'Hospital', 'Department', 'Doctor', 'Nurse', 'Receptionist']),
    async (req, res) => {
        try {
            const {
                first_name, last_name, date_of_birth, gender, aadhaar_number,
                phone, email, address_line1, address_line2, city, state, pincode,
                blood_group, emergency_contact_name, emergency_contact_phone,
            } = req.body;

            if (!first_name || !last_name || !date_of_birth || !gender || !phone) {
                return errorResponse(res, 'First name, last name, date of birth, gender, and phone are required.', 400);
            }

            // Generate UHID: UHID-YYYYMMDD-XXXXX
            const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const uhid = `UHID-${today}-${uuidv4().slice(0, 5).toUpperCase()}`;

            const result = await query(
                `INSERT INTO patients 
           (uhid, first_name, last_name, date_of_birth, gender, aadhaar_number,
            phone, email, address_line1, address_line2, city, state, pincode,
            blood_group, emergency_contact_name, emergency_contact_phone)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         RETURNING *`,
                [uhid, first_name, last_name, date_of_birth, gender, aadhaar_number,
                    phone, email, address_line1, address_line2, city, state, pincode,
                    blood_group, emergency_contact_name, emergency_contact_phone]
            );

            await req.audit('CREATE_PATIENT', 'Patient', result.rows[0].id, null, result.rows[0]);

            return successResponse(res, result.rows[0], 'Patient registered successfully.', 201);
        } catch (err) {
            if (err.code === '23505') {
                return errorResponse(res, 'A patient with this Aadhaar number already exists.', 409);
            }
            return errorResponse(res, 'Failed to register patient.', 500);
        }
    }
);

/**
 * PUT /api/patients/:id
 */
router.put('/:id',
    authorize(['Super', 'Hospital', 'Department', 'Doctor', 'Receptionist']),
    async (req, res) => {
        try {
            const existing = await query(`SELECT * FROM patients WHERE id = $1 AND is_active = TRUE`, [req.params.id]);
            if (existing.rows.length === 0) {
                return errorResponse(res, 'Patient not found.', 404);
            }

            const {
                first_name, last_name, date_of_birth, gender, phone, email,
                address_line1, address_line2, city, state, pincode,
                blood_group, emergency_contact_name, emergency_contact_phone,
            } = req.body;

            const result = await query(
                `UPDATE patients SET
           first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name),
           date_of_birth = COALESCE($3, date_of_birth), gender = COALESCE($4, gender),
           phone = COALESCE($5, phone), email = COALESCE($6, email),
           address_line1 = COALESCE($7, address_line1), address_line2 = COALESCE($8, address_line2),
           city = COALESCE($9, city), state = COALESCE($10, state),
           pincode = COALESCE($11, pincode), blood_group = COALESCE($12, blood_group),
           emergency_contact_name = COALESCE($13, emergency_contact_name),
           emergency_contact_phone = COALESCE($14, emergency_contact_phone)
         WHERE id = $15 RETURNING *`,
                [first_name, last_name, date_of_birth, gender, phone, email,
                    address_line1, address_line2, city, state, pincode,
                    blood_group, emergency_contact_name, emergency_contact_phone, req.params.id]
            );

            await req.audit('UPDATE_PATIENT', 'Patient', parseInt(req.params.id), existing.rows[0], result.rows[0]);

            return successResponse(res, result.rows[0], 'Patient updated successfully.');
        } catch (err) {
            return errorResponse(res, 'Failed to update patient.', 500);
        }
    }
);

/**
 * DELETE /api/patients/:id (soft delete)
 */
router.delete('/:id',
    authorize(['Super', 'Hospital']),
    async (req, res) => {
        try {
            const existing = await query(`SELECT * FROM patients WHERE id = $1 AND is_active = TRUE`, [req.params.id]);
            if (existing.rows.length === 0) {
                return errorResponse(res, 'Patient not found.', 404);
            }

            await query(`UPDATE patients SET is_active = FALSE WHERE id = $1`, [req.params.id]);
            await req.audit('DELETE_PATIENT', 'Patient', parseInt(req.params.id), existing.rows[0], { is_active: false });

            return successResponse(res, null, 'Patient deactivated successfully.');
        } catch (err) {
            return errorResponse(res, 'Failed to delete patient.', 500);
        }
    }
);

module.exports = router;
