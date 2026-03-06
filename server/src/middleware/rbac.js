/**
 * Role-Based Access Control (RBAC) Middleware
 * 
 * Provides fine-grained permission guards based on user_type and role.
 * Usage: router.get('/admin', authenticate, authorize(['Super', 'Hospital']), handler)
 */

const { errorResponse } = require('../utils/response');

/**
 * Check if user has one of the allowed roles (access_level for Admins, role for Staff)
 * @param {string[]} allowedRoles - Array of permitted roles
 * @returns {Function} Express middleware
 */
function authorize(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return errorResponse(res, 'Authentication required.', 401);
        }

        const { user_type, role } = req.user;

        // Determine the effective role based on user type
        let effectiveRole;
        if (user_type === 'Admin') {
            effectiveRole = role; // 'Super', 'Super Admin', 'Hospital', 'Department'
            if (effectiveRole === 'Super Admin') effectiveRole = 'Super';
        } else if (user_type === 'Doctor') {
            effectiveRole = 'Doctor';
        } else if (user_type === 'Staff') {
            effectiveRole = role; // 'Nurse', 'Receptionist', 'Technician', etc.
        }

        if (!allowedRoles.includes(effectiveRole)) {
            return errorResponse(
                res,
                `Access denied. Required role: [${allowedRoles.join(', ')}]. Your role: ${effectiveRole}.`,
                403
            );
        }

        next();
    };
}

/**
 * Restrict access to the user's own department only
 * Admins with 'Super' or 'Hospital' access bypass this check.
 * @returns {Function} Express middleware
 */
function restrictToDepartment() {
    return (req, res, next) => {
        if (!req.user) {
            return errorResponse(res, 'Authentication required.', 401);
        }

        const { role, department_id } = req.user;

        // Super and Hospital admins can access all departments
        if (role === 'Super' || role === 'Super Admin' || role === 'Hospital') {
            return next();
        }

        // For department-scoped users, verify the requested department matches
        const requestedDeptId = parseInt(req.params.departmentId || req.body.department_id, 10);

        if (requestedDeptId && requestedDeptId !== department_id) {
            return errorResponse(
                res,
                'Access denied. You can only access resources in your own department.',
                403
            );
        }

        next();
    };
}

/**
 * Restrict doctors to only access/modify their own records
 * @returns {Function} Express middleware
 */
function restrictToOwnRecords() {
    return (req, res, next) => {
        if (!req.user) {
            return errorResponse(res, 'Authentication required.', 401);
        }

        const { user_type, user_ref_id, role } = req.user;

        // Admins bypass
        if (role === 'Super' || role === 'Super Admin' || role === 'Hospital') {
            return next();
        }

        // Doctors can only edit their own medical records
        if (user_type === 'Doctor') {
            const requestedDoctorId = parseInt(req.params.doctorId || req.body.doctor_id, 10);
            if (requestedDoctorId && requestedDoctorId !== user_ref_id) {
                return errorResponse(res, 'You can only access your own records.', 403);
            }
        }

        next();
    };
}

/**
 * Deny INSERT operations (POST method) for specific roles.
 * Other HTTP methods (GET, PUT, PATCH) pass through.
 * @param  {...string} deniedRoles - Roles that cannot perform POST
 * @returns {Function} Express middleware
 */
function denyInsert(...deniedRoles) {
    return (req, res, next) => {
        if (!req.user) return errorResponse(res, 'Authentication required.', 401);

        const { user_type, role } = req.user;
        let effectiveRole = role;
        if (user_type === 'Admin' && (role === 'Super Admin')) effectiveRole = 'Super';
        if (user_type === 'Doctor') effectiveRole = 'Doctor';

        if (req.method === 'POST' && deniedRoles.includes(effectiveRole)) {
            return errorResponse(
                res,
                `Access denied. Your role '${effectiveRole}' is not authorized to create new records via this endpoint.`,
                403
            );
        }
        next();
    };
}

/**
 * Block Accounts/Finance role from accessing non-financial resources.
 * @returns {Function} Express middleware
 */
function denyNonFinancial() {
    return (req, res, next) => {
        if (!req.user) return errorResponse(res, 'Authentication required.', 401);

        const effectiveRole = req.user.user_type === 'Staff' ? req.user.role : req.user.role;

        if (effectiveRole === 'Accounts/Finance') {
            return errorResponse(
                res,
                'Access denied. Accounts/Finance role can only access financial resources (Billing, TPA).',
                403
            );
        }
        next();
    };
}

module.exports = { authorize, restrictToDepartment, restrictToOwnRecords, denyInsert, denyNonFinancial };
