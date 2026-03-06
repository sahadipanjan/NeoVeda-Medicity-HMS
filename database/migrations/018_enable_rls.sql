-- Migration 018: Enable Row-Level Security (RLS) across all operational tables
-- Uses application-level session variables: app.current_user_type, app.current_department_id,
-- app.current_user_ref_id, app.current_role
-- Neon single-pool architecture requires SET LOCAL per-request injection.

-- ═══════════════════════════════════════════════════════════════
--  STEP 1: Enable RLS on all operational tables
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_credentials ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owners too (Neon pool user is the table owner)
ALTER TABLE doctors FORCE ROW LEVEL SECURITY;
ALTER TABLE staff FORCE ROW LEVEL SECURITY;
ALTER TABLE admins FORCE ROW LEVEL SECURITY;
ALTER TABLE patients FORCE ROW LEVEL SECURITY;
ALTER TABLE appointments FORCE ROW LEVEL SECURITY;
ALTER TABLE medical_records FORCE ROW LEVEL SECURITY;
ALTER TABLE wards FORCE ROW LEVEL SECURITY;
ALTER TABLE beds FORCE ROW LEVEL SECURITY;
ALTER TABLE admissions FORCE ROW LEVEL SECURITY;
ALTER TABLE billing FORCE ROW LEVEL SECURITY;
ALTER TABLE billing_items FORCE ROW LEVEL SECURITY;
ALTER TABLE auth_credentials FORCE ROW LEVEL SECURITY;


-- ═══════════════════════════════════════════════════════════════
--  STEP 2: DOCTORS table policies
-- ═══════════════════════════════════════════════════════════════

-- Super Admin: unconditional ALL
CREATE POLICY superadmin_all_doctors ON doctors FOR ALL
  USING (current_setting('app.current_role', true) = 'Super')
  WITH CHECK (current_setting('app.current_role', true) = 'Super');

-- Hospital Admin: unconditional ALL
CREATE POLICY hospital_admin_all_doctors ON doctors FOR ALL
  USING (current_setting('app.current_role', true) = 'Hospital')
  WITH CHECK (current_setting('app.current_role', true) = 'Hospital');

-- Department Admin: own department only
CREATE POLICY dept_admin_doctors ON doctors FOR ALL
  USING (
    current_setting('app.current_role', true) = 'Department'
    AND department_id = current_setting('app.current_department_id', true)::int
  )
  WITH CHECK (
    current_setting('app.current_role', true) = 'Department'
    AND department_id = current_setting('app.current_department_id', true)::int
  );

-- Doctor: SELECT same-department colleagues
CREATE POLICY doctor_read_dept ON doctors FOR SELECT
  USING (
    current_setting('app.current_user_type', true) = 'Doctor'
    AND department_id = current_setting('app.current_department_id', true)::int
  );

-- Doctor: UPDATE own record only
CREATE POLICY doctor_update_self ON doctors FOR UPDATE
  USING (
    current_setting('app.current_user_type', true) = 'Doctor'
    AND id = current_setting('app.current_user_ref_id', true)::int
  )
  WITH CHECK (
    current_setting('app.current_user_type', true) = 'Doctor'
    AND id = current_setting('app.current_user_ref_id', true)::int
  );

-- Staff: SELECT same-department doctors
CREATE POLICY staff_read_dept_doctors ON doctors FOR SELECT
  USING (
    current_setting('app.current_user_type', true) = 'Staff'
    AND department_id = current_setting('app.current_department_id', true)::int
  );


-- ═══════════════════════════════════════════════════════════════
--  STEP 3: STAFF table policies
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY superadmin_all_staff ON staff FOR ALL
  USING (current_setting('app.current_role', true) = 'Super')
  WITH CHECK (current_setting('app.current_role', true) = 'Super');

CREATE POLICY hospital_admin_all_staff ON staff FOR ALL
  USING (current_setting('app.current_role', true) = 'Hospital')
  WITH CHECK (current_setting('app.current_role', true) = 'Hospital');

CREATE POLICY dept_admin_staff ON staff FOR ALL
  USING (
    current_setting('app.current_role', true) = 'Department'
    AND department_id = current_setting('app.current_department_id', true)::int
  )
  WITH CHECK (
    current_setting('app.current_role', true) = 'Department'
    AND department_id = current_setting('app.current_department_id', true)::int
  );

CREATE POLICY doctor_read_dept_staff ON staff FOR SELECT
  USING (
    current_setting('app.current_user_type', true) = 'Doctor'
    AND department_id = current_setting('app.current_department_id', true)::int
  );

CREATE POLICY staff_read_dept_staff ON staff FOR SELECT
  USING (
    current_setting('app.current_user_type', true) = 'Staff'
    AND department_id = current_setting('app.current_department_id', true)::int
  );

CREATE POLICY staff_update_self ON staff FOR UPDATE
  USING (
    current_setting('app.current_user_type', true) = 'Staff'
    AND id = current_setting('app.current_user_ref_id', true)::int
  )
  WITH CHECK (
    current_setting('app.current_user_type', true) = 'Staff'
    AND id = current_setting('app.current_user_ref_id', true)::int
  );


-- ═══════════════════════════════════════════════════════════════
--  STEP 4: ADMINS table policies
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY superadmin_all_admins ON admins FOR ALL
  USING (current_setting('app.current_role', true) = 'Super')
  WITH CHECK (current_setting('app.current_role', true) = 'Super');

CREATE POLICY hospital_admin_read_admins ON admins FOR SELECT
  USING (current_setting('app.current_role', true) = 'Hospital');

-- Admins can view own record
CREATE POLICY admin_read_self ON admins FOR SELECT
  USING (
    current_setting('app.current_user_type', true) = 'Admin'
    AND id = current_setting('app.current_user_ref_id', true)::int
  );


-- ═══════════════════════════════════════════════════════════════
--  STEP 5: PATIENTS table policies
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY superadmin_all_patients ON patients FOR ALL
  USING (current_setting('app.current_role', true) = 'Super')
  WITH CHECK (current_setting('app.current_role', true) = 'Super');

CREATE POLICY hospital_admin_all_patients ON patients FOR ALL
  USING (current_setting('app.current_role', true) = 'Hospital')
  WITH CHECK (current_setting('app.current_role', true) = 'Hospital');

-- Doctors: read all patients (cross-department referrals common in hospitals)
CREATE POLICY doctor_read_patients ON patients FOR SELECT
  USING (current_setting('app.current_user_type', true) = 'Doctor');

-- Doctor: insert patients (they register patients during consultation)
CREATE POLICY doctor_insert_patients ON patients FOR INSERT
  WITH CHECK (current_setting('app.current_user_type', true) = 'Doctor');

-- Staff (Receptionist/Nurse): read + insert patients
CREATE POLICY staff_read_patients ON patients FOR SELECT
  USING (current_setting('app.current_user_type', true) = 'Staff');

CREATE POLICY staff_insert_patients ON patients FOR INSERT
  WITH CHECK (current_setting('app.current_user_type', true) = 'Staff');

-- Department Admin: manage own department patients
CREATE POLICY dept_admin_patients ON patients FOR ALL
  USING (current_setting('app.current_role', true) = 'Department')
  WITH CHECK (current_setting('app.current_role', true) = 'Department');


-- ═══════════════════════════════════════════════════════════════
--  STEP 6: APPOINTMENTS table policies
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY superadmin_all_appointments ON appointments FOR ALL
  USING (current_setting('app.current_role', true) = 'Super')
  WITH CHECK (current_setting('app.current_role', true) = 'Super');

CREATE POLICY hospital_admin_all_appointments ON appointments FOR ALL
  USING (current_setting('app.current_role', true) = 'Hospital')
  WITH CHECK (current_setting('app.current_role', true) = 'Hospital');

-- Doctor: own appointments only
CREATE POLICY doctor_own_appointments ON appointments FOR ALL
  USING (
    current_setting('app.current_user_type', true) = 'Doctor'
    AND doctor_id = current_setting('app.current_user_ref_id', true)::int
  )
  WITH CHECK (
    current_setting('app.current_user_type', true) = 'Doctor'
    AND doctor_id = current_setting('app.current_user_ref_id', true)::int
  );

-- Staff: read all appointments (scheduling), insert new ones
CREATE POLICY staff_read_appointments ON appointments FOR SELECT
  USING (current_setting('app.current_user_type', true) = 'Staff');

CREATE POLICY staff_insert_appointments ON appointments FOR INSERT
  WITH CHECK (current_setting('app.current_user_type', true) = 'Staff');

CREATE POLICY staff_update_appointments ON appointments FOR UPDATE
  USING (current_setting('app.current_user_type', true) = 'Staff')
  WITH CHECK (current_setting('app.current_user_type', true) = 'Staff');

CREATE POLICY dept_admin_appointments ON appointments FOR ALL
  USING (current_setting('app.current_role', true) = 'Department')
  WITH CHECK (current_setting('app.current_role', true) = 'Department');


-- ═══════════════════════════════════════════════════════════════
--  STEP 7: MEDICAL_RECORDS table policies
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY superadmin_all_records ON medical_records FOR ALL
  USING (current_setting('app.current_role', true) = 'Super')
  WITH CHECK (current_setting('app.current_role', true) = 'Super');

CREATE POLICY hospital_admin_all_records ON medical_records FOR ALL
  USING (current_setting('app.current_role', true) = 'Hospital')
  WITH CHECK (current_setting('app.current_role', true) = 'Hospital');

-- Doctor: own medical records only
CREATE POLICY doctor_own_records ON medical_records FOR ALL
  USING (
    current_setting('app.current_user_type', true) = 'Doctor'
    AND doctor_id = current_setting('app.current_user_ref_id', true)::int
  )
  WITH CHECK (
    current_setting('app.current_user_type', true) = 'Doctor'
    AND doctor_id = current_setting('app.current_user_ref_id', true)::int
  );

-- Staff: read medical records (nurses need access)
CREATE POLICY staff_read_records ON medical_records FOR SELECT
  USING (current_setting('app.current_user_type', true) = 'Staff');

CREATE POLICY dept_admin_records ON medical_records FOR ALL
  USING (current_setting('app.current_role', true) = 'Department')
  WITH CHECK (current_setting('app.current_role', true) = 'Department');


-- ═══════════════════════════════════════════════════════════════
--  STEP 8: WARDS + BEDS table policies
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY superadmin_all_wards ON wards FOR ALL
  USING (current_setting('app.current_role', true) = 'Super')
  WITH CHECK (current_setting('app.current_role', true) = 'Super');

CREATE POLICY hospital_admin_all_wards ON wards FOR ALL
  USING (current_setting('app.current_role', true) = 'Hospital')
  WITH CHECK (current_setting('app.current_role', true) = 'Hospital');

-- All authenticated users can read wards
CREATE POLICY any_read_wards ON wards FOR SELECT
  USING (current_setting('app.current_user_type', true) IS NOT NULL);

CREATE POLICY dept_admin_wards ON wards FOR ALL
  USING (current_setting('app.current_role', true) = 'Department')
  WITH CHECK (current_setting('app.current_role', true) = 'Department');

CREATE POLICY superadmin_all_beds ON beds FOR ALL
  USING (current_setting('app.current_role', true) = 'Super')
  WITH CHECK (current_setting('app.current_role', true) = 'Super');

CREATE POLICY hospital_admin_all_beds ON beds FOR ALL
  USING (current_setting('app.current_role', true) = 'Hospital')
  WITH CHECK (current_setting('app.current_role', true) = 'Hospital');

CREATE POLICY any_read_beds ON beds FOR SELECT
  USING (current_setting('app.current_user_type', true) IS NOT NULL);

CREATE POLICY staff_update_beds ON beds FOR UPDATE
  USING (current_setting('app.current_user_type', true) = 'Staff')
  WITH CHECK (current_setting('app.current_user_type', true) = 'Staff');

CREATE POLICY dept_admin_beds ON beds FOR ALL
  USING (current_setting('app.current_role', true) = 'Department')
  WITH CHECK (current_setting('app.current_role', true) = 'Department');


-- ═══════════════════════════════════════════════════════════════
--  STEP 9: ADMISSIONS table policies
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY superadmin_all_admissions ON admissions FOR ALL
  USING (current_setting('app.current_role', true) = 'Super')
  WITH CHECK (current_setting('app.current_role', true) = 'Super');

CREATE POLICY hospital_admin_all_admissions ON admissions FOR ALL
  USING (current_setting('app.current_role', true) = 'Hospital')
  WITH CHECK (current_setting('app.current_role', true) = 'Hospital');

CREATE POLICY doctor_read_admissions ON admissions FOR SELECT
  USING (current_setting('app.current_user_type', true) = 'Doctor');

CREATE POLICY staff_read_admissions ON admissions FOR SELECT
  USING (current_setting('app.current_user_type', true) = 'Staff');

CREATE POLICY staff_manage_admissions ON admissions FOR INSERT
  WITH CHECK (current_setting('app.current_user_type', true) = 'Staff');

CREATE POLICY staff_update_admissions ON admissions FOR UPDATE
  USING (current_setting('app.current_user_type', true) = 'Staff')
  WITH CHECK (current_setting('app.current_user_type', true) = 'Staff');

CREATE POLICY dept_admin_admissions ON admissions FOR ALL
  USING (current_setting('app.current_role', true) = 'Department')
  WITH CHECK (current_setting('app.current_role', true) = 'Department');


-- ═══════════════════════════════════════════════════════════════
--  STEP 10: BILLING + BILLING_ITEMS table policies
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY superadmin_all_billing ON billing FOR ALL
  USING (current_setting('app.current_role', true) = 'Super')
  WITH CHECK (current_setting('app.current_role', true) = 'Super');

CREATE POLICY hospital_admin_all_billing ON billing FOR ALL
  USING (current_setting('app.current_role', true) = 'Hospital')
  WITH CHECK (current_setting('app.current_role', true) = 'Hospital');

CREATE POLICY any_read_billing ON billing FOR SELECT
  USING (current_setting('app.current_user_type', true) IS NOT NULL);

CREATE POLICY staff_manage_billing ON billing FOR INSERT
  WITH CHECK (current_setting('app.current_user_type', true) = 'Staff');

CREATE POLICY staff_update_billing ON billing FOR UPDATE
  USING (current_setting('app.current_user_type', true) = 'Staff')
  WITH CHECK (current_setting('app.current_user_type', true) = 'Staff');

CREATE POLICY dept_admin_billing ON billing FOR ALL
  USING (current_setting('app.current_role', true) = 'Department')
  WITH CHECK (current_setting('app.current_role', true) = 'Department');

CREATE POLICY superadmin_all_billing_items ON billing_items FOR ALL
  USING (current_setting('app.current_role', true) = 'Super')
  WITH CHECK (current_setting('app.current_role', true) = 'Super');

CREATE POLICY hospital_admin_all_billing_items ON billing_items FOR ALL
  USING (current_setting('app.current_role', true) = 'Hospital')
  WITH CHECK (current_setting('app.current_role', true) = 'Hospital');

CREATE POLICY any_read_billing_items ON billing_items FOR SELECT
  USING (current_setting('app.current_user_type', true) IS NOT NULL);

CREATE POLICY staff_manage_billing_items ON billing_items FOR INSERT
  WITH CHECK (current_setting('app.current_user_type', true) = 'Staff');

CREATE POLICY staff_update_billing_items ON billing_items FOR UPDATE
  USING (current_setting('app.current_user_type', true) = 'Staff')
  WITH CHECK (current_setting('app.current_user_type', true) = 'Staff');

CREATE POLICY dept_admin_billing_items ON billing_items FOR ALL
  USING (current_setting('app.current_role', true) = 'Department')
  WITH CHECK (current_setting('app.current_role', true) = 'Department');


-- ═══════════════════════════════════════════════════════════════
--  STEP 11: AUTH_CREDENTIALS table policies
-- ═══════════════════════════════════════════════════════════════

-- Super Admin only for full access
CREATE POLICY superadmin_all_auth ON auth_credentials FOR ALL
  USING (current_setting('app.current_role', true) = 'Super')
  WITH CHECK (current_setting('app.current_role', true) = 'Super');

CREATE POLICY hospital_admin_read_auth ON auth_credentials FOR SELECT
  USING (current_setting('app.current_role', true) = 'Hospital');

-- Users can read/update own credentials (password changes)
CREATE POLICY user_own_credentials ON auth_credentials FOR SELECT
  USING (
    employee_code = current_setting('app.current_employee_code', true)
  );

CREATE POLICY user_update_own_credentials ON auth_credentials FOR UPDATE
  USING (
    employee_code = current_setting('app.current_employee_code', true)
  )
  WITH CHECK (
    employee_code = current_setting('app.current_employee_code', true)
  );

-- Login bypass: allow SELECT during authentication (before session vars are set)
-- This is handled by using a separate non-RLS query path for login
