/**
 * Authentication Routes
 * 
 * POST /api/auth/login          — Employee Code + Password login
 * POST /api/auth/refresh        — Refresh access token
 * POST /api/auth/change-password — Change password (authenticated)
 * POST /api/auth/logout         — Clear session cookies
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { auditMiddleware } = require('../middleware/audit');
const authService = require('../services/auth.service');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * POST /api/auth/login
 * Body: { employee_code, password }
 */
router.post('/login', authLimiter, auditMiddleware, async (req, res) => {
    try {
        const { employee_code, password } = req.body;

        if (!employee_code || !password) {
            return errorResponse(res, 'Employee Code and password are required.', 400);
        }

        const result = await authService.login(employee_code, password);

        // Set HttpOnly cookies
        res.cookie('access_token', result.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000, // 15 minutes
        });

        res.cookie('refresh_token', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/api/auth/refresh',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        // Audit log
        await req.audit('LOGIN_SUCCESS', 'Auth', null, null, {
            employee_code: result.user.employee_code,
            user_type: result.user.user_type,
        });

        return successResponse(res, {
            user: result.user,
            mustChangePassword: result.mustChangePassword,
        }, 'Login successful.');
    } catch (err) {
        // Audit failed login
        if (req.body?.employee_code) {
            await req.audit('LOGIN_FAILED', 'Auth', null, null, {
                employee_code: req.body.employee_code,
                reason: err.message,
            });
        }
        return errorResponse(res, err.message || 'Login failed.', err.status || 500);
    }
});

/**
 * POST /api/auth/refresh
 */
router.post('/refresh', async (req, res) => {
    try {
        const refreshToken = req.cookies?.refresh_token;

        if (!refreshToken) {
            return errorResponse(res, 'Refresh token not found. Please log in again.', 401);
        }

        const result = await authService.refreshAccessToken(refreshToken);

        res.cookie('access_token', result.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000,
        });

        return successResponse(res, null, 'Token refreshed.');
    } catch (err) {
        return errorResponse(res, err.message || 'Token refresh failed.', err.status || 401);
    }
});

/**
 * POST /api/auth/change-password
 * Body: { current_password, new_password }
 */
router.post('/change-password', authenticate, auditMiddleware, async (req, res) => {
    try {
        const { current_password, new_password } = req.body;

        if (!current_password || !new_password) {
            return errorResponse(res, 'Current password and new password are required.', 400);
        }

        await authService.changePassword(req.user.employee_code, current_password, new_password);

        await req.audit('PASSWORD_CHANGED', 'Auth', null, null, {
            employee_code: req.user.employee_code,
        });

        return successResponse(res, null, 'Password changed successfully.');
    } catch (err) {
        return errorResponse(res, err.message || 'Password change failed.', err.status || 500, err.errors);
    }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', authenticate, auditMiddleware, async (req, res) => {
    await req.audit('LOGOUT', 'Auth', null, null, {
        employee_code: req.user.employee_code,
    });

    res.clearCookie('access_token');
    res.clearCookie('refresh_token', { path: '/api/auth/refresh' });

    return successResponse(res, null, 'Logged out successfully.');
});

module.exports = router;
