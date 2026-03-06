/**
 * Employee Code Generator Utility
 * 
 * Generates unique employee codes in the format: EMP-{DEPT_CODE}-{SEQUENCE}
 * Examples: EMP-CARD-00001, EMP-EMER-00042, EMP-ADMN-00001
 */

const { query } = require('../config/database');
const { AUTH } = require('../config/constants');

/**
 * Generate the next employee code for a given department code
 * @param {string} deptCode - Department code (e.g., 'CARD', 'NEUR')
 * @param {'Doctor'|'Staff'|'Admin'} userType - Type of user
 * @returns {Promise<string>} - Generated employee code
 */
async function generateEmployeeCode(deptCode, userType) {
    const prefix = AUTH.EMPLOYEE_CODE_PREFIX;
    const code = userType === 'Admin' ? 'ADMN' : deptCode;

    // Find the highest existing sequence number for this department prefix
    const pattern = `${prefix}-${code}-%`;

    const result = await query(
        `SELECT employee_code FROM auth_credentials 
     WHERE employee_code LIKE $1 
     ORDER BY employee_code DESC 
     LIMIT 1`,
        [pattern]
    );

    let nextSequence = 1;

    if (result.rows.length > 0) {
        const lastCode = result.rows[0].employee_code;
        const lastSequence = parseInt(lastCode.split('-').pop(), 10);
        nextSequence = lastSequence + 1;
    }

    const sequenceStr = String(nextSequence).padStart(5, '0');
    return `${prefix}-${code}-${sequenceStr}`;
}

/**
 * Validate employee code format
 * @param {string} employeeCode - Code to validate
 * @returns {boolean}
 */
function isValidEmployeeCode(employeeCode) {
    return /^EMP-[A-Z]{4}-\d{5}$/.test(employeeCode);
}

module.exports = { generateEmployeeCode, isValidEmployeeCode };
