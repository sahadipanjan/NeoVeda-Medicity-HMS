/**
 * Comprehensive Database Setup & Seed Script
 * 
 * Uses pg Pool to connect to Neon PostgreSQL.
 * Seeds: 21 departments, 2 admins, 75 doctors, 160 staff, 10 wards, 119 beds
 * + auth credentials for all 237 users
 * 
 * Usage: node src/utils/seed.js
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

// ============================================================
// INDIAN NAMES
// ============================================================
const M = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
    'Rohan', 'Arnav', 'Kabir', 'Shaurya', 'Advait', 'Dhruv', 'Rishi', 'Yash', 'Pranav', 'Dev',
    'Anand', 'Vikram', 'Suresh', 'Mahesh', 'Rajesh', 'Karan', 'Nikhil', 'Amit', 'Rahul', 'Pradeep',
    'Sanjay', 'Varun', 'Girish', 'Mohan', 'Ramesh', 'Deepak', 'Arun', 'Manish', 'Harish', 'Sunil',
    'Ankur', 'Gaurav', 'Sachin', 'Tarun', 'Vinay', 'Ashok', 'Manoj', 'Neeraj', 'Pankaj', 'Ajay',
    'Vishal', 'Rajan', 'Naveen', 'Prasad', 'Santosh', 'Hemant', 'Umesh', 'Rakesh', 'Lokesh', 'Dinesh'];
const F = ['Aanya', 'Ananya', 'Diya', 'Aadhya', 'Aisha', 'Myra', 'Sara', 'Ira', 'Kavya', 'Riya',
    'Priya', 'Neha', 'Pooja', 'Sneha', 'Divya', 'Meera', 'Anjali', 'Swati', 'Nisha', 'Lakshmi',
    'Geeta', 'Sunita', 'Rekha', 'Padma', 'Savita', 'Radha', 'Asha', 'Pushpa', 'Suman', 'Sarita',
    'Deepa', 'Kalpana', 'Seema', 'Shobha', 'Usha', 'Mala', 'Sudha', 'Bindu', 'Rashmi', 'Kavitha',
    'Shilpa', 'Bhavna', 'Renuka', 'Vasudha', 'Preeti', 'Manju', 'Madhu', 'Jaya', 'Chitra', 'Veena',
    'Aparna', 'Nalini', 'Gauri', 'Rukmini', 'Vijaya', 'Saroja', 'Indira', 'Kamala', 'Janaki', 'Uma'];
const L = ['Sharma', 'Patel', 'Reddy', 'Kumar', 'Singh', 'Gupta', 'Verma', 'Joshi', 'Iyer', 'Nair',
    'Rao', 'Chatterjee', 'Banerjee', 'Mukherjee', 'Das', 'Mehta', 'Shah', 'Desai', 'Pillai', 'Menon',
    'Srinivasan', 'Subramanian', 'Naidu', 'Rajan', 'Kulkarni', 'Deshpande', 'Patil', 'Kaur', 'Choudhury', 'Bose',
    'Ghosh', 'Sen', 'Mishra', 'Pandey', 'Tiwari', 'Dwivedi', 'Tripathi', 'Saxena', 'Agarwal', 'Jain',
    'Malhotra', 'Kapoor', 'Khanna', 'Bhatia', 'Arora', 'Sethi', 'Chawla', 'Grover', 'Tandon', 'Bajaj'];

const QUALS = {
    CARD: ['MBBS, MD, DM (Cardiology)', 'MBBS, MD, DM (Interventional Cardiology)'],
    NEUR: ['MBBS, MD, DM (Neurology)', 'MBBS, MS, MCh (Neurosurgery)'],
    ONCO: ['MBBS, MD (Radiation Oncology)', 'MBBS, MS, MCh (Surgical Oncology)'],
    ORTH: ['MBBS, MS (Orthopedics)', 'MBBS, MS, Fellowship (Joint Replacement)'],
    PEDI: ['MBBS, MD (Pediatrics)', 'MBBS, MD, DM (Neonatology)'],
    OBGY: ['MBBS, MS (OBG)', 'MBBS, MD, DM (Reproductive Medicine)'],
    GAST: ['MBBS, MD, DM (Gastroenterology)', 'MBBS, MS, MCh (GI Surgery)'],
    PULM: ['MBBS, MD (Pulmonary Medicine)', 'MBBS, MD (Respiratory Medicine)'],
    NEPH: ['MBBS, MD, DM (Nephrology)', 'MBBS, MS, MCh (Renal Transplant)'],
    UROL: ['MBBS, MS, MCh (Urology)', 'MBBS, MS, MCh, Fellowship (Robotic Surgery)'],
    ENDO: ['MBBS, MD, DM (Endocrinology)', 'MBBS, MD (Endocrinology & Metabolism)'],
    OPHT: ['MBBS, MS (Ophthalmology)', 'MBBS, MS, Fellowship (Retina)'],
    ENTT: ['MBBS, MS (ENT)', 'MBBS, MS, Fellowship (Head & Neck Surgery)'],
    DERM: ['MBBS, MD (Dermatology)', 'MBBS, MD (DVL)'],
    PSYC: ['MBBS, MD (Psychiatry)', 'MBBS, MD, DM (Child Psychiatry)'],
    RADI: ['MBBS, MD (Radiodiagnosis)', 'MBBS, MD, Fellowship (Interventional Radiology)'],
    PATH: ['MBBS, MD (Pathology)', 'MBBS, MD, DM (Hematopathology)'],
    ANES: ['MBBS, MD (Anesthesiology)', 'MBBS, MD, Fellowship (Critical Care)'],
    EMER: ['MBBS, MD (Emergency Medicine)', 'MBBS, MRCEM, Fellowship (Trauma Care)'],
    GSUR: ['MBBS, MS (General Surgery)', 'MBBS, MS, MCh (Surgical Gastroenterology)'],
    INTM: ['MBBS, MD (Internal Medicine)', 'MBBS, MD (Medicine), FICP'],
};
const SPECS = {
    CARD: ['Interventional Cardiology', 'Electrophysiology', 'Heart Failure', 'Preventive Cardiology'],
    NEUR: ['Stroke Medicine', 'Movement Disorders', 'Epileptology', 'Neuromuscular Diseases'],
    ONCO: ['Breast Oncology', 'GI Oncology', 'Head & Neck Oncology', 'Hemato-Oncology'],
    ORTH: ['Joint Replacement', 'Spine Surgery', 'Sports Medicine', 'Trauma Surgery'],
    PEDI: ['Neonatology', 'Pediatric Cardiology', 'Pediatric Neurology', 'General Pediatrics'],
    OBGY: ['High-Risk Pregnancy', 'Gynecologic Oncology', 'Reproductive Medicine', 'Fetal Medicine'],
    GAST: ['Hepatology', 'GI Endoscopy', 'IBD Specialist', 'Pancreato-Biliary'],
    PULM: ['Interventional Pulmonology', 'Sleep Medicine', 'TB & Chest', 'Lung Transplant'],
    NEPH: ['Renal Transplant', 'Dialysis', 'Glomerular Diseases', 'Pediatric Nephrology'],
    UROL: ['Uro-Oncology', 'Robotic Urology', 'Kidney Transplant', 'Andrology'],
    ENDO: ['Diabetes Management', 'Thyroid Disorders', 'Pituitary Diseases', 'Metabolic Bone Disease'],
    OPHT: ['Retina & Vitreous', 'Cornea', 'Glaucoma', 'Oculoplasty'],
    ENTT: ['Otology', 'Rhinology', 'Laryngology', 'Head & Neck Surgery'],
    DERM: ['Cosmetic Dermatology', 'Dermatosurgery', 'Pediatric Dermatology', 'Clinical Dermatology'],
    PSYC: ['Addiction Psychiatry', 'Child Psychiatry', 'Geriatric Psychiatry', 'Neuropsychiatry'],
    RADI: ['Interventional Radiology', 'Neuroradiology', 'Musculoskeletal Radiology', 'CT & MRI'],
    PATH: ['Histopathology', 'Clinical Pathology', 'Cytopathology', 'Molecular Pathology'],
    ANES: ['Cardiac Anesthesia', 'Neuro Anesthesia', 'Regional Anesthesia', 'Pain Medicine'],
    EMER: ['Trauma Care', 'Poison Management', 'Pediatric Emergency', 'Critical Care'],
    GSUR: ['Laparoscopic Surgery', 'Bariatric Surgery', 'Hepatobiliary Surgery', 'Colorectal Surgery'],
    INTM: ['Infectious Diseases', 'Rheumatology', 'Critical Care Medicine', 'Geriatric Medicine'],
};

function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function phone() { return '+91' + String(Math.floor(7000000000 + Math.random() * 2999999999)); }
function mci() { return 'MCI-' + String(Math.floor(10000 + Math.random() * 89999)); }
function fee() { return (Math.floor(Math.random() * 15) + 5) * 100; }
function jd() { return `202${Math.floor(Math.random() * 6)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`; }

async function seed() {
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║  HMS Seeder — Neon PostgreSQL (pg driver)     ║');
    console.log('╚══════════════════════════════════════════════╝\n');

    // Step 1: Migrations
    console.log('[1] Running migrations...');
    const mDir = path.resolve(__dirname, '../../../database/migrations');
    for (const file of fs.readdirSync(mDir).filter(f => f.endsWith('.sql')).sort()) {
        try {
            await q(fs.readFileSync(path.join(mDir, file), 'utf8'));
            console.log(`  ✓ ${file}`);
        } catch (e) {
            if (/already exists|duplicate|42P07|42710/.test(e.message)) console.log(`  ⚠ ${file} (exists)`);
            else { console.error(`  ✗ ${file}: ${e.message}`); throw e; }
        }
    }

    // Step 2: Departments
    console.log('\n[2] Fetching departments...');
    const { rows: depts } = await q('SELECT id, code, name FROM departments ORDER BY id');
    console.log(`  ${depts.length} departments`);
    const dc = {}; for (const d of depts) dc[d.code] = d;

    // Step 3: 2 Admins
    console.log('\n[3] Creating 2 Admins...');
    const admins = [
        { fn: 'Rajendra', ln: 'Prasad', em: 'rajendra.prasad@hms.in', ph: '+919876543001', al: 'Super' },
        { fn: 'Lakshmi', ln: 'Venkatesh', em: 'lakshmi.venkatesh@hms.in', ph: '+919876543002', al: 'Hospital' },
    ];
    for (const a of admins) {
        try {
            const r = await q(
                `INSERT INTO admins (employee_code,first_name,last_name,email,phone,access_level) VALUES ('TEMP',$1,$2,$3,$4,$5) RETURNING id`,
                [a.fn, a.ln, a.em, a.ph, a.al]);
            const id = r.rows[0].id;
            const ec = `EMP-ADMN-${String(id).padStart(5, '0')}`;
            await q('UPDATE admins SET employee_code=$1 WHERE id=$2', [ec, id]);
            const { hash, salt } = await hashPwd('Admin@HMS2026');
            await q(`INSERT INTO auth_credentials (employee_code,password_hash,salt,user_type,user_ref_id,must_change_password) VALUES ($1,$2,$3,'Admin',$4,TRUE)`,
                [ec, hash, salt, id]);
            console.log(`  ✓ ${a.fn} ${a.ln} | ${ec} | pwd: Admin@HMS2026`);
        } catch (e) { console.log(`  ⚠ ${a.em}: ${e.message.slice(0, 60)}`); }
    }

    // Step 4: 75 Doctors
    console.log('\n[4] Creating 75 Doctors...');
    const dCodes = Object.keys(QUALS);
    const dist = {}; for (const c of dCodes) dist[c] = Math.floor(75 / 21);
    let rem = 75 - Math.floor(75 / 21) * 21;
    for (const c of dCodes) { if (rem <= 0) break; dist[c]++; rem--; }

    let dCount = 0; const usedD = new Set();
    for (const code of dCodes) {
        const dept = dc[code]; if (!dept) continue;
        for (let i = 0; i < dist[code]; i++) {
            let fn, ln, g, att = 0;
            do {
                g = Math.random() > 0.35 ? 'm' : 'f'; fn = g === 'm' ? pick(M) : pick(F); ln = pick(L); att++;
            } while (usedD.has(fn + ln) && att < 30);
            usedD.add(fn + ln);
            const qual = pick(QUALS[code]), spec = pick(SPECS[code]);
            const em = `${fn.toLowerCase()}.${ln.toLowerCase()}.d${dCount}@hms.in`;
            try {
                const r = await q(
                    `INSERT INTO doctors (employee_code,first_name,last_name,department_id,specialization,qualification,medical_council_reg,phone,email,consultation_fee,joined_date)
           VALUES ('TEMP',$1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
                    [fn, ln, dept.id, spec, qual, mci(), phone(), em, fee(), jd()]);
                const id = r.rows[0].id;
                const ec = `EMP-${code}-${String(id).padStart(5, '0')}`;
                await q('UPDATE doctors SET employee_code=$1 WHERE id=$2', [ec, id]);
                const { hash, salt } = await hashPwd('Doctor@HMS2026');
                await q(`INSERT INTO auth_credentials (employee_code,password_hash,salt,user_type,user_ref_id,must_change_password) VALUES ($1,$2,$3,'Doctor',$4,TRUE)`,
                    [ec, hash, salt, id]);
                dCount++;
                if (dCount % 10 === 0) console.log(`  ✓ ${dCount}/75 doctors...`);
            } catch (e) { if (e.code !== '23505') console.log(`  ⚠ Dr ${fn} ${ln}: ${e.message.slice(0, 50)}`); }
        }
    }
    console.log(`  ✓ Total: ${dCount} doctors`);

    // Step 5: 160 Staff
    console.log('\n[5] Creating 160 Staff...');
    const roles = [{ r: 'Nurse', n: 60 }, { r: 'Ward Boy', n: 30 }, { r: 'Receptionist', n: 20 }, { r: 'Technician', n: 25 }, { r: 'Lab Technician', n: 15 }, { r: 'Pharmacist', n: 10 }];
    const shifts = ['Morning', 'Afternoon', 'Night', 'Rotational'];
    let sCount = 0; const usedS = new Set();

    for (const { r: role, n: count } of roles) {
        for (let i = 0; i < count; i++) {
            let fn, ln, g, att = 0;
            do {
                if (role === 'Nurse') g = Math.random() > 0.15 ? 'f' : 'm';
                else if (role === 'Ward Boy') g = 'm';
                else g = Math.random() > 0.5 ? 'f' : 'm';
                fn = g === 'm' ? pick(M) : pick(F); ln = pick(L); att++;
            } while (usedS.has(fn + ln + role) && att < 30);
            usedS.add(fn + ln + role);
            const dept = pick(depts), shift = pick(shifts);
            const em = `${fn.toLowerCase()}.${ln.toLowerCase()}.s${sCount}@hms.in`;
            try {
                const r2 = await q(
                    `INSERT INTO staff (employee_code,first_name,last_name,role,department_id,phone,email,shift,joined_date)
           VALUES ('TEMP',$1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
                    [fn, ln, role, dept.id, phone(), em, shift, jd()]);
                const id = r2.rows[0].id;
                const ec = `EMP-${dept.code}-${String(1000 + id).padStart(5, '0')}`;
                await q('UPDATE staff SET employee_code=$1 WHERE id=$2', [ec, id]);
                const { hash, salt } = await hashPwd('Staff@HMS2026');
                await q(`INSERT INTO auth_credentials (employee_code,password_hash,salt,user_type,user_ref_id,must_change_password) VALUES ($1,$2,$3,'Staff',$4,TRUE)`,
                    [ec, hash, salt, id]);
                sCount++;
                if (sCount % 20 === 0) console.log(`  ✓ ${sCount}/160 staff...`);
            } catch (e) { if (e.code !== '23505') console.log(`  ⚠ ${fn} ${ln}: ${e.message.slice(0, 50)}`); }
        }
    }
    console.log(`  ✓ Total: ${sCount} staff`);

    // Step 6: Wards & Beds
    console.log('\n[6] Creating wards & beds...');
    const wards = [
        { n: 'General Ward A', c: 'GWA', t: 'General', f: 'Ground', b: 20, ch: 500, d: 'INTM' },
        { n: 'General Ward B', c: 'GWB', t: 'General', f: 'Floor 1', b: 20, ch: 500, d: 'GSUR' },
        { n: 'Private Ward', c: 'PVT', t: 'Private', f: 'Floor 3', b: 10, ch: 3000, d: 'INTM' },
        { n: 'Semi-Private Ward', c: 'SPV', t: 'Semi-Private', f: 'Floor 2', b: 15, ch: 1500, d: 'INTM' },
        { n: 'ICU', c: 'ICU', t: 'ICU', f: 'Floor 2', b: 12, ch: 8000, d: 'EMER' },
        { n: 'CCU', c: 'CCU', t: 'CCU', f: 'Floor 3', b: 8, ch: 10000, d: 'CARD' },
        { n: 'NICU', c: 'NIC', t: 'NICU', f: 'Floor 1', b: 6, ch: 12000, d: 'PEDI' },
        { n: 'Pediatric Ward', c: 'PDW', t: 'General', f: 'Floor 1', b: 10, ch: 800, d: 'PEDI' },
        { n: 'Maternity Ward', c: 'MAT', t: 'Semi-Private', f: 'Floor 1', b: 12, ch: 2000, d: 'OBGY' },
        { n: 'Isolation Ward', c: 'ISO', t: 'Isolation', f: 'Floor 4', b: 6, ch: 5000, d: 'PULM' },
    ];
    for (const w of wards) {
        try {
            const dept = dc[w.d];
            const r = await q(`INSERT INTO wards (name,ward_code,department_id,ward_type,floor,total_beds,charge_per_day)
        VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`, [w.n, w.c, dept?.id, w.t, w.f, w.b, w.ch]);
            const wid = r.rows[0].id;
            for (let b = 1; b <= w.b; b++) await q('INSERT INTO beds (bed_number,ward_id) VALUES ($1,$2)', [String(b).padStart(2, '0'), wid]);
            console.log(`  ✓ ${w.n} — ${w.b} beds`);
        } catch (e) { console.log(`  ⚠ ${w.c}: ${e.message.slice(0, 50)}`); }
    }

    // Summary
    const counts = await Promise.all([
        q('SELECT COUNT(*) FROM departments'), q('SELECT COUNT(*) FROM admins'),
        q('SELECT COUNT(*) FROM doctors'), q('SELECT COUNT(*) FROM staff'),
        q('SELECT COUNT(*) FROM auth_credentials'), q('SELECT COUNT(*) FROM wards'), q('SELECT COUNT(*) FROM beds'),
    ]);
    const g = i => counts[i].rows[0].count;
    console.log(`\n╔══════════════════════════════════════════╗`);
    console.log(`║  SEED COMPLETE                           ║`);
    console.log(`╠══════════════════════════════════════════╣`);
    console.log(`║  Departments:  ${String(g(0)).padStart(6)}                 ║`);
    console.log(`║  Admins:       ${String(g(1)).padStart(6)}                 ║`);
    console.log(`║  Doctors:      ${String(g(2)).padStart(6)}                 ║`);
    console.log(`║  Staff:        ${String(g(3)).padStart(6)}                 ║`);
    console.log(`║  Credentials:  ${String(g(4)).padStart(6)}                 ║`);
    console.log(`║  Wards:        ${String(g(5)).padStart(6)}                 ║`);
    console.log(`║  Beds:         ${String(g(6)).padStart(6)}                 ║`);
    console.log(`╚══════════════════════════════════════════╝`);
    console.log(`\n  Passwords: Admin@HMS2026 | Doctor@HMS2026 | Staff@HMS2026`);
    await pool.end();
}

seed().catch(e => { console.error('[FATAL]', e.message); process.exit(1); });
