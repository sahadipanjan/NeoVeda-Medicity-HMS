/**
 * Admin Routes
 * 
 * GET    /api/admin/dashboard     — System analytics dashboard
 * GET    /api/admin/departments   — List all departments
 * GET    /api/admin/audit-logs    — View audit trail
 * POST   /api/admin/staff         — Register new staff member
 * POST   /api/admin/admins        — Register new admin
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { auditMiddleware } = require('../middleware/audit');
const { query } = require('../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { PAGINATION } = require('../config/constants');
const authService = require('../services/auth.service');

router.use(authenticate);
router.use(auditMiddleware);

/**
 * GET /api/admin/dashboard — System-wide analytics
 */
router.get('/dashboard',
    authorize(['Super', 'Hospital']),
    async (req, res) => {
        try {
            const [patients, doctors, staff, appointments, admissions, billing] = await Promise.all([
                query(`SELECT COUNT(*) FROM patients WHERE is_active = TRUE`),
                query(`SELECT COUNT(*) FROM doctors WHERE is_active = TRUE`),
                query(`SELECT COUNT(*) FROM staff WHERE is_active = TRUE`),
                query(`SELECT 
                 COUNT(*) FILTER (WHERE status = 'Scheduled') AS scheduled,
                 COUNT(*) FILTER (WHERE status = 'Completed') AS completed,
                 COUNT(*) FILTER (WHERE appointment_date = CURRENT_DATE) AS today
               FROM appointments`),
                query(`SELECT 
                 COUNT(*) FILTER (WHERE status = 'Active') AS active_admissions,
                 (SELECT COUNT(*) FROM beds WHERE status = 'Available') AS available_beds,
                 (SELECT COUNT(*) FROM beds WHERE status = 'Occupied') AS occupied_beds
               FROM admissions`),
                query(`SELECT 
                 COUNT(*) AS total_invoices,
                 COALESCE(SUM(net_amount) FILTER (WHERE payment_status = 'Paid'), 0) AS total_collected,
                 COALESCE(SUM(net_amount) FILTER (WHERE payment_status = 'Pending'), 0) AS total_pending
               FROM billing`),
            ]);

            return successResponse(res, {
                patients: { total: parseInt(patients.rows[0].count) },
                doctors: { total: parseInt(doctors.rows[0].count) },
                staff: { total: parseInt(staff.rows[0].count) },
                appointments: appointments.rows[0],
                admissions: admissions.rows[0],
                billing: billing.rows[0],
            });
        } catch (err) {
            return errorResponse(res, 'Failed to fetch dashboard data.', 500);
        }
    }
);

/**
 * GET /api/admin/department-stats — Department-scoped analytics for non-admin dashboards
 */
router.get('/department-stats', async (req, res) => {
    try {
        const deptId = parseInt(req.query.department_id, 10);

        if (!deptId || isNaN(deptId)) {
            return errorResponse(res, 'Valid department_id is required.', 400);
        }

        // Department info + HOD
        const deptResult = await query(
            `SELECT d.name AS department_name, d.code AS department_code,
                    doc.first_name || ' ' || doc.last_name AS hod_name
             FROM departments d
             LEFT JOIN doctors doc ON doc.id = d.hod_doctor_id
             WHERE d.id = $1 AND d.is_active = TRUE`,
            [deptId]
        );

        if (deptResult.rows.length === 0) {
            return errorResponse(res, 'Department not found.', 404);
        }

        const dept = deptResult.rows[0];

        // Counts scoped to department
        const [doctors, staff, appointments, beds] = await Promise.all([
            query(`SELECT COUNT(*) FROM doctors WHERE department_id = $1 AND is_active = TRUE`, [deptId]),
            query(`SELECT COUNT(*) FROM staff WHERE department_id = $1 AND is_active = TRUE`, [deptId]),
            query(`SELECT
                     COUNT(*) FILTER (WHERE a.appointment_date = CURRENT_DATE) AS today,
                     COUNT(*) FILTER (WHERE a.status = 'Scheduled') AS scheduled,
                     COUNT(*) FILTER (WHERE a.status = 'Completed') AS completed
                   FROM appointments a
                   JOIN doctors doc ON doc.id = a.doctor_id
                   WHERE doc.department_id = $1`, [deptId]),
            query(`SELECT
                     COUNT(*) FILTER (WHERE b.status = 'Available') AS available,
                     COUNT(*) FILTER (WHERE b.status = 'Occupied') AS occupied
                   FROM beds b
                   JOIN wards w ON w.id = b.ward_id
                   WHERE w.department_id = $1`, [deptId]),
        ]);

        // Active patients = currently admitted to this department's wards
        const activePatients = await query(
            `SELECT COUNT(DISTINCT adm.patient_id)
             FROM admissions adm
             JOIN beds b ON b.id = adm.bed_id
             JOIN wards w ON w.id = b.ward_id
             WHERE w.department_id = $1 AND adm.status = 'Active'`, [deptId]
        );

        return successResponse(res, {
            department_name: dept.department_name,
            department_code: dept.department_code,
            hod_name: dept.hod_name,
            doctor_count: parseInt(doctors.rows[0].count),
            staff_count: parseInt(staff.rows[0].count),
            today_appointments: parseInt(appointments.rows[0].today || 0),
            scheduled_appointments: parseInt(appointments.rows[0].scheduled || 0),
            completed_appointments: parseInt(appointments.rows[0].completed || 0),
            available_beds: parseInt(beds.rows[0].available || 0),
            occupied_beds: parseInt(beds.rows[0].occupied || 0),
            active_patients: parseInt(activePatients.rows[0].count || 0),
        });
    } catch (err) {
        return errorResponse(res, 'Failed to fetch department stats.', 500);
    }
});

/**
 * GET /api/admin/departments — All departments
 */
router.get('/departments', async (req, res) => {
    try {
        const result = await query(
            `SELECT d.*, 
              doc.first_name AS hod_first_name, doc.last_name AS hod_last_name,
              (SELECT COUNT(*) FROM doctors WHERE department_id = d.id AND is_active = TRUE) AS doctor_count,
              (SELECT COUNT(*) FROM staff WHERE department_id = d.id AND is_active = TRUE) AS staff_count
       FROM departments d
       LEFT JOIN doctors doc ON doc.id = d.hod_doctor_id
       WHERE d.is_active = TRUE
       ORDER BY d.name`
        );

        return successResponse(res, result.rows);
    } catch (err) {
        return errorResponse(res, 'Failed to fetch departments.', 500);
    }
});

/**
 * GET /api/admin/audit-logs — Audit trail with filters
 */
router.get('/audit-logs',
    authorize(['Super', 'Hospital']),
    async (req, res) => {
        try {
            const page = parseInt(req.query.page, 10) || PAGINATION.DEFAULT_PAGE;
            const limit = Math.min(parseInt(req.query.limit, 10) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
            const offset = (page - 1) * limit;
            const { employee_code, action, entity_type } = req.query;

            let whereClause = 'WHERE 1=1';
            const params = [];

            if (employee_code) { params.push(employee_code); whereClause += ` AND employee_code = $${params.length}`; }
            if (action) { params.push(action); whereClause += ` AND action = $${params.length}`; }
            if (entity_type) { params.push(entity_type); whereClause += ` AND entity_type = $${params.length}`; }

            const countResult = await query(`SELECT COUNT(*) FROM audit_logs ${whereClause}`, params);
            const total = parseInt(countResult.rows[0].count, 10);

            params.push(limit, offset);
            const dataResult = await query(
                `SELECT * FROM audit_logs ${whereClause} ORDER BY created_at DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
                params
            );

            return paginatedResponse(res, dataResult.rows, total, page, limit);
        } catch (err) {
            return errorResponse(res, 'Failed to fetch audit logs.', 500);
        }
    }
);

/**
 * POST /api/admin/staff — Register new staff member with auth credentials
 */
router.post('/staff',
    authorize(['Super', 'Hospital', 'Department']),
    async (req, res) => {
        try {
            const {
                first_name, last_name, role, department_id, phone, email, shift, joined_date, password,
            } = req.body;

            if (!first_name || !last_name || !role || !password) {
                return errorResponse(res, 'First name, last name, role, and password are required.', 400);
            }

            // Get dept code
            let deptCode = 'GENL';
            if (department_id) {
                const dept = await query('SELECT code FROM departments WHERE id = $1', [department_id]);
                if (dept.rows.length > 0) deptCode = dept.rows[0].code;
            }

            const staffResult = await query(
                `INSERT INTO staff (first_name, last_name, role, department_id, phone, email, shift, joined_date, employee_code)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'TEMP') RETURNING *`,
                [first_name, last_name, role, department_id, phone, email, shift, joined_date]
            );

            const staffMember = staffResult.rows[0];

            const { employeeCode } = await authService.registerCredentials({
                userType: 'Staff',
                userRefId: staffMember.id,
                deptCode,
                password,
            });

            await query(`UPDATE staff SET employee_code = $1 WHERE id = $2`, [employeeCode, staffMember.id]);
            staffMember.employee_code = employeeCode;

            await req.audit('CREATE_STAFF', 'Staff', staffMember.id, null, staffMember);
            return successResponse(res, staffMember, 'Staff member registered successfully.', 201);
        } catch (err) {
            return errorResponse(res, err.message || 'Failed to register staff.', err.status || 500, err.errors);
        }
    }
);

/**
 * POST /api/admin/admins — Register new admin
 */
router.post('/admins',
    authorize(['Super']),
    async (req, res) => {
        try {
            const { first_name, last_name, email, phone, access_level, department_id, password } = req.body;

            if (!first_name || !last_name || !email || !access_level || !password) {
                return errorResponse(res, 'First name, last name, email, access level, and password are required.', 400);
            }

            const adminResult = await query(
                `INSERT INTO admins (first_name, last_name, email, phone, access_level, department_id, employee_code)
         VALUES ($1,$2,$3,$4,$5,$6,'TEMP') RETURNING *`,
                [first_name, last_name, email, phone, access_level, department_id]
            );

            const admin = adminResult.rows[0];

            const { employeeCode } = await authService.registerCredentials({
                userType: 'Admin',
                userRefId: admin.id,
                deptCode: 'ADMN',
                password,
            });

            await query(`UPDATE admins SET employee_code = $1 WHERE id = $2`, [employeeCode, admin.id]);
            admin.employee_code = employeeCode;

            await req.audit('CREATE_ADMIN', 'Admin', admin.id, null, admin);
            return successResponse(res, admin, 'Admin registered successfully.', 201);
        } catch (err) {
            return errorResponse(res, err.message || 'Failed to register admin.', err.status || 500, err.errors);
        }
    }
);

module.exports = router;
