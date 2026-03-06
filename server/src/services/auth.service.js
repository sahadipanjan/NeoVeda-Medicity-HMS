/**
 * Authentication Service
 * 
 * Core auth logic: login, register credentials, refresh tokens, password reset.
 * All auth operations go through this service.
 */

const { query, getClient } = require('../config/database');
const { hashPassword, verifyPassword, validatePasswordStrength } = require('../utils/password');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { generateEmployeeCode, isValidEmployeeCode } = require('../utils/employeeCode');
const { AUTH } = require('../config/constants');

/**
 * Authenticate a user with Employee Code + Password
 * @param {string} employeeCode 
 * @param {string} password 
 * @returns {Promise<{accessToken, refreshToken, user}>}
 */
async function login(employeeCode, password) {
    if (!isValidEmployeeCode(employeeCode)) {
        throw { status: 400, message: 'Invalid Employee Code format. Expected: EMP-XXXX-00000' };
    }

    // Fetch credentials
    const credResult = await query(
        `SELECT id, employee_code, password_hash, salt, user_type, user_ref_id,
            failed_attempts, locked_until, must_change_password
     FROM auth_credentials WHERE employee_code = $1`,
        [employeeCode]
    );

    if (credResult.rows.length === 0) {
        throw { status: 401, message: 'Invalid Employee Code or password.' };
    }

    const cred = credResult.rows[0];

    // Check account lockout
    if (cred.locked_until && new Date(cred.locked_until) > new Date()) {
        const minutesLeft = Math.ceil((new Date(cred.locked_until) - new Date()) / 60000);
        throw {
            status: 403,
            message: `Account locked due to too many failed attempts. Try again in ${minutesLeft} minute(s).`,
        };
    }

    // Verify password
    const isMatch = await verifyPassword(password, cred.password_hash, cred.salt);

    if (!isMatch) {
        const newAttempts = cred.failed_attempts + 1;
        const updates = { failed_attempts: newAttempts };

        if (newAttempts >= AUTH.MAX_FAILED_ATTEMPTS) {
            const lockUntil = new Date(Date.now() + AUTH.LOCKOUT_DURATION_MINUTES * 60 * 1000);
            updates.locked_until = lockUntil;
            await query(
                `UPDATE auth_credentials SET failed_attempts = $1, locked_until = $2 WHERE id = $3`,
                [newAttempts, lockUntil, cred.id]
            );
            throw {
                status: 403,
                message: `Account locked for ${AUTH.LOCKOUT_DURATION_MINUTES} minutes after ${AUTH.MAX_FAILED_ATTEMPTS} failed attempts.`,
            };
        } else {
            await query(
                `UPDATE auth_credentials SET failed_attempts = $1 WHERE id = $2`,
                [newAttempts, cred.id]
            );
            throw { status: 401, message: 'Invalid Employee Code or password.' };
        }
    }

    // Fetch user profile + role/department info
    const userProfile = await getUserProfile(cred.user_type, cred.user_ref_id);

    // Reset failed attempts and update last login
    await query(
        `UPDATE auth_credentials 
     SET failed_attempts = 0, locked_until = NULL, last_login = NOW() 
     WHERE id = $1`,
        [cred.id]
    );

    // Generate tokens
    const tokenPayload = {
        employee_code: cred.employee_code,
        user_type: cred.user_type,
        user_ref_id: cred.user_ref_id,
        department_id: userProfile.department_id,
        role: userProfile.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
        accessToken,
        refreshToken,
        mustChangePassword: cred.must_change_password,
        user: {
            employee_code: cred.employee_code,
            user_type: cred.user_type,
            first_name: userProfile.first_name,
            last_name: userProfile.last_name,
            department: userProfile.department_name,
            role: userProfile.role,
        },
    };
}

/**
 * Register auth credentials for a new employee
 * @param {Object} params
 * @returns {Promise<{employeeCode: string}>}
 */
async function registerCredentials({ userType, userRefId, deptCode, password }) {
    const validation = validatePasswordStrength(password);
    if (!validation.valid) {
        throw { status: 400, message: 'Password does not meet security requirements.', errors: validation.errors };
    }

    const employeeCode = await generateEmployeeCode(deptCode, userType);
    const { hash, salt } = await hashPassword(password);

    await query(
        `INSERT INTO auth_credentials 
       (employee_code, password_hash, salt, user_type, user_ref_id, must_change_password)
     VALUES ($1, $2, $3, $4, $5, TRUE)`,
        [employeeCode, hash, salt, userType, userRefId]
    );

    return { employeeCode };
}

/**
 * Refresh an access token using a valid refresh token
 * @param {string} refreshToken 
 * @returns {Promise<{accessToken: string}>}
 */
async function refreshAccessToken(refreshToken) {
    const decoded = verifyRefreshToken(refreshToken);

    const credResult = await query(
        `SELECT employee_code, user_type, user_ref_id FROM auth_credentials WHERE employee_code = $1`,
        [decoded.employee_code]
    );

    if (credResult.rows.length === 0) {
        throw { status: 401, message: 'Invalid refresh token.' };
    }

    const cred = credResult.rows[0];
    const userProfile = await getUserProfile(cred.user_type, cred.user_ref_id);

    const accessToken = generateAccessToken({
        employee_code: cred.employee_code,
        user_type: cred.user_type,
        user_ref_id: cred.user_ref_id,
        department_id: userProfile.department_id,
        role: userProfile.role,
    });

    return { accessToken };
}

/**
 * Change password (requires current password verification)
 * @param {string} employeeCode 
 * @param {string} currentPassword 
 * @param {string} newPassword 
 */
async function changePassword(employeeCode, currentPassword, newPassword) {
    const credResult = await query(
        `SELECT id, password_hash, salt FROM auth_credentials WHERE employee_code = $1`,
        [employeeCode]
    );

    if (credResult.rows.length === 0) {
        throw { status: 404, message: 'Credentials not found.' };
    }

    const cred = credResult.rows[0];
    const isMatch = await verifyPassword(currentPassword, cred.password_hash, cred.salt);

    if (!isMatch) {
        throw { status: 401, message: 'Current password is incorrect.' };
    }

    const validation = validatePasswordStrength(newPassword);
    if (!validation.valid) {
        throw { status: 400, message: 'New password does not meet security requirements.', errors: validation.errors };
    }

    const { hash, salt } = await hashPassword(newPassword);

    await query(
        `UPDATE auth_credentials 
     SET password_hash = $1, salt = $2, must_change_password = FALSE, password_changed_at = NOW()
     WHERE id = $3`,
        [hash, salt, cred.id]
    );
}

// ---- Internal Helpers ----

async function getUserProfile(userType, userRefId) {
    let sql, result;

    switch (userType) {
        case 'Doctor':
            sql = `SELECT d.first_name, d.last_name, d.department_id, dep.name AS department_name,
                    'Doctor' AS role
             FROM doctors d
             JOIN departments dep ON dep.id = d.department_id
             WHERE d.id = $1`;
            break;
        case 'Staff':
            sql = `SELECT s.first_name, s.last_name, s.department_id, dep.name AS department_name,
                    s.role
             FROM staff s
             LEFT JOIN departments dep ON dep.id = s.department_id
             WHERE s.id = $1`;
            break;
        case 'Admin':
            sql = `SELECT a.first_name, a.last_name, a.department_id, dep.name AS department_name,
                    a.access_level AS role
             FROM admins a
             LEFT JOIN departments dep ON dep.id = a.department_id
             WHERE a.id = $1`;
            break;
        default:
            throw { status: 500, message: `Unknown user type: ${userType}` };
    }

    result = await query(sql, [userRefId]);

    if (result.rows.length === 0) {
        throw { status: 404, message: 'User profile not found.' };
    }

    return result.rows[0];
}

module.exports = { login, registerCredentials, refreshAccessToken, changePassword };
