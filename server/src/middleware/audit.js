/**
 * Audit Logger Middleware
 * 
 * Logs all data mutations (POST, PUT, PATCH, DELETE) to the audit_logs table.
 * Captures employee_code, action, entity info, and request metadata.
 */

const { query } = require('../config/database');

/**
 * Create an audit log entry
 * @param {Object} params
 * @param {string} params.employee_code - Who performed the action
 * @param {string} params.action - Action name (e.g., 'CREATE_PATIENT', 'UPDATE_APPOINTMENT')
 * @param {string} [params.entity_type] - Entity type (e.g., 'Patient', 'Doctor')
 * @param {number} [params.entity_id] - Entity primary key
 * @param {Object} [params.old_values] - Previous state (for updates)
 * @param {Object} [params.new_values] - New state
 * @param {string} [params.ip_address] - Client IP
 * @param {string} [params.user_agent] - Client user agent
 */
async function createAuditLog({
    employee_code,
    action,
    entity_type = null,
    entity_id = null,
    old_values = null,
    new_values = null,
    ip_address = null,
    user_agent = null,
}) {
    try {
        await query(
            `INSERT INTO audit_logs 
         (employee_code, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                employee_code,
                action,
                entity_type,
                entity_id,
                old_values ? JSON.stringify(old_values) : null,
                new_values ? JSON.stringify(new_values) : null,
                ip_address,
                user_agent,
            ]
        );
    } catch (err) {
        // Audit logging should never crash the request — log and continue
        console.error('[AUDIT] Failed to write audit log:', err.message);
    }
}

/**
 * Express middleware to auto-audit mutation requests
 * Attaches audit function to req for use in controllers
 */
function auditMiddleware(req, res, next) {
    req.audit = async (action, entityType, entityId, oldValues, newValues) => {
        await createAuditLog({
            employee_code: req.user?.employee_code || 'SYSTEM',
            action,
            entity_type: entityType,
            entity_id: entityId,
            old_values: oldValues,
            new_values: newValues,
            ip_address: req.ip || req.connection?.remoteAddress,
            user_agent: req.headers['user-agent'],
        });
    };
    next();
}

module.exports = { createAuditLog, auditMiddleware };
