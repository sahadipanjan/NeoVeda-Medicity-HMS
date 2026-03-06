/**
 * applyRLS.js — Execute RBAC + RLS Migrations
 * 
 * Runs migrations 017 (HOD assignment) and 018 (RLS policies).
 * Then validates the applied policies.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function run() {
    const client = await pool.connect();

    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║  NeoVeda Medicity — RBAC + RLS Deployment        ║');
    console.log('╚══════════════════════════════════════════════════╝\n');

    try {
        // ─── Step 1: Apply HOD Doctor Assignments ───
        console.log('[1] Assigning HOD Doctors...');
        const migrationDir = path.join(__dirname, '../../../database/migrations');

        const hodSql = fs.readFileSync(path.join(migrationDir, '017_assign_hod_doctors.sql'), 'utf8');
        await client.query(hodSql);

        const hodResult = await client.query(
            `SELECT d.id, d.name, d.code, doc.first_name, doc.last_name, doc.employee_code
       FROM departments d
       LEFT JOIN doctors doc ON doc.id = d.hod_doctor_id
       WHERE d.is_active = TRUE
       ORDER BY d.id`
        );
        console.log(`  ✓ ${hodResult.rows.filter(r => r.first_name).length}/${hodResult.rows.length} departments assigned HODs`);
        hodResult.rows.forEach(r => {
            const hod = r.first_name ? `${r.first_name} ${r.last_name} (${r.employee_code})` : '⚠️ No doctor available';
            console.log(`    ${r.code.padEnd(6)} ${r.name.padEnd(30)} → ${hod}`);
        });

        // ─── Step 2: Apply RLS Policies ───
        console.log('\n[2] Enabling Row-Level Security...');
        const rlsSql = fs.readFileSync(path.join(migrationDir, '018_enable_rls.sql'), 'utf8');

        // Remove comments before splitting to prevent skipping statements that follow comments
        const sqlNoComments = rlsSql.replace(/--.*$/gm, '');
        const statements = sqlNoComments
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        let applied = 0;
        let errors = 0;
        for (const stmt of statements) {
            try {
                await client.query(stmt);
                applied++;
            } catch (err) {
                if (err.message.includes('already exists')) {
                    // Policy already applied, skip
                    applied++;
                } else if (err.message.includes('already enabled')) {
                    applied++;
                } else {
                    errors++;
                    console.log(`  ⚠️  ${err.message.substring(0, 80)}`);
                }
            }
        }
        console.log(`  ✓ ${applied} statements applied (${errors} errors)`);

        // ─── Step 3: Validate RLS is enabled ───
        console.log('\n[3] Validating RLS status...');
        const rlsCheck = await client.query(`
      SELECT schemaname, tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN ('doctors','staff','admins','patients','appointments',
          'medical_records','wards','beds','admissions','billing','billing_items','auth_credentials')
      ORDER BY tablename
    `);

        let rlsEnabled = 0;
        rlsCheck.rows.forEach(r => {
            const status = r.rowsecurity ? '✓ RLS ON' : '✗ RLS OFF';
            if (r.rowsecurity) rlsEnabled++;
            console.log(`    ${r.tablename.padEnd(20)} ${status}`);
        });

        // ─── Step 4: Count policies ───
        console.log('\n[4] Policy count per table...');
        const policyCount = await client.query(`
      SELECT schemaname, tablename, COUNT(*) as policy_count
      FROM pg_policies
      WHERE schemaname = 'public'
      GROUP BY schemaname, tablename
      ORDER BY tablename
    `);
        let totalPolicies = 0;
        policyCount.rows.forEach(r => {
            totalPolicies += parseInt(r.policy_count);
            console.log(`    ${r.tablename.padEnd(20)} ${r.policy_count} policies`);
        });

        // ─── Step 5: Test Super Admin access ───
        console.log('\n[5] Testing Super Admin access...');
        await client.query("BEGIN");
        await client.query("SET LOCAL ROLE app_user");
        await client.query("SELECT set_config('app.current_role', 'Super', true)");
        await client.query("SELECT set_config('app.current_user_type', 'Admin', true)");
        await client.query("SELECT set_config('app.current_department_id', '-1', true)");
        await client.query("SELECT set_config('app.current_user_ref_id', '-1', true)");
        await client.query("SELECT set_config('app.current_employee_code', 'EMP-ADMN-00001', true)");

        const adminDoctors = await client.query('SELECT COUNT(*) FROM doctors');
        const adminStaff = await client.query('SELECT COUNT(*) FROM staff');
        console.log(`  ✓ Super Admin sees: ${adminDoctors.rows[0].count} doctors, ${adminStaff.rows[0].count} staff`);
        await client.query("COMMIT");

        // ─── Step 6: Test Doctor department isolation ───
        console.log('\n[6] Testing Doctor department isolation...');

        // Get a sample doctor
        const sampleDoctor = await client.query(
            `SELECT d.id, d.department_id, d.employee_code, d.first_name
       FROM doctors d WHERE d.is_active = TRUE LIMIT 1`
        );

        if (sampleDoctor.rows.length > 0) {
            const doc = sampleDoctor.rows[0];

            // Switch to doctor context
            await client.query("BEGIN");
            await client.query("SET LOCAL ROLE app_user");
            await client.query("SELECT set_config('app.current_user_type', 'Doctor', true)");
            await client.query("SELECT set_config('app.current_role', 'Doctor', true)");
            await client.query(`SELECT set_config('app.current_department_id', '${doc.department_id}', true)`);
            await client.query(`SELECT set_config('app.current_user_ref_id', '${doc.id}', true)`);
            await client.query(`SELECT set_config('app.current_employee_code', '${doc.employee_code}', true)`);

            const deptDoctors = await client.query('SELECT COUNT(*) FROM doctors');
            const allDoctorsCount = parseInt(adminDoctors.rows[0].count);
            const deptDoctorsCount = parseInt(deptDoctors.rows[0].count);
            await client.query("COMMIT");

            console.log(`  Doctor: ${doc.first_name} (dept ${doc.department_id})`);
            console.log(`  ✓ Sees ${deptDoctorsCount}/${allDoctorsCount} doctors (department-scoped)`);

            if (deptDoctorsCount < allDoctorsCount) {
                console.log(`  ✓ ISOLATION CONFIRMED: department boundary enforced`);
            } else {
                console.log(`  ⚠️  May need verification: doctor sees same count as admin`);
            }
        }

        // ─── Summary ───
        console.log('\n╔═══════════════════════════════════════════════╗');
        console.log('║  RBAC + RLS DEPLOYMENT COMPLETE               ║');
        console.log('╠═══════════════════════════════════════════════╣');
        console.log(`║  Tables with RLS:    ${String(rlsEnabled).padStart(3)}                   ║`);
        console.log(`║  Total policies:     ${String(totalPolicies).padStart(3)}                   ║`);
        console.log(`║  HOD assignments:    ${String(hodResult.rows.filter(r => r.first_name).length).padStart(3)}                   ║`);
        console.log('╚═══════════════════════════════════════════════╝');

    } catch (err) {
        console.error('\n✗ Fatal error:', err.message);
        console.error(err.stack);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
