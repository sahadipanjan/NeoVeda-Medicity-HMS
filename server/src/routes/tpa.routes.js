/**
 * TPA (Third-Party Administrator) Routes
 * 
 * Vendors:
 *   GET    /api/tpa/vendors              — List TPA vendors
 *   GET    /api/tpa/vendors/:id          — Get vendor details
 *   POST   /api/tpa/vendors              — Create vendor
 *   PUT    /api/tpa/vendors/:id          — Update vendor
 *
 * Insurance Policies:
 *   GET    /api/tpa/policies             — List policies (filter by patient_id)
 *   GET    /api/tpa/policies/:id         — Get policy details
 *   POST   /api/tpa/policies             — Register patient policy
 *   PUT    /api/tpa/policies/:id         — Update policy
 *
 * Pre-Authorization:
 *   GET    /api/tpa/preauth              — List pre-auth requests
 *   GET    /api/tpa/preauth/:id          — Get pre-auth detail
 *   POST   /api/tpa/preauth              — Initiate pre-auth
 *   PATCH  /api/tpa/preauth/:id/status   — Update pre-auth status
 *
 * Claims:
 *   GET    /api/tpa/claims               — List claims
 *   GET    /api/tpa/claims/:id           — Get claim detail
 *   POST   /api/tpa/claims               — Create claim
 *   PATCH  /api/tpa/claims/:id/status    — Update claim status
 *   PATCH  /api/tpa/claims/:id/settle    — Record settlement
 *
 * Tariffs:
 *   GET    /api/tpa/tariffs              — List tariffs
 *   POST   /api/tpa/tariffs              — Create tariff entry
 *   PUT    /api/tpa/tariffs/:id          — Update tariff
 *   GET    /api/tpa/tariffs/apply        — Auto-apply tariff rates
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { auditMiddleware } = require('../middleware/audit');
const { query, getClient } = require('../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { PAGINATION, PREAUTH_STATUS, CLAIM_STATUS } = require('../config/constants');

router.use(authenticate);
router.use(auditMiddleware);

const TPA_ROLES = ['Super', 'Hospital', 'Accounts/Finance', 'Receptionist'];

// ═══════════════════════════════════════════
//  TPA VENDORS
// ═══════════════════════════════════════════

/**
 * GET /api/tpa/vendors
 */
router.get('/vendors', authorize(TPA_ROLES), async (req, res) => {
    try {
        const { panel_type, is_active } = req.query;
        let where = 'WHERE 1=1';
        const params = [];

        if (panel_type) { params.push(panel_type); where += ` AND v.panel_type = $${params.length}`; }
        if (is_active !== undefined) { params.push(is_active === 'true'); where += ` AND v.is_active = $${params.length}`; }

        const result = await query(
            `SELECT v.* FROM tpa_vendors v ${where} ORDER BY v.name`, params
        );

        return successResponse(res, result.rows);
    } catch (err) {
        return errorResponse(res, 'Failed to fetch TPA vendors.', 500);
    }
});

/**
 * GET /api/tpa/vendors/:id
 */
router.get('/vendors/:id', authorize(TPA_ROLES), async (req, res) => {
    try {
        const result = await query('SELECT * FROM tpa_vendors WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return errorResponse(res, 'Vendor not found.', 404);
        return successResponse(res, result.rows[0]);
    } catch (err) {
        return errorResponse(res, 'Failed to fetch vendor.', 500);
    }
});

/**
 * POST /api/tpa/vendors
 */
router.post('/vendors', authorize(['Super', 'Hospital']), async (req, res) => {
    try {
        const { vendor_code, name, panel_type, contact_person, phone, email, address,
            gst_number, empanelment_date, expiry_date, settlement_tat_days,
            irdai_registration_no, toll_free_helpline } = req.body;

        if (!vendor_code || !name || !panel_type) {
            return errorResponse(res, 'Vendor code, name, and panel type are required.', 400);
        }

        const result = await query(
            `INSERT INTO tpa_vendors 
             (vendor_code, name, panel_type, contact_person, phone, email, address,
              gst_number, empanelment_date, expiry_date, settlement_tat_days,
              irdai_registration_no, toll_free_helpline)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
            [vendor_code, name, panel_type, contact_person, phone, email, address,
                gst_number, empanelment_date || null, expiry_date || null, settlement_tat_days || 30,
                irdai_registration_no || null, toll_free_helpline || null]
        );

        await req.audit('CREATE_TPA_VENDOR', 'TPA_Vendor', result.rows[0].id, null, result.rows[0]);
        return successResponse(res, result.rows[0], 'TPA vendor registered.', 201);
    } catch (err) {
        if (err.code === '23505') return errorResponse(res, 'Vendor code already exists.', 409);
        return errorResponse(res, 'Failed to create vendor.', 500);
    }
});

/**
 * PUT /api/tpa/vendors/:id
 */
router.put('/vendors/:id', authorize(['Super', 'Hospital']), async (req, res) => {
    try {
        const { name, panel_type, contact_person, phone, email, address,
            gst_number, empanelment_date, expiry_date, settlement_tat_days, is_active,
            irdai_registration_no, toll_free_helpline } = req.body;

        const existing = await query('SELECT * FROM tpa_vendors WHERE id = $1', [req.params.id]);
        if (existing.rows.length === 0) return errorResponse(res, 'Vendor not found.', 404);

        const result = await query(
            `UPDATE tpa_vendors SET 
             name = COALESCE($1, name), panel_type = COALESCE($2, panel_type),
             contact_person = COALESCE($3, contact_person), phone = COALESCE($4, phone),
             email = COALESCE($5, email), address = COALESCE($6, address),
             gst_number = COALESCE($7, gst_number), empanelment_date = COALESCE($8, empanelment_date),
             expiry_date = COALESCE($9, expiry_date), settlement_tat_days = COALESCE($10, settlement_tat_days),
             is_active = COALESCE($11, is_active),
             irdai_registration_no = COALESCE($12, irdai_registration_no),
             toll_free_helpline = COALESCE($13, toll_free_helpline), updated_at = NOW()
             WHERE id = $14 RETURNING *`,
            [name, panel_type, contact_person, phone, email, address,
                gst_number, empanelment_date, expiry_date, settlement_tat_days, is_active,
                irdai_registration_no, toll_free_helpline, req.params.id]
        );

        await req.audit('UPDATE_TPA_VENDOR', 'TPA_Vendor', parseInt(req.params.id), existing.rows[0], result.rows[0]);
        return successResponse(res, result.rows[0], 'Vendor updated.');
    } catch (err) {
        return errorResponse(res, 'Failed to update vendor.', 500);
    }
});

// ═══════════════════════════════════════════
//  INSURANCE POLICIES
// ═══════════════════════════════════════════

/**
 * GET /api/tpa/policies
 */
router.get('/policies', authorize(TPA_ROLES), async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(parseInt(req.query.limit, 10) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
        const offset = (page - 1) * limit;
        const { patient_id, tpa_vendor_id, is_active } = req.query;

        let where = 'WHERE 1=1';
        const params = [];

        if (patient_id) { params.push(patient_id); where += ` AND ip.patient_id = $${params.length}`; }
        if (tpa_vendor_id) { params.push(tpa_vendor_id); where += ` AND ip.tpa_vendor_id = $${params.length}`; }
        if (is_active !== undefined) { params.push(is_active === 'true'); where += ` AND ip.is_active = $${params.length}`; }

        const countResult = await query(`SELECT COUNT(*) FROM insurance_policies ip ${where}`, params);
        const total = parseInt(countResult.rows[0].count, 10);

        params.push(limit, offset);
        const dataResult = await query(
            `SELECT ip.*, 
                    p.first_name AS patient_name, p.last_name AS patient_last_name, p.uhid,
                    tv.name AS vendor_name, tv.panel_type
             FROM insurance_policies ip
             JOIN patients p ON p.id = ip.patient_id
             JOIN tpa_vendors tv ON tv.id = ip.tpa_vendor_id
             ${where}
             ORDER BY ip.created_at DESC
             LIMIT $${params.length - 1} OFFSET $${params.length}`,
            params
        );

        return paginatedResponse(res, dataResult.rows, total, page, limit);
    } catch (err) {
        return errorResponse(res, 'Failed to fetch policies.', 500);
    }
});

/**
 * GET /api/tpa/policies/:id
 */
router.get('/policies/:id', authorize(TPA_ROLES), async (req, res) => {
    try {
        const result = await query(
            `SELECT ip.*, 
                    p.first_name AS patient_name, p.last_name AS patient_last_name, p.uhid,
                    tv.name AS vendor_name, tv.panel_type
             FROM insurance_policies ip
             JOIN patients p ON p.id = ip.patient_id
             JOIN tpa_vendors tv ON tv.id = ip.tpa_vendor_id
             WHERE ip.id = $1`, [req.params.id]
        );
        if (result.rows.length === 0) return errorResponse(res, 'Policy not found.', 404);
        return successResponse(res, result.rows[0]);
    } catch (err) {
        return errorResponse(res, 'Failed to fetch policy.', 500);
    }
});

/**
 * POST /api/tpa/policies
 */
router.post('/policies', authorize(TPA_ROLES), async (req, res) => {
    try {
        const { patient_id, tpa_vendor_id, policy_number, insurance_company, plan_name,
            policy_start_date, policy_end_date, sum_insured, co_payment_percent,
            deductible_amount, room_rent_limit, member_id, relation_to_primary } = req.body;

        if (!patient_id || !tpa_vendor_id || !policy_number || !insurance_company ||
            !policy_start_date || !policy_end_date || !sum_insured) {
            return errorResponse(res, 'Patient, vendor, policy number, company, dates, and sum insured are required.', 400);
        }

        const result = await query(
            `INSERT INTO insurance_policies
             (patient_id, tpa_vendor_id, policy_number, insurance_company, plan_name,
              policy_start_date, policy_end_date, sum_insured, balance_available,
              co_payment_percent, deductible_amount, room_rent_limit, member_id, relation_to_primary)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8,$9,$10,$11,$12,$13) RETURNING *`,
            [patient_id, tpa_vendor_id, policy_number, insurance_company, plan_name || null,
                policy_start_date, policy_end_date, sum_insured,
                co_payment_percent || 0, deductible_amount || 0, room_rent_limit || null,
                member_id || null, relation_to_primary || 'Self']
        );

        await req.audit('CREATE_POLICY', 'Insurance_Policy', result.rows[0].id, null, result.rows[0]);
        return successResponse(res, result.rows[0], 'Insurance policy registered.', 201);
    } catch (err) {
        return errorResponse(res, 'Failed to create policy.', 500);
    }
});

/**
 * PUT /api/tpa/policies/:id
 */
router.put('/policies/:id', authorize(TPA_ROLES), async (req, res) => {
    try {
        const existing = await query('SELECT * FROM insurance_policies WHERE id = $1', [req.params.id]);
        if (existing.rows.length === 0) return errorResponse(res, 'Policy not found.', 404);

        const { policy_end_date, balance_available, co_payment_percent,
            deductible_amount, room_rent_limit, is_active } = req.body;

        const result = await query(
            `UPDATE insurance_policies SET
             policy_end_date = COALESCE($1, policy_end_date),
             balance_available = COALESCE($2, balance_available),
             co_payment_percent = COALESCE($3, co_payment_percent),
             deductible_amount = COALESCE($4, deductible_amount),
             room_rent_limit = COALESCE($5, room_rent_limit),
             is_active = COALESCE($6, is_active), updated_at = NOW()
             WHERE id = $7 RETURNING *`,
            [policy_end_date, balance_available, co_payment_percent,
                deductible_amount, room_rent_limit, is_active, req.params.id]
        );

        await req.audit('UPDATE_POLICY', 'Insurance_Policy', parseInt(req.params.id), existing.rows[0], result.rows[0]);
        return successResponse(res, result.rows[0], 'Policy updated.');
    } catch (err) {
        return errorResponse(res, 'Failed to update policy.', 500);
    }
});

// ═══════════════════════════════════════════
//  PRE-AUTHORIZATION
// ═══════════════════════════════════════════

/**
 * GET /api/tpa/preauth
 */
router.get('/preauth', authorize(TPA_ROLES), async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(parseInt(req.query.limit, 10) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
        const offset = (page - 1) * limit;
        const { status, tpa_vendor_id, admission_id } = req.query;

        let where = 'WHERE 1=1';
        const params = [];

        if (status) { params.push(status); where += ` AND pr.status = $${params.length}`; }
        if (tpa_vendor_id) { params.push(tpa_vendor_id); where += ` AND pr.tpa_vendor_id = $${params.length}`; }
        if (admission_id) { params.push(admission_id); where += ` AND pr.admission_id = $${params.length}`; }

        const countResult = await query(`SELECT COUNT(*) FROM preauth_requests pr ${where}`, params);
        const total = parseInt(countResult.rows[0].count, 10);

        params.push(limit, offset);
        const dataResult = await query(
            `SELECT pr.*,
                    a.admission_no, a.patient_id,
                    p.first_name AS patient_name, p.last_name AS patient_last_name, p.uhid,
                    tv.name AS vendor_name, tv.panel_type,
                    ip.policy_number, ip.insurance_company
             FROM preauth_requests pr
             JOIN admissions a ON a.id = pr.admission_id
             JOIN patients p ON p.id = a.patient_id
             JOIN tpa_vendors tv ON tv.id = pr.tpa_vendor_id
             JOIN insurance_policies ip ON ip.id = pr.insurance_policy_id
             ${where}
             ORDER BY pr.created_at DESC
             LIMIT $${params.length - 1} OFFSET $${params.length}`,
            params
        );

        return paginatedResponse(res, dataResult.rows, total, page, limit);
    } catch (err) {
        return errorResponse(res, 'Failed to fetch pre-auth requests.', 500);
    }
});

/**
 * GET /api/tpa/preauth/:id
 */
router.get('/preauth/:id', authorize(TPA_ROLES), async (req, res) => {
    try {
        const result = await query(
            `SELECT pr.*,
                    a.admission_no, a.patient_id, a.diagnosis_at_admission,
                    p.first_name AS patient_name, p.last_name AS patient_last_name, p.uhid,
                    tv.name AS vendor_name, tv.panel_type,
                    ip.policy_number, ip.insurance_company, ip.sum_insured, ip.balance_available
             FROM preauth_requests pr
             JOIN admissions a ON a.id = pr.admission_id
             JOIN patients p ON p.id = a.patient_id
             JOIN tpa_vendors tv ON tv.id = pr.tpa_vendor_id
             JOIN insurance_policies ip ON ip.id = pr.insurance_policy_id
             WHERE pr.id = $1`, [req.params.id]
        );
        if (result.rows.length === 0) return errorResponse(res, 'Pre-auth request not found.', 404);
        return successResponse(res, result.rows[0]);
    } catch (err) {
        return errorResponse(res, 'Failed to fetch pre-auth.', 500);
    }
});

/**
 * POST /api/tpa/preauth — Initiate pre-authorization
 */
router.post('/preauth', authorize(TPA_ROLES), async (req, res) => {
    try {
        const { admission_id, insurance_policy_id, requested_amount,
            diagnosis, procedure_planned, icd_code } = req.body;

        if (!admission_id || !insurance_policy_id || !requested_amount || !diagnosis) {
            return errorResponse(res, 'Admission, policy, amount, and diagnosis are required.', 400);
        }

        // Get policy's vendor
        const policy = await query('SELECT tpa_vendor_id FROM insurance_policies WHERE id = $1', [insurance_policy_id]);
        if (policy.rows.length === 0) return errorResponse(res, 'Insurance policy not found.', 404);

        const tpa_vendor_id = policy.rows[0].tpa_vendor_id;
        const preauth_no = `PA-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-4)}`;

        const result = await query(
            `INSERT INTO preauth_requests
             (preauth_no, admission_id, insurance_policy_id, tpa_vendor_id,
              requested_amount, diagnosis, procedure_planned, icd_code, requested_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
            [preauth_no, admission_id, insurance_policy_id, tpa_vendor_id,
                requested_amount, diagnosis, procedure_planned || null, icd_code || null,
                req.user.employee_code]
        );

        await req.audit('CREATE_PREAUTH', 'PreAuth', result.rows[0].id, null, result.rows[0]);
        return successResponse(res, result.rows[0], 'Pre-authorization initiated.', 201);
    } catch (err) {
        return errorResponse(res, 'Failed to create pre-auth.', 500);
    }
});

/**
 * PATCH /api/tpa/preauth/:id/status
 * Body: { status, approved_amount?, tpa_reference_no?, query_details?, remarks? }
 */
router.patch('/preauth/:id/status', authorize(TPA_ROLES), async (req, res) => {
    try {
        const { status, approved_amount, tpa_reference_no, query_details, remarks } = req.body;

        const validStatuses = Object.values(PREAUTH_STATUS);
        if (!validStatuses.includes(status)) {
            return errorResponse(res, `Invalid status. Must be: ${validStatuses.join(', ')}`, 400);
        }

        const existing = await query('SELECT * FROM preauth_requests WHERE id = $1', [req.params.id]);
        if (existing.rows.length === 0) return errorResponse(res, 'Pre-auth not found.', 404);

        const isApproval = ['Approved', 'Partially Approved', 'Enhancement Approved'].includes(status);
        const isSubmission = status === 'Submitted';

        const result = await query(
            `UPDATE preauth_requests SET
             status = $1,
             approved_amount = COALESCE($2, approved_amount),
             tpa_reference_no = COALESCE($3, tpa_reference_no),
             query_details = COALESCE($4, query_details),
             remarks = COALESCE($5, remarks),
             submitted_at = CASE WHEN $6 THEN NOW() ELSE submitted_at END,
             approved_at = CASE WHEN $7 THEN NOW() ELSE approved_at END,
             updated_at = NOW()
             WHERE id = $8 RETURNING *`,
            [status, approved_amount, tpa_reference_no, query_details, remarks,
                isSubmission, isApproval, req.params.id]
        );

        // If approved, update admission's preauth link
        if (isApproval) {
            await query(
                `UPDATE admissions SET preauth_id = $1 WHERE id = $2`,
                [parseInt(req.params.id), existing.rows[0].admission_id]
            );
        }

        await req.audit('UPDATE_PREAUTH_STATUS', 'PreAuth', parseInt(req.params.id),
            { status: existing.rows[0].status }, { status });
        return successResponse(res, result.rows[0], `Pre-auth status updated to ${status}.`);
    } catch (err) {
        return errorResponse(res, 'Failed to update pre-auth status.', 500);
    }
});

// ═══════════════════════════════════════════
//  TPA CLAIMS
// ═══════════════════════════════════════════

/**
 * GET /api/tpa/claims
 */
router.get('/claims', authorize(TPA_ROLES), async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(parseInt(req.query.limit, 10) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
        const offset = (page - 1) * limit;
        const { status, tpa_vendor_id, claim_type } = req.query;

        let where = 'WHERE 1=1';
        const params = [];

        if (status) { params.push(status); where += ` AND c.status = $${params.length}`; }
        if (tpa_vendor_id) { params.push(tpa_vendor_id); where += ` AND c.tpa_vendor_id = $${params.length}`; }
        if (claim_type) { params.push(claim_type); where += ` AND c.claim_type = $${params.length}`; }

        const countResult = await query(`SELECT COUNT(*) FROM tpa_claims c ${where}`, params);
        const total = parseInt(countResult.rows[0].count, 10);

        params.push(limit, offset);
        const dataResult = await query(
            `SELECT c.*,
                    a.admission_no,
                    p.first_name AS patient_name, p.last_name AS patient_last_name, p.uhid,
                    tv.name AS vendor_name, tv.panel_type,
                    ip.policy_number, ip.insurance_company
             FROM tpa_claims c
             JOIN admissions a ON a.id = c.admission_id
             JOIN patients p ON p.id = a.patient_id
             JOIN tpa_vendors tv ON tv.id = c.tpa_vendor_id
             JOIN insurance_policies ip ON ip.id = c.insurance_policy_id
             ${where}
             ORDER BY c.created_at DESC
             LIMIT $${params.length - 1} OFFSET $${params.length}`,
            params
        );

        return paginatedResponse(res, dataResult.rows, total, page, limit);
    } catch (err) {
        return errorResponse(res, 'Failed to fetch claims.', 500);
    }
});

/**
 * GET /api/tpa/claims/:id
 */
router.get('/claims/:id', authorize(TPA_ROLES), async (req, res) => {
    try {
        const result = await query(
            `SELECT c.*,
                    a.admission_no, a.admission_date, a.discharge_date,
                    p.first_name AS patient_name, p.last_name AS patient_last_name, p.uhid,
                    tv.name AS vendor_name, tv.panel_type,
                    ip.policy_number, ip.insurance_company, ip.sum_insured, ip.balance_available,
                    pr.preauth_no, pr.approved_amount AS preauth_approved
             FROM tpa_claims c
             JOIN admissions a ON a.id = c.admission_id
             JOIN patients p ON p.id = a.patient_id
             JOIN tpa_vendors tv ON tv.id = c.tpa_vendor_id
             JOIN insurance_policies ip ON ip.id = c.insurance_policy_id
             LEFT JOIN preauth_requests pr ON pr.id = c.preauth_id
             WHERE c.id = $1`, [req.params.id]
        );
        if (result.rows.length === 0) return errorResponse(res, 'Claim not found.', 404);
        return successResponse(res, result.rows[0]);
    } catch (err) {
        return errorResponse(res, 'Failed to fetch claim.', 500);
    }
});

/**
 * POST /api/tpa/claims
 * Body: { admission_id, billing_id?, insurance_policy_id, claim_type,
 *         total_bill_amount, co_payment_amount?, deductible_amount?, remarks? }
 */
router.post('/claims', authorize(TPA_ROLES), async (req, res) => {
    try {
        const { admission_id, billing_id, insurance_policy_id, preauth_id,
            claim_type, total_bill_amount, co_payment_amount, deductible_amount, remarks } = req.body;

        if (!admission_id || !insurance_policy_id || !total_bill_amount) {
            return errorResponse(res, 'Admission, policy, and bill amount are required.', 400);
        }

        const policy = await query(
            'SELECT tpa_vendor_id, co_payment_percent, deductible_amount AS policy_deductible FROM insurance_policies WHERE id = $1',
            [insurance_policy_id]
        );
        if (policy.rows.length === 0) return errorResponse(res, 'Policy not found.', 404);

        const tpa_vendor_id = policy.rows[0].tpa_vendor_id;
        const coPay = co_payment_amount || Math.round(total_bill_amount * (policy.rows[0].co_payment_percent / 100) * 100) / 100;
        const deductible = deductible_amount || parseFloat(policy.rows[0].policy_deductible) || 0;
        const patientPayable = coPay + deductible;

        const claim_no = `CLM-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-4)}`;

        const result = await query(
            `INSERT INTO tpa_claims
             (claim_no, admission_id, billing_id, preauth_id, insurance_policy_id, tpa_vendor_id,
              claim_type, total_bill_amount, co_payment_amount, deductible_amount,
              patient_payable, remarks, submitted_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
            [claim_no, admission_id, billing_id || null, preauth_id || null,
                insurance_policy_id, tpa_vendor_id, claim_type || 'Cashless',
                total_bill_amount, coPay, deductible, patientPayable,
                remarks || null, req.user.employee_code]
        );

        await req.audit('CREATE_CLAIM', 'TPA_Claim', result.rows[0].id, null, result.rows[0]);
        return successResponse(res, result.rows[0], 'Claim created.', 201);
    } catch (err) {
        return errorResponse(res, 'Failed to create claim.', 500);
    }
});

/**
 * PATCH /api/tpa/claims/:id/status
 * Body: { status, approved_amount?, tpa_reference_no?, rejection_reason?, remarks? }
 */
router.patch('/claims/:id/status', authorize(TPA_ROLES), async (req, res) => {
    try {
        const { status, approved_amount, tpa_reference_no, rejection_reason, remarks } = req.body;

        const validStatuses = Object.values(CLAIM_STATUS);
        if (!validStatuses.includes(status)) {
            return errorResponse(res, `Invalid status. Must be: ${validStatuses.join(', ')}`, 400);
        }

        const existing = await query('SELECT * FROM tpa_claims WHERE id = $1', [req.params.id]);
        if (existing.rows.length === 0) return errorResponse(res, 'Claim not found.', 404);

        const isSubmission = status === 'Submitted';

        const result = await query(
            `UPDATE tpa_claims SET
             status = $1,
             approved_amount = COALESCE($2, approved_amount),
             tpa_reference_no = COALESCE($3, tpa_reference_no),
             rejection_reason = COALESCE($4, rejection_reason),
             remarks = COALESCE($5, remarks),
             submitted_at = CASE WHEN $6 THEN NOW() ELSE submitted_at END,
             updated_at = NOW()
             WHERE id = $7 RETURNING *`,
            [status, approved_amount, tpa_reference_no, rejection_reason, remarks,
                isSubmission, req.params.id]
        );

        await req.audit('UPDATE_CLAIM_STATUS', 'TPA_Claim', parseInt(req.params.id),
            { status: existing.rows[0].status }, { status });
        return successResponse(res, result.rows[0], `Claim status updated to ${status}.`);
    } catch (err) {
        return errorResponse(res, 'Failed to update claim status.', 500);
    }
});

/**
 * PATCH /api/tpa/claims/:id/settle
 * Body: { settled_amount, tds_deducted?, settlement_utr, disallowance_amount? }
 */
router.patch('/claims/:id/settle', authorize(TPA_ROLES), async (req, res) => {
    const client = await getClient();
    try {
        await client.query('BEGIN');

        const { settled_amount, tds_deducted, settlement_utr, disallowance_amount } = req.body;

        if (!settled_amount || !settlement_utr) {
            return errorResponse(res, 'Settled amount and UTR are required.', 400);
        }

        const existing = await client.query('SELECT * FROM tpa_claims WHERE id = $1', [req.params.id]);
        if (existing.rows.length === 0) {
            await client.query('ROLLBACK');
            return errorResponse(res, 'Claim not found.', 404);
        }

        const claim = existing.rows[0];
        const disallowance = parseFloat(disallowance_amount) || 0;
        const patientPayable = claim.co_payment_amount + claim.deductible_amount + disallowance;
        const newStatus = settled_amount >= (claim.total_bill_amount - patientPayable) ? 'Settled' : 'Partially Settled';

        // Update claim
        const result = await client.query(
            `UPDATE tpa_claims SET
             settled_amount = $1, tds_deducted = COALESCE($2, tds_deducted),
             settlement_utr = $3, settlement_date = CURRENT_DATE,
             disallowance_amount = $4, patient_payable = $5,
             status = $6, updated_at = NOW()
             WHERE id = $7 RETURNING *`,
            [settled_amount, tds_deducted || 0, settlement_utr, disallowance,
                patientPayable, newStatus, req.params.id]
        );

        // Deduct from policy balance
        await client.query(
            `UPDATE insurance_policies SET
             balance_available = balance_available - $1, updated_at = NOW()
             WHERE id = $2`,
            [settled_amount, claim.insurance_policy_id]
        );

        // Update billing if linked
        if (claim.billing_id) {
            await client.query(
                `UPDATE billing SET
                 tpa_claim_id = $1, insurance_covered = $2,
                 co_payment_amount = $3, deductible_applied = $4,
                 patient_net_payable = $5, updated_at = NOW()
                 WHERE id = $6`,
                [parseInt(req.params.id), settled_amount,
                claim.co_payment_amount, claim.deductible_amount,
                    patientPayable, claim.billing_id]
            );
        }

        await client.query('COMMIT');

        await req.audit('SETTLE_CLAIM', 'TPA_Claim', parseInt(req.params.id),
            { status: claim.status }, { status: newStatus, settled_amount, settlement_utr });
        return successResponse(res, result.rows[0], `Claim ${newStatus.toLowerCase()}. UTR: ${settlement_utr}`);
    } catch (err) {
        await client.query('ROLLBACK');
        return errorResponse(res, 'Failed to settle claim.', 500);
    } finally {
        client.release();
    }
});

// ═══════════════════════════════════════════
//  TARIFF MASTER
// ═══════════════════════════════════════════

/**
 * GET /api/tpa/tariffs
 */
router.get('/tariffs', authorize(TPA_ROLES), async (req, res) => {
    try {
        const { panel_type, item_type, search } = req.query;
        let where = 'WHERE t.is_active = TRUE AND (t.effective_to IS NULL OR t.effective_to >= CURRENT_DATE)';
        const params = [];

        if (panel_type) { params.push(panel_type); where += ` AND t.panel_type = $${params.length}`; }
        if (item_type) { params.push(item_type); where += ` AND t.item_type = $${params.length}`; }
        if (search) { params.push(`%${search}%`); where += ` AND t.procedure_name ILIKE $${params.length}`; }

        const result = await query(
            `SELECT t.*, tv.name AS vendor_name
             FROM tariff_master t
             LEFT JOIN tpa_vendors tv ON tv.id = t.tpa_vendor_id
             ${where}
             ORDER BY t.panel_type, t.item_type, t.procedure_name`,
            params
        );

        return successResponse(res, result.rows);
    } catch (err) {
        return errorResponse(res, 'Failed to fetch tariffs.', 500);
    }
});

/**
 * GET /api/tpa/tariffs/apply
 * Query: { panel_type, item_type, procedure_name? }
 * Returns applicable tariff rates for auto-fill during billing
 */
router.get('/tariffs/apply', authorize(TPA_ROLES), async (req, res) => {
    try {
        const { panel_type, item_type, procedure_name } = req.query;

        if (!panel_type || !item_type) {
            return errorResponse(res, 'Panel type and item type are required.', 400);
        }

        let where = `WHERE t.is_active = TRUE 
                      AND t.panel_type = $1 AND t.item_type = $2
                      AND (t.effective_to IS NULL OR t.effective_to >= CURRENT_DATE)`;
        const params = [panel_type, item_type];

        if (procedure_name) {
            params.push(`%${procedure_name}%`);
            where += ` AND t.procedure_name ILIKE $${params.length}`;
        }

        const result = await query(
            `SELECT t.tariff_code, t.procedure_name, t.procedure_code,
                    t.nabh_rate, t.non_nabh_rate, t.hospital_rate,
                    t.panel_type, t.item_type
             FROM tariff_master t ${where}
             ORDER BY t.procedure_name
             LIMIT 50`,
            params
        );

        return successResponse(res, result.rows);
    } catch (err) {
        return errorResponse(res, 'Failed to apply tariff.', 500);
    }
});

/**
 * POST /api/tpa/tariffs
 */
router.post('/tariffs', authorize(['Super', 'Hospital']), async (req, res) => {
    try {
        const { tariff_code, panel_type, tpa_vendor_id, item_type, procedure_name,
            procedure_code, nabh_rate, non_nabh_rate, hospital_rate, effective_from, effective_to } = req.body;

        if (!tariff_code || !panel_type || !item_type || !procedure_name) {
            return errorResponse(res, 'Tariff code, panel type, item type, and procedure name are required.', 400);
        }

        const result = await query(
            `INSERT INTO tariff_master
             (tariff_code, panel_type, tpa_vendor_id, item_type, procedure_name,
              procedure_code, nabh_rate, non_nabh_rate, hospital_rate, effective_from, effective_to)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
            [tariff_code, panel_type, tpa_vendor_id || null, item_type, procedure_name,
                procedure_code || null, nabh_rate || null, non_nabh_rate || null, hospital_rate || null,
                effective_from || new Date().toISOString().slice(0, 10), effective_to || null]
        );

        await req.audit('CREATE_TARIFF', 'Tariff', result.rows[0].id, null, result.rows[0]);
        return successResponse(res, result.rows[0], 'Tariff entry created.', 201);
    } catch (err) {
        if (err.code === '23505') return errorResponse(res, 'Tariff code + panel + effective date already exists.', 409);
        return errorResponse(res, 'Failed to create tariff.', 500);
    }
});

/**
 * PUT /api/tpa/tariffs/:id
 */
router.put('/tariffs/:id', authorize(['Super', 'Hospital']), async (req, res) => {
    try {
        const existing = await query('SELECT * FROM tariff_master WHERE id = $1', [req.params.id]);
        if (existing.rows.length === 0) return errorResponse(res, 'Tariff not found.', 404);

        const { nabh_rate, non_nabh_rate, hospital_rate, effective_to, is_active } = req.body;

        const result = await query(
            `UPDATE tariff_master SET
             nabh_rate = COALESCE($1, nabh_rate), non_nabh_rate = COALESCE($2, non_nabh_rate),
             hospital_rate = COALESCE($3, hospital_rate), effective_to = COALESCE($4, effective_to),
             is_active = COALESCE($5, is_active), updated_at = NOW()
             WHERE id = $6 RETURNING *`,
            [nabh_rate, non_nabh_rate, hospital_rate, effective_to, is_active, req.params.id]
        );

        await req.audit('UPDATE_TARIFF', 'Tariff', parseInt(req.params.id), existing.rows[0], result.rows[0]);
        return successResponse(res, result.rows[0], 'Tariff updated.');
    } catch (err) {
        return errorResponse(res, 'Failed to update tariff.', 500);
    }
});

module.exports = router;
