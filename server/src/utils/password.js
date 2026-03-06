/**
 * Password Hashing Utility
 * 
 * Uses bcrypt for password hashing with configurable salt rounds.
 * Includes password strength validation per hospital security policy.
 */

const bcrypt = require('bcrypt');
const crypto = require('crypto');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;

/**
 * Hash a password with a unique salt
 * @param {string} plainPassword - Raw password
 * @returns {Promise<{hash: string, salt: string}>}
 */
async function hashPassword(plainPassword) {
    const salt = crypto.randomBytes(32).toString('hex');
    // bcrypt generates its own salt internally; we store an additional application-level salt
    const combined = plainPassword + salt;
    const hash = await bcrypt.hash(combined, SALT_ROUNDS);
    return { hash, salt };
}

/**
 * Verify a password against stored hash and salt
 * @param {string} plainPassword - Candidate password
 * @param {string} storedHash - bcrypt hash from DB
 * @param {string} storedSalt - Application-level salt from DB
 * @returns {Promise<boolean>}
 */
async function verifyPassword(plainPassword, storedHash, storedSalt) {
    const combined = plainPassword + storedSalt;
    return bcrypt.compare(combined, storedHash);
}

/**
 * Validate password strength per hospital security policy
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 digit
 * - At least 1 special character
 * 
 * @param {string} password 
 * @returns {{valid: boolean, errors: string[]}}
 */
function validatePasswordStrength(password) {
    const errors = [];

    if (!password || password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one digit');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }

    return { valid: errors.length === 0, errors };
}

module.exports = { hashPassword, verifyPassword, validatePasswordStrength };
