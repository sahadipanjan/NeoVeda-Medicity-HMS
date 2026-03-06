/**
 * Authentication Middleware
 * 
 * Verifies JWT access tokens from HttpOnly cookies or Authorization header.
 * Attaches decoded user payload to req.user on success.
 * Sets req.dbContext for RLS session variable injection.
 */

const { verifyAccessToken } = require('../utils/jwt');
const { errorResponse } = require('../utils/response');

/**
 * Authenticate incoming requests
 * Priority: 1) HttpOnly cookie  2) Authorization: Bearer <token>
 */
function authenticate(req, res, next) {
    let token = null;

    // 1. Check HttpOnly cookie
    if (req.cookies && req.cookies.access_token) {
        token = req.cookies.access_token;
    }

    // 2. Fallback to Authorization header
    if (!token) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.slice(7);
        }
    }

    if (!token) {
        return errorResponse(res, 'Authentication required. Please log in with your Employee Code.', 401);
    }

    try {
        const decoded = verifyAccessToken(token);
        req.user = {
            employee_code: decoded.employee_code,
            user_type: decoded.user_type,
            user_ref_id: decoded.user_ref_id,
            department_id: decoded.department_id,
            role: decoded.role,
        };

        // Set RLS context for database queries
        req.dbContext = {
            user_type: decoded.user_type,
            role: decoded.role,
            department_id: decoded.department_id,
            user_ref_id: decoded.user_ref_id,
            employee_code: decoded.employee_code,
        };

        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return errorResponse(res, 'Session expired. Please log in again.', 401);
        }
        return errorResponse(res, 'Invalid authentication token.', 401);
    }
}

module.exports = { authenticate };
