/**
 * Database Configuration — Neon PostgreSQL via pg Pool
 * 
 * Uses the standard pg driver with SSL for Neon serverless.
 * Includes queryWithContext for RLS session variable injection.
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: parseInt(process.env.DB_POOL_MAX) || 10,
  min: parseInt(process.env.DB_POOL_MIN) || 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
});

/**
 * Execute a parameterized query
 */
async function query(sql, params = []) {
  return pool.query(sql, params);
}

/**
 * Execute a query with RLS session context injected.
 * Sets LOCAL session variables that PostgreSQL RLS policies evaluate.
 * 
 * @param {string} sql - The SQL query
 * @param {Array} params - Query parameters
 * @param {Object} context - User context from req.user
 * @param {string} context.user_type - 'Doctor', 'Staff', 'Admin'
 * @param {string} context.role - 'Super', 'Hospital', 'Department', 'Doctor', 'Nurse', etc.
 * @param {number} context.department_id - Department FK
 * @param {number} context.user_ref_id - Reference to doctors/staff/admins.id
 * @param {string} context.employee_code - Employee code for auth_credentials
 */
async function queryWithContext(sql, params = [], context = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Switch to unprivileged role so RLS is enforced (neondb_owner bypasses RLS)
    await client.query("SET LOCAL ROLE app_user");

    // Inject RLS session variables using set_config
    await client.query(`SELECT set_config('app.current_user_type', $1, true)`, [context.user_type || '']);
    await client.query(`SELECT set_config('app.current_role', $1, true)`, [context.role || '']);
    await client.query(`SELECT set_config('app.current_department_id', $1, true)`, [context.department_id ? String(context.department_id) : '-1']);
    await client.query(`SELECT set_config('app.current_user_ref_id', $1, true)`, [context.user_ref_id ? String(context.user_ref_id) : '-1']);
    await client.query(`SELECT set_config('app.current_employee_code', $1, true)`, [context.employee_code || '']);

    // Execute the actual query
    const result = await client.query(sql, params);

    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Get a dedicated client for transactions
 */
async function getClient() {
  const client = await pool.connect();
  return client;
}

/**
 * Get a dedicated client with RLS context already injected
 * For transactional operations that need RLS enforcement
 */
async function getClientWithContext(context = {}) {
  const client = await pool.connect();
  try {
    // Switch to unprivileged role so RLS is enforced
    await client.query("SET LOCAL ROLE app_user");

    await client.query(`SELECT set_config('app.current_user_type', $1, true)`, [context.user_type || '']);
    await client.query(`SELECT set_config('app.current_role', $1, true)`, [context.role || '']);
    await client.query(`SELECT set_config('app.current_department_id', $1, true)`, [context.department_id ? String(context.department_id) : '-1']);
    await client.query(`SELECT set_config('app.current_user_ref_id', $1, true)`, [context.user_ref_id ? String(context.user_ref_id) : '-1']);
    await client.query(`SELECT set_config('app.current_employee_code', $1, true)`, [context.employee_code || '']);
  } catch (err) {
    client.release();
    throw err;
  }
  return client;
}

module.exports = { query, pool, getClient, queryWithContext, getClientWithContext };
