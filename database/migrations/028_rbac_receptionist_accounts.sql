-- Migration 028: RBAC refinement — Role-specific RLS policies
-- Receptionist: SELECT + UPDATE only (no INSERT anywhere)
-- Accounts/Finance: Financial tables only (billing, TPA, insurance)
-- Dependencies: migration 018 (base RLS policies)

-- ═══════════════════════════════════════════════════════════════
--  STEP 1: Drop overly-broad Staff INSERT policies
--  These gave ALL Staff (inc. Receptionist) INSERT on everything
-- ═══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS staff_insert_patients ON patients;
DROP POLICY IF EXISTS staff_insert_appointments ON appointments;
DROP POLICY IF EXISTS staff_manage_admissions ON admissions;
DROP POLICY IF EXISTS staff_manage_billing ON billing;
DROP POLICY IF EXISTS staff_manage_billing_items ON billing_items;

-- ═══════════════════════════════════════════════════════════════
--  STEP 2: RECEPTIONIST — SELECT + UPDATE only
--  Matches: current_setting('app.current_role') = 'Receptionist'
-- ═══════════════════════════════════════════════════════════════

-- Patients: SELECT + UPDATE (can view & edit patient details, NOT register new)
CREATE POLICY receptionist_read_patients ON patients FOR SELECT
  USING (current_setting('app.current_role', true) = 'Receptionist');

CREATE POLICY receptionist_update_patients ON patients FOR UPDATE
  USING (current_setting('app.current_role', true) = 'Receptionist')
  WITH CHECK (current_setting('app.current_role', true) = 'Receptionist');

-- Appointments: SELECT + UPDATE (can view & update status, NOT create new)
CREATE POLICY receptionist_read_appointments ON appointments FOR SELECT
  USING (current_setting('app.current_role', true) = 'Receptionist');

CREATE POLICY receptionist_update_appointments ON appointments FOR UPDATE
  USING (current_setting('app.current_role', true) = 'Receptionist')
  WITH CHECK (current_setting('app.current_role', true) = 'Receptionist');

-- Admissions: SELECT + UPDATE (can view & update status, NOT create new)
CREATE POLICY receptionist_read_admissions ON admissions FOR SELECT
  USING (current_setting('app.current_role', true) = 'Receptionist');

CREATE POLICY receptionist_update_admissions ON admissions FOR UPDATE
  USING (current_setting('app.current_role', true) = 'Receptionist')
  WITH CHECK (current_setting('app.current_role', true) = 'Receptionist');

-- Wards: SELECT only (already covered by any_read_wards)
-- Beds: SELECT + UPDATE (already covered by any_read_beds + staff_update_beds)

-- Billing: SELECT only (can view invoices, not create/edit)
CREATE POLICY receptionist_read_billing ON billing FOR SELECT
  USING (current_setting('app.current_role', true) = 'Receptionist');

CREATE POLICY receptionist_read_billing_items ON billing_items FOR SELECT
  USING (current_setting('app.current_role', true) = 'Receptionist');


-- ═══════════════════════════════════════════════════════════════
--  STEP 3: NURSE — Retains INSERT + UPDATE (re-create dropped policies)
--  Matches: current_setting('app.current_role') = 'Nurse'
-- ═══════════════════════════════════════════════════════════════

-- Patients: INSERT (nurses register patients during triage)
CREATE POLICY nurse_insert_patients ON patients FOR INSERT
  WITH CHECK (current_setting('app.current_role', true) = 'Nurse');

-- Appointments: INSERT (nurses can schedule appointments)
CREATE POLICY nurse_insert_appointments ON appointments FOR INSERT
  WITH CHECK (current_setting('app.current_role', true) = 'Nurse');

-- Admissions: INSERT (nurses can create admissions)
CREATE POLICY nurse_manage_admissions ON admissions FOR INSERT
  WITH CHECK (current_setting('app.current_role', true) = 'Nurse');

-- Billing: INSERT (nurses can generate bills)
CREATE POLICY nurse_manage_billing ON billing FOR INSERT
  WITH CHECK (current_setting('app.current_role', true) = 'Nurse');

CREATE POLICY nurse_manage_billing_items ON billing_items FOR INSERT
  WITH CHECK (current_setting('app.current_role', true) = 'Nurse');


-- ═══════════════════════════════════════════════════════════════
--  STEP 4: ACCOUNTS/FINANCE — Financial tables only
--  Matches: current_setting('app.current_role') = 'Accounts/Finance'
-- ═══════════════════════════════════════════════════════════════

-- Billing: Full operations (SELECT, INSERT, UPDATE)
CREATE POLICY accounts_all_billing ON billing FOR ALL
  USING (current_setting('app.current_role', true) = 'Accounts/Finance')
  WITH CHECK (current_setting('app.current_role', true) = 'Accounts/Finance');

CREATE POLICY accounts_all_billing_items ON billing_items FOR ALL
  USING (current_setting('app.current_role', true) = 'Accounts/Finance')
  WITH CHECK (current_setting('app.current_role', true) = 'Accounts/Finance');

-- TPA tables: Enable RLS first, then grant Accounts/Finance access
ALTER TABLE tpa_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE tpa_vendors FORCE ROW LEVEL SECURITY;
ALTER TABLE tpa_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE tpa_claims FORCE ROW LEVEL SECURITY;
ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_policies FORCE ROW LEVEL SECURITY;
ALTER TABLE preauth_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE preauth_requests FORCE ROW LEVEL SECURITY;

-- Super/Hospital admin: ALL on TPA tables
CREATE POLICY superadmin_all_tpa_vendors ON tpa_vendors FOR ALL
  USING (current_setting('app.current_role', true) IN ('Super', 'Hospital'))
  WITH CHECK (current_setting('app.current_role', true) IN ('Super', 'Hospital'));

CREATE POLICY superadmin_all_tpa_claims ON tpa_claims FOR ALL
  USING (current_setting('app.current_role', true) IN ('Super', 'Hospital'))
  WITH CHECK (current_setting('app.current_role', true) IN ('Super', 'Hospital'));

CREATE POLICY superadmin_all_insurance_policies ON insurance_policies FOR ALL
  USING (current_setting('app.current_role', true) IN ('Super', 'Hospital'))
  WITH CHECK (current_setting('app.current_role', true) IN ('Super', 'Hospital'));

CREATE POLICY superadmin_all_preauth_requests ON preauth_requests FOR ALL
  USING (current_setting('app.current_role', true) IN ('Super', 'Hospital'))
  WITH CHECK (current_setting('app.current_role', true) IN ('Super', 'Hospital'));

-- Accounts/Finance: Full operations on TPA tables
CREATE POLICY accounts_all_tpa_vendors ON tpa_vendors FOR ALL
  USING (current_setting('app.current_role', true) = 'Accounts/Finance')
  WITH CHECK (current_setting('app.current_role', true) = 'Accounts/Finance');

CREATE POLICY accounts_all_tpa_claims ON tpa_claims FOR ALL
  USING (current_setting('app.current_role', true) = 'Accounts/Finance')
  WITH CHECK (current_setting('app.current_role', true) = 'Accounts/Finance');

CREATE POLICY accounts_all_insurance_policies ON insurance_policies FOR ALL
  USING (current_setting('app.current_role', true) = 'Accounts/Finance')
  WITH CHECK (current_setting('app.current_role', true) = 'Accounts/Finance');

CREATE POLICY accounts_all_preauth_requests ON preauth_requests FOR ALL
  USING (current_setting('app.current_role', true) = 'Accounts/Finance')
  WITH CHECK (current_setting('app.current_role', true) = 'Accounts/Finance');

-- Patients: SELECT only for Accounts/Finance (need patient name for billing)
CREATE POLICY accounts_read_patients ON patients FOR SELECT
  USING (current_setting('app.current_role', true) = 'Accounts/Finance');

-- Admissions: SELECT only (need admission_id for billing context)
CREATE POLICY accounts_read_admissions ON admissions FOR SELECT
  USING (current_setting('app.current_role', true) = 'Accounts/Finance');


-- ═══════════════════════════════════════════════════════════════
--  STEP 5: Any Staff member can still READ wards/beds/doctors
--  (existing any_read_wards, any_read_beds, staff_read_dept_doctors
--   still apply — no changes needed)
-- ═══════════════════════════════════════════════════════════════

COMMENT ON POLICY receptionist_read_patients ON patients IS 'Receptionist can view all patients but NOT register new ones';
COMMENT ON POLICY accounts_all_billing ON billing IS 'Accounts/Finance has full billing access';
COMMENT ON POLICY accounts_all_tpa_claims ON tpa_claims IS 'Accounts/Finance can manage TPA claims';
