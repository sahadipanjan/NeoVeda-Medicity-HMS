/**
 * Rate Limiter Middleware
 * 
 * Protects auth endpoints from brute-force attacks.
 * Uses express-rate-limit with configurable windows.
 */

const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter
 * 100 requests per 15-minute window
 */
const apiLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests. Please try again later.',
    },
});

/**
 * Strict auth rate limiter
 * 10 login attempts per 15-minute window per IP
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: {
        success: false,
        message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
    },
});

module.exports = { apiLimiter, authLimiter };
