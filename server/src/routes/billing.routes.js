/**
 * Billing Routes
 * 
 * GET    /api/billing              — List invoices (paginated)
 * GET    /api/billing/:id          — Get invoice with line items
 * POST   /api/billing              — Create invoice with items
 * PATCH  /api/billing/:id/payment  — Record payment
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { auditMiddleware } = require('../middleware/audit');
const { query, getClient } = require('../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { PAGINATION, PAYMENT_STATUS } = require('../config/constants');
const { v4: uuidv4 } = require('uuid');

router.use(authenticate);
router.use(auditMiddleware);

/**
 * GET /api/billing
 */
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(parseInt(req.query.limit, 10) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
        const offset = (page - 1) * limit;
        const { patient_id, payment_status } = req.query;

        let whereClause = 'WHERE 1=1';
        const params = [];

        if (patient_id) { params.push(patient_id); whereClause += ` AND b.patient_id = $${params.length}`; }
        if (payment_status) { params.push(payment_status); whereClause += ` AND b.payment_status = $${params.length}`; }

        const countResult = await query(`SELECT COUNT(*) FROM billing b ${whereClause}`, params);
        const total = parseInt(countResult.rows[0].count, 10);

        params.push(limit, offset);
        const dataResult = await query(
            `SELECT b.*, p.first_name AS patient_name, p.last_name AS patient_last_name, p.uhid
       FROM billing b
       JOIN patients p ON p.id = b.patient_id
       ${whereClause}
       ORDER BY b.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
            params
        );

        return paginatedResponse(res, dataResult.rows, total, page, limit);
    } catch (err) {
        return errorResponse(res, 'Failed to fetch billing records.', 500);
    }
});

/**
 * GET /api/billing/:id — Invoice with line items
 */
router.get('/:id', async (req, res) => {
    try {
        const invoiceResult = await query(
            `SELECT b.*, p.first_name AS patient_name, p.last_name AS patient_last_name, p.uhid
       FROM billing b JOIN patients p ON p.id = b.patient_id
       WHERE b.id = $1`, [req.params.id]
        );

        if (invoiceResult.rows.length === 0) return errorResponse(res, 'Invoice not found.', 404);

        const itemsResult = await query(
            `SELECT * FROM billing_items WHERE billing_id = $1 ORDER BY id`, [req.params.id]
        );

        return successResponse(res, { ...invoiceResult.rows[0], items: itemsResult.rows });
    } catch (err) {
        return errorResponse(res, 'Failed to fetch invoice.', 500);
    }
});

/**
 * POST /api/billing — Create invoice with line items
 * Body: { patient_id, admission_id?, items: [{item_type, description, quantity, unit_price}], discount?, payment_mode? }
 */
router.post('/',
    authorize(['Super', 'Hospital', 'Receptionist']),
    async (req, res) => {
        const client = await getClient();
        try {
            await client.query('BEGIN');

            const { patient_id, admission_id, items, discount, payment_mode } = req.body;

            if (!patient_id || !items || items.length === 0) {
                return errorResponse(res, 'Patient and at least one billing item are required.', 400);
            }

            // Calculate totals
            let totalAmount = 0;
            for (const item of items) {
                item.total_price = (item.quantity || 1) * item.unit_price;
                totalAmount += item.total_price;
            }

            const discountAmount = parseFloat(discount) || 0;
            const taxRate = 0.05; // 5% GST
            const taxableAmount = totalAmount - discountAmount;
            const taxAmount = Math.round(taxableAmount * taxRate * 100) / 100;
            const netAmount = taxableAmount + taxAmount;

            const invoiceNo = `INV-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 4).toUpperCase()}`;

            const invoiceResult = await client.query(
                `INSERT INTO billing 
           (invoice_no, patient_id, admission_id, total_amount, discount, tax_amount, 
            net_amount, payment_mode, generated_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
                [invoiceNo, patient_id, admission_id || null, totalAmount, discountAmount,
                    taxAmount, netAmount, payment_mode, req.user.employee_code]
            );

            const billingId = invoiceResult.rows[0].id;

            // Insert line items
            for (const item of items) {
                await client.query(
                    `INSERT INTO billing_items (billing_id, item_type, description, quantity, unit_price, total_price)
           VALUES ($1,$2,$3,$4,$5,$6)`,
                    [billingId, item.item_type, item.description, item.quantity || 1, item.unit_price, item.total_price]
                );
            }

            await client.query('COMMIT');

            await req.audit('CREATE_INVOICE', 'Billing', billingId, null, invoiceResult.rows[0]);
            return successResponse(res, invoiceResult.rows[0], 'Invoice created successfully.', 201);
        } catch (err) {
            await client.query('ROLLBACK');
            return errorResponse(res, 'Failed to create invoice.', 500);
        } finally {
            client.release();
        }
    }
);

/**
 * PATCH /api/billing/:id/payment — Record payment
 * Body: { payment_status, payment_mode }
 */
router.patch('/:id/payment',
    authorize(['Super', 'Hospital', 'Receptionist']),
    async (req, res) => {
        try {
            const { payment_status, payment_mode } = req.body;
            const validStatuses = Object.values(PAYMENT_STATUS);

            if (!validStatuses.includes(payment_status)) {
                return errorResponse(res, `Invalid payment status. Must be one of: ${validStatuses.join(', ')}`, 400);
            }

            const existing = await query(`SELECT * FROM billing WHERE id = $1`, [req.params.id]);
            if (existing.rows.length === 0) return errorResponse(res, 'Invoice not found.', 404);

            const result = await query(
                `UPDATE billing SET payment_status = $1, payment_mode = COALESCE($2, payment_mode) WHERE id = $3 RETURNING *`,
                [payment_status, payment_mode, req.params.id]
            );

            await req.audit('RECORD_PAYMENT', 'Billing', parseInt(req.params.id),
                { payment_status: existing.rows[0].payment_status }, { payment_status, payment_mode });

            return successResponse(res, result.rows[0], 'Payment recorded successfully.');
        } catch (err) {
            return errorResponse(res, 'Failed to record payment.', 500);
        }
    }
);

module.exports = router;
