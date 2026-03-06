/**
 * Personnel Credentials CSV Generator
 * 
 * Queries all 237 users from Neon PostgreSQL, updates the two admin records,
 * and serializes to hospital_personnel_credentials.csv
 * 
 * Usage: node src/utils/generateCSV.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { Pool } = require('pg');

const SALT_ROUNDS = 12;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function q(sql, params = []) { return pool.query(sql, params); }

async function hashPwd(password) {
    const salt = crypto.randomBytes(32).toString('hex');
    const hash = await bcrypt.hash(password + salt, SALT_ROUNDS);
    return { hash, salt };
}

// ---- Indian Demographic Helpers ----
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const SHIFTS_ADMIN = ['General (9 AM - 5 PM)'];
const SHIFTS_DOCTOR = ['Morning (8 AM - 2 PM)', 'Afternoon (2 PM - 8 PM)', 'General (9 AM - 5 PM)'];
const SHIFTS_STAFF = ['Morning (6 AM - 2 PM)', 'Afternoon (2 PM - 10 PM)', 'Night (10 PM - 6 AM)', 'Rotational'];

function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

function escapeCSV(val) {
    if (val == null) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

async function generate() {
    console.log('[CSV] Starting personnel credentials generation...\n');

    // ---- Step 1: Update Admin 1 to Srijita Das ----
    console.log('[CSV] Updating Admin 1: Srijita Das (EMP-ADMN-00001)...');
    await q(`UPDATE admins SET first_name = 'Srijita', last_name = 'Das', email = 'srijita.das@hms.in' WHERE employee_code = 'EMP-ADMN-00001'`);
    const { hash: h1, salt: s1 } = await hashPwd('Srijita@2005');
    await q(`UPDATE auth_credentials SET password_hash = $1, salt = $2 WHERE employee_code = 'EMP-ADMN-00001'`, [h1, s1]);
    console.log('  ✓ Srijita Das | EMP-ADMN-00001 | Srijita@2005');

    // ---- Step 2: Update Admin 2 to Dipanjan Saha ----
    console.log('[CSV] Updating Admin 2: Dipanjan Saha (EMP-ADMN-00002)...');
    await q(`UPDATE admins SET first_name = 'Dipanjan', last_name = 'Saha', email = 'dipanjan.saha@hms.in' WHERE employee_code = 'EMP-ADMN-00002'`);
    const { hash: h2, salt: s2 } = await hashPwd('Sonu@092716');
    await q(`UPDATE auth_credentials SET password_hash = $1, salt = $2 WHERE employee_code = 'EMP-ADMN-00002'`, [h2, s2]);
    console.log('  ✓ Dipanjan Saha | EMP-ADMN-00002 | Sonu@092716');

    // ---- Step 3: Query all personnel ----
    console.log('\n[CSV] Querying all personnel from database...');

    // Admins
    const { rows: admins } = await q(`
    SELECT a.employee_code, a.first_name, a.last_name, a.email, a.phone, a.access_level,
           COALESCE(d.name, 'Hospital Administration') as department_name
    FROM admins a LEFT JOIN departments d ON a.department_id = d.id
    ORDER BY a.id
  `);

    // Doctors
    const { rows: doctors } = await q(`
    SELECT dr.employee_code, dr.first_name, dr.last_name, dr.email, dr.phone,
           dr.specialization, dr.qualification, dr.medical_council_reg,
           d.name as department_name
    FROM doctors dr JOIN departments d ON dr.department_id = d.id
    WHERE dr.is_active = TRUE ORDER BY dr.id
  `);

    // Staff
    const { rows: staff } = await q(`
    SELECT s.employee_code, s.first_name, s.last_name, s.email, s.phone,
           s.role, s.shift, d.name as department_name
    FROM staff s JOIN departments d ON s.department_id = d.id
    WHERE s.is_active = TRUE ORDER BY s.id
  `);

    console.log(`  Admins: ${admins.length} | Doctors: ${doctors.length} | Staff: ${staff.length}`);
    console.log(`  Total: ${admins.length + doctors.length + staff.length}`);

    // ---- Step 4: Build CSV rows ----
    const header = [
        'Sl_No', 'Full_Name', 'Role', 'Employee_Code', 'Login_Password',
        'Contact_Number', 'Official_Email', 'Department', 'Assigned_Shift',
        'Blood_Group', 'Qualifications', 'Specialization', 'MCI_Registration'
    ].join(',');

    const rows = [];
    let sl = 1;

    // Admin password map
    const adminPasswords = {
        'EMP-ADMN-00001': 'Srijita@2005',
        'EMP-ADMN-00002': 'Sonu@092716',
    };

    // Staff qualification map by role
    const staffQuals = {
        'Nurse': ['B.Sc Nursing', 'GNM (General Nursing & Midwifery)', 'M.Sc Nursing', 'ANM'],
        'Ward Boy': ['10th Pass, Hospital Training Certificate', '12th Pass, First Aid Certified'],
        'Receptionist': ['BBA, Computer Skills', 'B.Com, Front Office Management', 'BA, Customer Relations'],
        'Technician': ['B.Sc Biomedical Engineering', 'Diploma in Medical Lab Technology', 'B.Sc Radiology'],
        'Lab Technician': ['DMLT', 'B.Sc MLT (Medical Lab Technology)', 'M.Sc Microbiology'],
        'Pharmacist': ['B.Pharm', 'D.Pharm', 'M.Pharm'],
    };

    // Admins
    for (const a of admins) {
        rows.push([
            sl++,
            `${a.first_name} ${a.last_name}`,
            `Super Admin (${a.access_level})`,
            a.employee_code,
            adminPasswords[a.employee_code] || 'Admin@HMS2026',
            a.phone || '+919876543001',
            a.email,
            a.department_name,
            pick(SHIFTS_ADMIN),
            pick(BLOOD_GROUPS),
            'MCA / MBA (Hospital Administration)',
            'Hospital Administration',
            'N/A',
        ].map(escapeCSV).join(','));
    }

    // Doctors
    for (const d of doctors) {
        rows.push([
            sl++,
            `Dr. ${d.first_name} ${d.last_name}`,
            'Doctor',
            d.employee_code,
            'Doctor@HMS2026',
            d.phone,
            d.email,
            d.department_name,
            pick(SHIFTS_DOCTOR),
            pick(BLOOD_GROUPS),
            d.qualification || 'MBBS, MD',
            d.specialization || d.department_name,
            d.medical_council_reg || 'N/A',
        ].map(escapeCSV).join(','));
    }

    // Staff
    for (const s of staff) {
        const quals = staffQuals[s.role] || ['Diploma'];
        rows.push([
            sl++,
            `${s.first_name} ${s.last_name}`,
            s.role,
            s.employee_code,
            'Staff@HMS2026',
            s.phone,
            s.email,
            s.department_name,
            s.shift ? `${s.shift}` : pick(SHIFTS_STAFF),
            pick(BLOOD_GROUPS),
            pick(quals),
            s.role,
            'N/A',
        ].map(escapeCSV).join(','));
    }

    // ---- Step 5: Write CSV ----
    const csvContent = header + '\n' + rows.join('\n') + '\n';
    const outputPath = path.resolve(__dirname, '../../../hospital_personnel_credentials.csv');
    fs.writeFileSync(outputPath, csvContent, 'utf8');

    console.log(`\n[CSV] ✓ File saved: ${outputPath}`);
    console.log(`[CSV] ✓ Total records: ${rows.length}`);
    console.log('[CSV] ✓ Admin credentials updated in database');

    await pool.end();
}

generate().catch(e => { console.error('[CSV] FATAL:', e.message); process.exit(1); });
