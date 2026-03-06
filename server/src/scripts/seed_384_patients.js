/**
 * NeoVeda Medicity HMS — Comprehensive Data Seeder
 * 
 * Generates and inserts 384 patient profiles with:
 *   - OPD appointments across 21 departments
 *   - Active inpatient admissions (with bed occupancy)
 *   - Discharged patient records (historical)
 *   - Billing ledger (INR) — Paid/Pending mix
 *   - TPA insurance policies & cashless claims
 *   - CSV export to docs/ for audit
 * 
 * Usage: cd server && node seed_384_patients.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

// ══════════════════════════════════════════════
//  INDIAN DATA CORPUS
// ══════════════════════════════════════════════

const MALE_FIRST = [
    'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
    'Shaurya', 'Atharva', 'Advait', 'Dhruv', 'Kabir', 'Ritvik', 'Aarush', 'Kian', 'Darsh', 'Rudra',
    'Rohan', 'Arnav', 'Laksh', 'Anirudh', 'Pranav', 'Yash', 'Nikhil', 'Gautam', 'Siddharth', 'Manish',
    'Vikram', 'Amit', 'Deepak', 'Suresh', 'Rajesh', 'Anil', 'Pankaj', 'Ravi', 'Sumit', 'Manoj',
    'Kunal', 'Naveen', 'Sandeep', 'Ashok', 'Rakesh', 'Vishal', 'Rahul', 'Mukesh', 'Ajay', 'Vinod',
    'Tarun', 'Harish', 'Sachin', 'Mohit', 'Akash', 'Ankit', 'Gaurav', 'Varun', 'Dev', 'Karthik',
    'Balaji', 'Venkat', 'Prasad', 'Neeraj', 'Himanshu', 'Dinesh', 'Tushar', 'Chirag', 'Jatin', 'Sanjay',
    'Om', 'Parth', 'Sahil', 'Abhishek', 'Harsh', 'Lokesh', 'Prateek', 'Raj', 'Sameer', 'Shubham',
    'Aakash', 'Bhuvan', 'Chetan', 'Dhanraj', 'Eshan', 'Farhan', 'Gopal', 'Hari', 'Irfan', 'Jagdish',
    'Kamal', 'Laxman', 'Madhav', 'Narayan', 'Omkar', 'Piyush', 'Ramesh', 'Sagar', 'Tanmay', 'Uday'
];

const FEMALE_FIRST = [
    'Saanvi', 'Aanya', 'Aadhya', 'Aaradhya', 'Ananya', 'Pari', 'Myra', 'Sara', 'Avni', 'Aditi',
    'Isha', 'Diya', 'Priya', 'Nisha', 'Kavya', 'Riya', 'Meera', 'Pooja', 'Sneha', 'Anjali',
    'Neha', 'Sunita', 'Rekha', 'Geeta', 'Lakshmi', 'Sita', 'Radha', 'Kamla', 'Savitri', 'Padma',
    'Deepika', 'Shweta', 'Preeti', 'Pallavi', 'Shruti', 'Swati', 'Tanvi', 'Vidya', 'Jyoti', 'Aruna',
    'Bhavna', 'Chithra', 'Divya', 'Ekta', 'Fatima', 'Gauri', 'Hema', 'Indira', 'Janaki', 'Kirti',
    'Lavanya', 'Mansi', 'Nandini', 'Oviya', 'Padmini', 'Radhika', 'Sangeeta', 'Tara', 'Uma', 'Vanitha',
    'Archana', 'Bindu', 'Chandni', 'Damini', 'Esha', 'Falguni', 'Ganga', 'Harini', 'Ilaa', 'Jaya',
    'Kalpana', 'Latika', 'Mallika', 'Namrata', 'Parvati', 'Revathi', 'Shalini', 'Trisha', 'Usha', 'Vasundhara',
    'Aishwarya', 'Bhakti', 'Charulata', 'Devyani', 'Gargi', 'Hamsini', 'Ira', 'Juhi', 'Komal', 'Lata'
];

const LAST_NAMES = [
    'Sharma', 'Patel', 'Gupta', 'Singh', 'Kumar', 'Yadav', 'Reddy', 'Nair', 'Iyer', 'Joshi',
    'Verma', 'Mishra', 'Chauhan', 'Mehta', 'Shah', 'Desai', 'Pillai', 'Menon', 'Rao', 'Naidu',
    'Agarwal', 'Jain', 'Srivastava', 'Pandey', 'Tiwari', 'Dubey', 'Saxena', 'Bhatia', 'Malhotra', 'Kapoor',
    'Chatterjee', 'Banerjee', 'Mukherjee', 'Das', 'Bose', 'Ghosh', 'Dutta', 'Sen', 'Roy', 'Sarkar',
    'Choudhary', 'Rajput', 'Thakur', 'Patil', 'Kulkarni', 'Deshpande', 'Jog', 'Bhatt', 'Trivedi', 'Dave',
    'Nayak', 'Shetty', 'Hegde', 'Gowda', 'Amin', 'Modi', 'Parekh', 'Gandhi', 'Vyas', 'Shukla'
];

const STATES = [
    { state: 'Karnataka', cities: ['Bengaluru', 'Mysuru', 'Hubli', 'Mangaluru', 'Belgaum'], pins: ['560', '570', '580', '575', '590'] },
    { state: 'Maharashtra', cities: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane'], pins: ['400', '411', '440', '422', '401'] },
    { state: 'Tamil Nadu', cities: ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Trichy'], pins: ['600', '641', '625', '636', '620'] },
    { state: 'Delhi', cities: ['New Delhi', 'Dwarka', 'Rohini', 'Saket', 'Janakpuri'], pins: ['110', '110', '110', '110', '110'] },
    { state: 'Uttar Pradesh', cities: ['Lucknow', 'Noida', 'Agra', 'Varanasi', 'Kanpur'], pins: ['226', '201', '282', '221', '208'] },
    { state: 'Gujarat', cities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'], pins: ['380', '395', '390', '360', '382'] },
    { state: 'Rajasthan', cities: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer'], pins: ['302', '342', '313', '324', '305'] },
    { state: 'West Bengal', cities: ['Kolkata', 'Howrah', 'Durgapur', 'Siliguri', 'Asansol'], pins: ['700', '711', '713', '734', '713'] },
    { state: 'Telangana', cities: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam'], pins: ['500', '506', '503', '505', '507'] },
    { state: 'Kerala', cities: ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam'], pins: ['695', '682', '673', '680', '691'] },
    { state: 'Madhya Pradesh', cities: ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain'], pins: ['462', '452', '474', '482', '456'] },
    { state: 'Punjab', cities: ['Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala'], pins: ['160', '141', '143', '144', '147'] },
];

const STREETS = [
    'MG Road', 'Gandhi Nagar', 'Nehru Street', 'Rajaji Road', 'Station Road', 'Temple Street',
    'Park Avenue', 'Lake View Colony', 'Ring Road', 'Bypass Road', 'Market Street', 'Hill View',
    'Shanti Nagar', 'Vikas Nagar', 'Ashok Nagar', 'Patel Nagar', 'Indira Colony', 'Subhash Marg',
    'Laxmi Nagar', 'Sarojini Nagar', 'Kamla Nehru Nagar', 'Tilak Road', 'Civil Lines', 'Cantonment Road',
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const BG_WEIGHTS = [0.22, 0.06, 0.30, 0.08, 0.06, 0.02, 0.22, 0.04]; // Indian distribution

const DIAGNOSES_OPD = [
    'Acute Upper Respiratory Infection', 'Type 2 Diabetes Mellitus', 'Essential Hypertension',
    'Allergic Rhinitis', 'Chronic Low Back Pain', 'Migraine without aura',
    'Hypothyroidism', 'Iron Deficiency Anemia', 'Urinary Tract Infection',
    'Gastroesophageal Reflux Disease', 'Osteoarthritis of knee', 'Asthma - moderate persistent',
    'Vitamin D Deficiency', 'Chronic Kidney Disease Stage 2', 'Benign Prostatic Hyperplasia',
    'Conjunctivitis', 'Dermatitis - atopic', 'Anxiety Disorder', 'PCOD', 'Cervical Spondylosis',
];

const DIAGNOSES_IPD = [
    'Acute Myocardial Infarction', 'Pneumonia', 'Dengue Fever', 'Acute Appendicitis',
    'Fracture Neck of Femur', 'Acute Pancreatitis', 'Diabetic Ketoacidosis',
    'Cerebrovascular Accident', 'Acute Kidney Injury', 'Cholecystitis',
    'Intestinal Obstruction', 'COPD Exacerbation', 'Eclampsia', 'Spinal Disc Herniation',
    'Sepsis', 'Pulmonary Embolism', 'Acute GI Hemorrhage', 'Status Epilepticus',
    'Congestive Heart Failure', 'Liver Cirrhosis - decompensated',
];

const PROCEDURES = [
    'CABG', 'PTCA with Stenting', 'Total Knee Replacement', 'Total Hip Replacement',
    'Laparoscopic Cholecystectomy', 'Appendectomy', 'Cesarean Section', 'Craniotomy',
    'Spinal Fusion', 'Nephrectomy', 'Pacemaker Implantation', 'Cataract Surgery - Phaco',
    'TURP', 'Endoscopic Retrograde Cholangiopancreatography', 'Coronary Angiography',
    'Hernia Repair - Laparoscopic', 'Thyroidectomy', 'Hysterectomy', 'Dialysis Session',
    'Bronchoscopy',
];

// ══════════════════════════════════════════════
//  UTILITY HELPERS
// ══════════════════════════════════════════════

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN(arr, n) { const s = [...arr].sort(() => Math.random() - 0.5); return s.slice(0, n); }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randDec(min, max, dp = 2) { return parseFloat((Math.random() * (max - min) + min).toFixed(dp)); }
function pad(n, w = 5) { return String(n).padStart(w, '0'); }

function weightedPick(items, weights) {
    const r = Math.random(); let cum = 0;
    for (let i = 0; i < items.length; i++) { cum += weights[i]; if (r <= cum) return items[i]; }
    return items[items.length - 1];
}

function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function fmtDate(d) { return d.toISOString().slice(0, 10); }
function fmtTs(d) { return d.toISOString().replace('T', ' ').slice(0, 19); }

function genABHA() {
    // 14-digit ABHA ID: XX-XXXX-XXXX-XXXX
    let id = '';
    for (let i = 0; i < 14; i++) id += String(randInt(0, 9));
    return id;
}

function genPhone() {
    const prefixes = ['98', '97', '96', '95', '94', '93', '91', '90', '88', '87', '86', '85', '84', '83', '82', '81', '70', '73', '74', '75', '76', '77', '78', '79'];
    return `+91${pick(prefixes)}${String(randInt(10000000, 99999999))}`;
}

function genUHID(idx) { return `UHID-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${pad(idx)}`; }

function escapeCsv(val) {
    if (val === null || val === undefined) return '';
    const s = String(val);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
    return s;
}

// ══════════════════════════════════════════════
//  MAIN SEEDER
// ══════════════════════════════════════════════

async function main() {
    const client = await pool.connect();
    console.log('🔌 Connected to Neon PostgreSQL\n');

    try {
        // ── 1. Query existing data ──
        console.log('📋 Querying existing departments, doctors, wards, beds, TPA vendors...');
        const deptRows = (await client.query('SELECT id, name, code FROM departments ORDER BY id')).rows;
        const docRows = (await client.query('SELECT id, employee_code, first_name, last_name, department_id, consultation_fee FROM doctors WHERE is_active = TRUE ORDER BY id')).rows;
        const wardRows = (await client.query('SELECT id, name, ward_code, ward_type, total_beds, charge_per_day FROM wards WHERE is_active = TRUE ORDER BY id')).rows;
        const bedRows = (await client.query('SELECT id, bed_number, ward_id, status FROM beds ORDER BY id')).rows;
        const tpaRows = (await client.query('SELECT id, vendor_code, name, panel_type FROM tpa_vendors WHERE is_active = TRUE ORDER BY id')).rows;
        const authRows = (await client.query("SELECT employee_code FROM auth_credentials LIMIT 1")).rows;

        console.log(`  Departments: ${deptRows.length} | Doctors: ${docRows.length} | Wards: ${wardRows.length} | Beds: ${bedRows.length} | TPA Vendors: ${tpaRows.length}`);

        if (deptRows.length === 0) throw new Error('No departments found — run migration 015 first.');
        if (docRows.length === 0) throw new Error('No doctors found — seed doctors first.');

        const createdBy = authRows.length > 0 ? authRows[0].employee_code : null;
        const availableBeds = bedRows.filter(b => b.status === 'Available');

        // ── 2. Generate 384 patients ──
        console.log('\n👥 Generating 384 patient profiles...');
        const patients = [];
        const now = new Date();
        const ONE_YEAR_AGO = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        const THREE_MONTHS_AGO = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

        for (let i = 1; i <= 384; i++) {
            const gender = Math.random() < 0.52 ? 'Male' : (Math.random() < 0.96 ? 'Female' : 'Other');
            const firstName = gender === 'Male' ? pick(MALE_FIRST) : (gender === 'Female' ? pick(FEMALE_FIRST) : pick([...MALE_FIRST, ...FEMALE_FIRST]));
            const lastName = pick(LAST_NAMES);
            const dob = randomDate(new Date(1945, 0, 1), new Date(2020, 11, 31));
            const stateObj = pick(STATES);
            const cityIdx = randInt(0, stateObj.cities.length - 1);
            const city = stateObj.cities[cityIdx];
            const pinPrefix = stateObj.pins[cityIdx];
            const pincode = pinPrefix + String(randInt(100, 999)).padStart(3, '0');

            patients.push({
                uhid: genUHID(i),
                first_name: firstName,
                last_name: lastName,
                date_of_birth: fmtDate(dob),
                gender,
                aadhaar_number: null, // privacy
                phone: genPhone(),
                email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randInt(1, 999)}@${pick(['gmail.com', 'yahoo.co.in', 'outlook.com', 'rediffmail.com'])}`,
                address_line1: `${randInt(1, 999)}, ${pick(STREETS)}`,
                address_line2: pick(['Near Bus Stand', 'Opp. Park', 'Behind Temple', '2nd Cross', 'Main Road', 'Colony Phase ' + randInt(1, 4), '']),
                city,
                state: stateObj.state,
                pincode,
                blood_group: weightedPick(BLOOD_GROUPS, BG_WEIGHTS),
                emergency_contact_name: `${pick([...MALE_FIRST, ...FEMALE_FIRST])} ${lastName}`,
                emergency_contact_phone: genPhone(),
                abha_id: genABHA(),
            });
        }

        // ── 3. Define cohorts ──
        // OPD-only: 200 | Active Inpatients: 64 | Discharged: 120
        const OPD_COUNT = 200;
        const ACTIVE_INPATIENT_COUNT = 64;
        const DISCHARGED_COUNT = 120;

        // ── 4. Insert Patients ──
        console.log('📥 Inserting 384 patients...');
        await client.query('BEGIN');

        const insertedPatients = [];
        for (const p of patients) {
            const res = await client.query(
                `INSERT INTO patients (uhid, first_name, last_name, date_of_birth, gender, phone, email,
                 address_line1, address_line2, city, state, pincode, blood_group,
                 emergency_contact_name, emergency_contact_phone)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
                 ON CONFLICT (uhid) DO UPDATE SET first_name = EXCLUDED.first_name
                 RETURNING id`,
                [p.uhid, p.first_name, p.last_name, p.date_of_birth, p.gender, p.phone, p.email,
                p.address_line1, p.address_line2, p.city, p.state, p.pincode, p.blood_group,
                p.emergency_contact_name, p.emergency_contact_phone]
            );
            insertedPatients.push({ ...p, id: res.rows[0].id });
        }
        console.log(`  ✓ ${insertedPatients.length} patients inserted`);

        // ── Define cohorts from insertedPatients (which have DB IDs) ──
        const opdPatients = insertedPatients.slice(0, OPD_COUNT);
        const activeInpatients = insertedPatients.slice(OPD_COUNT, OPD_COUNT + ACTIVE_INPATIENT_COUNT);
        const dischargedPatients = insertedPatients.slice(OPD_COUNT + ACTIVE_INPATIENT_COUNT);

        // ── 5. Create Wards & Beds if none exist ──
        let wards = wardRows;
        let beds = bedRows;

        if (wards.length === 0) {
            console.log('\n🏥 Creating hospital wards...');
            const wardDefs = [
                { name: 'General Ward A', code: 'GEN-A', type: 'General', dept: 'INTM', floor: 'Floor 1', beds: 30, charge: 1500 },
                { name: 'General Ward B', code: 'GEN-B', type: 'General', dept: 'GSUR', floor: 'Floor 1', beds: 30, charge: 1500 },
                { name: 'General Ward C', code: 'GEN-C', type: 'General', dept: 'ORTH', floor: 'Floor 2', beds: 20, charge: 1800 },
                { name: 'Semi-Private Ward', code: 'SPV-A', type: 'Semi-Private', dept: 'INTM', floor: 'Floor 2', beds: 20, charge: 3500 },
                { name: 'Private Ward A', code: 'PVT-A', type: 'Private', dept: 'CARD', floor: 'Floor 3', beds: 15, charge: 6000 },
                { name: 'Private Ward B', code: 'PVT-B', type: 'Private', dept: 'NEUR', floor: 'Floor 3', beds: 10, charge: 7000 },
                { name: 'ICU - Cardiac', code: 'ICU-C', type: 'ICU', dept: 'CARD', floor: 'Floor 3', beds: 12, charge: 15000 },
                { name: 'ICU - General', code: 'ICU-G', type: 'ICU', dept: 'EMER', floor: 'Ground', beds: 10, charge: 12000 },
                { name: 'ICU - Neuro', code: 'ICU-N', type: 'ICU', dept: 'NEUR', floor: 'Floor 3', beds: 8, charge: 18000 },
                { name: 'HDU', code: 'HDU-A', type: 'HDU', dept: 'INTM', floor: 'Floor 2', beds: 10, charge: 8000 },
                { name: 'NICU', code: 'NICU', type: 'NICU', dept: 'PEDI', floor: 'Floor 1', beds: 8, charge: 20000 },
                { name: 'CCU', code: 'CCU-A', type: 'CCU', dept: 'CARD', floor: 'Floor 3', beds: 6, charge: 16000 },
                { name: 'Maternity Ward', code: 'MAT-A', type: 'Semi-Private', dept: 'OBGY', floor: 'Floor 1', beds: 15, charge: 4000 },
                { name: 'Isolation Ward', code: 'ISO-A', type: 'Isolation', dept: 'INTM', floor: 'Floor 4', beds: 6, charge: 5000 },
            ];

            wards = [];
            for (const w of wardDefs) {
                const deptId = deptRows.find(d => d.code === w.dept)?.id || deptRows[0].id;
                const res = await client.query(
                    `INSERT INTO wards (name, ward_code, department_id, ward_type, floor, total_beds, charge_per_day)
                     VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (ward_code) DO UPDATE SET name = EXCLUDED.name RETURNING *`,
                    [w.name, w.code, deptId, w.type, w.floor, w.beds, w.charge]
                );
                wards.push(res.rows[0]);
            }
            console.log(`  ✓ ${wards.length} wards created`);

            // Create beds
            console.log('🛏️  Creating beds...');
            beds = [];
            for (const w of wards) {
                for (let b = 1; b <= w.total_beds; b++) {
                    const res = await client.query(
                        `INSERT INTO beds (bed_number, ward_id, status)
                         VALUES ($1, $2, 'Available')
                         ON CONFLICT (ward_id, bed_number) DO UPDATE SET status = 'Available'
                         RETURNING *`,
                        [String(b).padStart(2, '0'), w.id]
                    );
                    beds.push(res.rows[0]);
                }
            }
            console.log(`  ✓ ${beds.length} beds created`);
        }

        const availBeds = beds.filter(b => b.status === 'Available');

        // ── 6. OPD Appointments ──
        console.log('\n📅 Creating OPD appointments...');
        const appointments = [];
        let apptIdx = 0;

        for (const p of opdPatients) {
            const numAppts = randInt(1, 3);
            for (let a = 0; a < numAppts; a++) {
                apptIdx++;
                const doc = pick(docRows);
                const dept = deptRows.find(d => d.id === doc.department_id) || pick(deptRows);
                const apptDate = randomDate(THREE_MONTHS_AGO, new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000));
                const isPast = apptDate < now;
                const statuses = isPast ? ['Completed', 'Completed', 'Completed', 'No-Show', 'Cancelled'] : ['Scheduled', 'Scheduled', 'Checked-In'];
                const status = pick(statuses);
                const hour = randInt(9, 16);
                const minute = pick([0, 15, 30, 45]);

                const apptNo = `APT-${fmtDate(apptDate).replace(/-/g, '')}-${pad(apptIdx)}`;

                const res = await client.query(
                    `INSERT INTO appointments (appointment_no, patient_id, doctor_id, department_id,
                     appointment_date, appointment_time, duration_minutes, status, type, notes, created_by)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
                     ON CONFLICT (appointment_no) DO NOTHING RETURNING id`,
                    [apptNo, p.id, doc.id, dept.id,
                        fmtDate(apptDate), `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`,
                        pick([15, 20, 30]), status, pick(['OPD', 'Follow-Up', 'Teleconsultation']),
                        isPast ? pick(DIAGNOSES_OPD) : null, createdBy]
                );
                if (res.rows.length > 0) {
                    appointments.push({ id: res.rows[0].id, apptNo, patient_id: p.id, doctor_id: doc.id, status, date: fmtDate(apptDate) });
                }
            }
        }
        console.log(`  ✓ ${appointments.length} appointments created`);

        // ── 7. Active Inpatient Admissions ──
        console.log('\n🏨 Creating active inpatient admissions...');
        const activeAdmissions = [];
        let admIdx = 0;

        for (let i = 0; i < activeInpatients.length && i < availBeds.length; i++) {
            admIdx++;
            const p = activeInpatients[i];
            const bed = availBeds[i];
            const ward = wards.find(w => w.id === bed.ward_id) || wards[0];
            const doc = pick(docRows);
            const admDate = randomDate(new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000));
            const admNo = `ADM-${fmtDate(admDate).replace(/-/g, '')}-${pad(admIdx)}`;

            const res = await client.query(
                `INSERT INTO admissions (admission_no, patient_id, doctor_id, bed_id, department_id,
                 admission_date, status, diagnosis_at_admission)
                 VALUES ($1,$2,$3,$4,$5,$6,'Active',$7)
                 ON CONFLICT (admission_no) DO NOTHING RETURNING id`,
                [admNo, p.id, doc.id, bed.id, doc.department_id, fmtTs(admDate), pick(DIAGNOSES_IPD)]
            );
            if (res.rows.length > 0) {
                // Mark bed as Occupied
                await client.query("UPDATE beds SET status = 'Occupied' WHERE id = $1", [bed.id]);
                activeAdmissions.push({ id: res.rows[0].id, admNo, patient_id: p.id, bed_id: bed.id, ward, doctor_id: doc.id, admDate });
            }
        }
        console.log(`  ✓ ${activeAdmissions.length} active admissions (beds marked Occupied)`);

        // ── 8. Discharged Patient Records ──
        console.log('\n📋 Creating discharged patient records...');
        const dischargedAdmissions = [];

        for (let i = 0; i < dischargedPatients.length; i++) {
            admIdx++;
            const p = dischargedPatients[i];
            // Use any bed (they were discharged, bed status doesn't matter for historical)
            const bed = pick(beds);
            const doc = pick(docRows);
            const admDate = randomDate(ONE_YEAR_AGO, THREE_MONTHS_AGO);
            const lossDays = randInt(2, 21);
            const discDate = new Date(admDate.getTime() + lossDays * 24 * 60 * 60 * 1000);
            const admNo = `ADM-${fmtDate(admDate).replace(/-/g, '')}-${pad(admIdx)}`;

            const res = await client.query(
                `INSERT INTO admissions (admission_no, patient_id, doctor_id, bed_id, department_id,
                 admission_date, discharge_date, status, diagnosis_at_admission, discharge_summary)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
                 ON CONFLICT (admission_no) DO NOTHING RETURNING id`,
                [admNo, p.id, doc.id, bed.id, doc.department_id,
                    fmtTs(admDate), fmtTs(discDate),
                    pick(['Discharged', 'Discharged', 'Discharged', 'Discharged', 'LAMA']),
                    pick(DIAGNOSES_IPD),
                    `Patient treated for ${pick(DIAGNOSES_IPD)}. ${pick(PROCEDURES)} performed. Recovery satisfactory. Follow-up in ${randInt(1, 4)} weeks.`]
            );
            if (res.rows.length > 0) {
                dischargedAdmissions.push({ id: res.rows[0].id, admNo, patient_id: p.id, bed_id: bed.id, doctor_id: doc.id, admDate, discDate, lossDays });
            }
        }
        console.log(`  ✓ ${dischargedAdmissions.length} discharged records created`);

        // ── 9. Billing Ledger ──
        console.log('\n💰 Creating billing ledger...');
        const allBills = [];
        let billIdx = 0;

        // OPD bills (completed appointments)
        const completedAppts = appointments.filter(a => a.status === 'Completed');
        for (const appt of completedAppts) {
            billIdx++;
            const doc = docRows.find(d => d.id === appt.doctor_id);
            const consultFee = parseFloat(doc?.consultation_fee || 500);
            const total = consultFee + randDec(100, 500);
            const tax = Math.round(total * 0.05 * 100) / 100;
            const net = total + tax;
            const isPaid = Math.random() < 0.75;
            const invNo = `INV-OPD-${pad(billIdx)}`;

            const res = await client.query(
                `INSERT INTO billing (invoice_no, patient_id, total_amount, discount, tax_amount, net_amount,
                 payment_status, payment_mode, generated_by)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
                 ON CONFLICT (invoice_no) DO NOTHING RETURNING id`,
                [invNo, appt.patient_id, total, 0, tax, net,
                    isPaid ? 'Paid' : 'Pending', isPaid ? pick(['Cash', 'Card', 'UPI']) : null, createdBy]
            );
            if (res.rows.length > 0) {
                allBills.push({ id: res.rows[0].id, invNo, patient_id: appt.patient_id, type: 'OPD', total, net, status: isPaid ? 'Paid' : 'Pending', admission_id: null });
            }
        }

        // Inpatient bills (active)
        for (const adm of activeAdmissions) {
            billIdx++;
            const ward = adm.ward;
            const daysIn = Math.max(1, Math.round((now - adm.admDate) / (24 * 60 * 60 * 1000)));
            const wardCharge = parseFloat(ward.charge_per_day || 2000) * daysIn;
            const total = wardCharge + randDec(5000, 50000);
            const tax = Math.round(total * 0.05 * 100) / 100;
            const net = total + tax;
            const invNo = `INV-IPD-${pad(billIdx)}`;

            const res = await client.query(
                `INSERT INTO billing (invoice_no, patient_id, admission_id, total_amount, discount, tax_amount, net_amount,
                 payment_status, generated_by)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,'Pending',$8)
                 ON CONFLICT (invoice_no) DO NOTHING RETURNING id`,
                [invNo, adm.patient_id, adm.id, total, 0, tax, net, createdBy]
            );
            if (res.rows.length > 0) {
                allBills.push({ id: res.rows[0].id, invNo, patient_id: adm.patient_id, type: 'IPD-Active', total, net, status: 'Pending', admission_id: adm.id });
            }
        }

        // Discharged bills
        for (const adm of dischargedAdmissions) {
            billIdx++;
            const total = randDec(10000, 500000);
            const discount = Math.random() < 0.3 ? randDec(500, 5000) : 0;
            const tax = Math.round((total - discount) * 0.05 * 100) / 100;
            const net = total - discount + tax;
            const isPaid = Math.random() < 0.7;
            const invNo = `INV-IPD-${pad(billIdx)}`;

            const res = await client.query(
                `INSERT INTO billing (invoice_no, patient_id, admission_id, total_amount, discount, tax_amount, net_amount,
                 payment_status, payment_mode, generated_by)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
                 ON CONFLICT (invoice_no) DO NOTHING RETURNING id`,
                [invNo, adm.patient_id, adm.id, total, discount, tax, net,
                    isPaid ? 'Paid' : pick(['Pending', 'Partial']),
                    isPaid ? pick(['Cash', 'Card', 'UPI', 'NEFT', 'Mixed']) : null, createdBy]
            );
            if (res.rows.length > 0) {
                allBills.push({ id: res.rows[0].id, invNo, patient_id: adm.patient_id, type: 'IPD-Discharged', total, net, status: isPaid ? 'Paid' : 'Pending', admission_id: adm.id });
            }
        }
        console.log(`  ✓ ${allBills.length} billing records created`);

        // ── 10. TPA Insurance Policies & Claims ──
        console.log('\n🏥 Creating TPA insurance policies and claims...');
        const allAdmissions = [...activeAdmissions, ...dischargedAdmissions];
        const insuredAdmissions = allAdmissions.filter(() => Math.random() < 0.45); // ~45% have insurance
        const policies = [];
        const claims = [];
        let polIdx = 0, clmIdx = 0;

        for (const adm of insuredAdmissions) {
            polIdx++;
            const tpa = pick(tpaRows);
            const polStart = new Date(adm.admDate.getTime() - randInt(30, 365) * 24 * 60 * 60 * 1000);
            const polEnd = new Date(polStart.getTime() + 365 * 24 * 60 * 60 * 1000);
            const sumInsured = pick([200000, 300000, 500000, 700000, 1000000, 1500000, 2000000]);
            const coPay = pick([0, 0, 10, 10, 15, 20]);
            const deductible = pick([0, 0, 5000, 10000, 15000]);

            const polRes = await client.query(
                `INSERT INTO insurance_policies
                 (patient_id, tpa_vendor_id, policy_number, insurance_company, plan_name,
                  policy_start_date, policy_end_date, sum_insured, balance_available,
                  co_payment_percent, deductible_amount, relation_to_primary)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'Self')
                 RETURNING id`,
                [adm.patient_id, tpa.id,
                `POL-${tpa.vendor_code}-${pad(polIdx)}`,
                pick(['Star Health', 'ICICI Lombard', 'HDFC ERGO', 'Max Bupa', 'Bajaj Allianz', 'New India Assurance', 'Oriental Insurance', 'United India', 'National Insurance', 'TATA AIG']),
                pick(['Gold Plan', 'Silver Plan', 'Platinum Shield', 'Family Floater', 'Super Top-Up', 'Critical Illness Cover']),
                fmtDate(polStart), fmtDate(polEnd), sumInsured, sumInsured - randInt(0, Math.floor(sumInsured * 0.3)),
                    coPay, deductible]
            );
            const policyId = polRes.rows[0].id;
            policies.push({ id: policyId, patient_id: adm.patient_id, tpa_id: tpa.id, sumInsured, coPay, deductible });

            // Update admission with insurance info
            await client.query(
                `UPDATE admissions SET is_insurance_case = TRUE, insurance_policy_id = $1,
                 co_payment_percent = $2, deductible_amount = $3 WHERE id = $4`,
                [policyId, coPay, deductible, adm.id]
            );

            // Create claim
            clmIdx++;
            const bill = allBills.find(b => b.admission_id === adm.id);
            const claimAmt = bill ? bill.total : randDec(20000, 300000);
            const isSettled = adm.discDate && Math.random() < 0.6;
            const isApproved = isSettled || Math.random() < 0.5;
            const approvedAmt = isApproved ? claimAmt * randDec(0.7, 1.0) : null;
            const settledAmt = isSettled ? (approvedAmt || claimAmt) * randDec(0.8, 1.0) : null;

            let claimStatus;
            if (isSettled) claimStatus = pick(['Settled', 'Partially Settled']);
            else if (isApproved) claimStatus = 'Approved';
            else claimStatus = pick(['Submitted', 'Under Review', 'Query Raised', 'Draft']);

            const claimNo = `CLM-${fmtDate(adm.admDate).replace(/-/g, '')}-${pad(clmIdx)}`;
            const coPayAmt = approvedAmt ? Math.round(approvedAmt * (coPay / 100) * 100) / 100 : 0;

            const clmRes = await client.query(
                `INSERT INTO tpa_claims
                 (claim_no, admission_id, billing_id, insurance_policy_id, tpa_vendor_id,
                  claim_type, total_bill_amount, co_payment_amount, deductible_amount,
                  patient_payable, approved_amount, settled_amount,
                  settlement_utr, settlement_date, status, submitted_by)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
                 RETURNING id`,
                [claimNo, adm.id, bill?.id || null, policyId, tpa.id,
                    pick(['Cashless', 'Cashless', 'Cashless', 'Reimbursement']),
                    claimAmt, coPayAmt, deductible,
                    coPayAmt + deductible,
                    approvedAmt, settledAmt,
                    isSettled ? `UTR${randInt(100000000, 999999999)}` : null,
                    isSettled ? fmtDate(adm.discDate) : null,
                    claimStatus, createdBy]
            );
            claims.push({ id: clmRes.rows[0].id, claimNo, admission_id: adm.id, tpa: tpa.vendor_code, status: claimStatus, amount: claimAmt });

            // Update billing with TPA info
            if (bill && isApproved) {
                await client.query(
                    `UPDATE billing SET tpa_claim_id = $1, insurance_covered = $2,
                     co_payment_amount = $3, deductible_applied = $4,
                     patient_net_payable = $5, tariff_applied = $6,
                     payment_mode = 'Insurance'
                     WHERE id = $7`,
                    [clmRes.rows[0].id, settledAmt || approvedAmt, coPayAmt, deductible,
                    coPayAmt + deductible, tpa.panel_type, bill.id]
                );
            }
        }
        console.log(`  ✓ ${policies.length} insurance policies created`);
        console.log(`  ✓ ${claims.length} TPA claims created`);

        await client.query('COMMIT');
        console.log('\n✅ Database transaction committed successfully!');

        // ══════════════════════════════════════════════
        //  PHASE II: CSV EXPORT
        // ══════════════════════════════════════════════
        console.log('\n📁 Exporting CSV files to docs/...');
        const docsDir = path.join(__dirname, '..', 'docs');
        if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

        // patients.csv
        const patientsCsv = ['Patient_ID,UHID,Full_Name,Date_of_Birth,Gender,Blood_Group,Contact_Number,Residential_Address,ABHA_ID'];
        for (const p of insertedPatients) {
            patientsCsv.push([p.id, p.uhid, `${p.first_name} ${p.last_name}`, p.date_of_birth, p.gender,
            p.blood_group, p.phone, escapeCsv(`${p.address_line1}, ${p.city}, ${p.state} ${p.pincode}`), p.abha_id].join(','));
        }
        fs.writeFileSync(path.join(docsDir, 'patients.csv'), patientsCsv.join('\n'), 'utf8');
        console.log(`  ✓ patients.csv (${insertedPatients.length} rows)`);

        // appointments.csv
        const apptCsv = ['Appointment_ID,Appointment_No,Patient_ID,Doctor_ID,Status,Date'];
        for (const a of appointments) apptCsv.push([a.id, a.apptNo, a.patient_id, a.doctor_id, a.status, a.date].join(','));
        fs.writeFileSync(path.join(docsDir, 'appointments.csv'), apptCsv.join('\n'), 'utf8');
        console.log(`  ✓ appointments.csv (${appointments.length} rows)`);

        // inpatient_records.csv
        const ipdCsv = ['Admission_ID,Admission_No,Patient_ID,Bed_ID,Doctor_ID,Status,Admission_Date,Discharge_Date'];
        for (const a of [...activeAdmissions, ...dischargedAdmissions]) {
            ipdCsv.push([a.id, a.admNo, a.patient_id, a.bed_id, a.doctor_id,
            a.discDate ? 'Discharged' : 'Active',
            fmtDate(a.admDate), a.discDate ? fmtDate(a.discDate) : ''].join(','));
        }
        fs.writeFileSync(path.join(docsDir, 'inpatient_records.csv'), ipdCsv.join('\n'), 'utf8');
        console.log(`  ✓ inpatient_records.csv (${activeAdmissions.length + dischargedAdmissions.length} rows)`);

        // billing_ledger.csv
        const billCsv = ['Invoice_ID,Invoice_No,Patient_ID,Type,Total_Amount,Net_Amount,Status'];
        for (const b of allBills) billCsv.push([b.id, b.invNo, b.patient_id, b.type, b.total.toFixed(2), b.net.toFixed(2), b.status].join(','));
        fs.writeFileSync(path.join(docsDir, 'billing_ledger.csv'), billCsv.join('\n'), 'utf8');
        console.log(`  ✓ billing_ledger.csv (${allBills.length} rows)`);

        // tpa_claims.csv
        const clmCsv = ['Claim_ID,Claim_No,Admission_ID,TPA_Vendor,Status,Claimed_Amount'];
        for (const c of claims) clmCsv.push([c.id, c.claimNo, c.admission_id, c.tpa, c.status, c.amount.toFixed(2)].join(','));
        fs.writeFileSync(path.join(docsDir, 'tpa_claims.csv'), clmCsv.join('\n'), 'utf8');
        console.log(`  ✓ tpa_claims.csv (${claims.length} rows)`);

        // ── Summary ──
        console.log('\n══════════════════════════════════════════════');
        console.log('  SEEDING SUMMARY');
        console.log('══════════════════════════════════════════════');
        console.log(`  Patients:            ${insertedPatients.length}`);
        console.log(`  OPD Appointments:    ${appointments.length}`);
        console.log(`  Active Admissions:   ${activeAdmissions.length}`);
        console.log(`  Discharged Records:  ${dischargedAdmissions.length}`);
        console.log(`  Billing Invoices:    ${allBills.length}`);
        console.log(`  Insurance Policies:  ${policies.length}`);
        console.log(`  TPA Claims:          ${claims.length}`);
        console.log('══════════════════════════════════════════════\n');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Seeding failed:', err.message);
        console.error(err.stack);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

main();
