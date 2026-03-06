/**
 * JWT Helper Utilities
 * 
 * Handles token generation, verification, and refresh token management.
 * Uses RS256-style secrets (via HS256 with strong symmetric keys).
 */

require('dotenv').config();
const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

/**
 * Generate an access token
 * @param {Object} payload - { employee_code, user_type, user_ref_id, department_id, role }
 * @returns {string} Signed JWT
 */
function generateAccessToken(payload) {
    return jwt.sign(
        {
            employee_code: payload.employee_code,
            user_type: payload.user_type,
            user_ref_id: payload.user_ref_id,
            department_id: payload.department_id,
            role: payload.role,
        },
        ACCESS_SECRET,
        { expiresIn: ACCESS_EXPIRY, issuer: 'hms-api' }
    );
}

/**
 * Generate a refresh token
 * @param {Object} payload - { employee_code }
 * @returns {string} Signed JWT
 */
function generateRefreshToken(payload) {
    return jwt.sign(
        { employee_code: payload.employee_code },
        REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRY, issuer: 'hms-api' }
    );
}

/**
 * Verify an access token
 * @param {string} token 
 * @returns {Object} Decoded payload
 * @throws {jwt.JsonWebTokenError|jwt.TokenExpiredError}
 */
function verifyAccessToken(token) {
    return jwt.verify(token, ACCESS_SECRET, { issuer: 'hms-api' });
}

/**
 * Verify a refresh token
 * @param {string} token 
 * @returns {Object} Decoded payload
 * @throws {jwt.JsonWebTokenError|jwt.TokenExpiredError}
 */
function verifyRefreshToken(token) {
    return jwt.verify(token, REFRESH_SECRET, { issuer: 'hms-api' });
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
};
