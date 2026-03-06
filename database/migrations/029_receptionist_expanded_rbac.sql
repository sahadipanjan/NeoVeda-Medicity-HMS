-- Migration 029: Expand Receptionist RBAC
-- Grant INSERT on: patients, admissions, beds, billing, tpa_claims
-- Previous migration 028 restricted Receptionist to SELECT+UPDATE only

-- ═══════════════════════════════════════════════════════════════
--  STEP 1: PATIENTS — Grant INSERT (patient registration)
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY receptionist_insert_patients ON patients FOR INSERT
  WITH CHECK (current_setting('app.current_role', true) = 'Receptionist');


-- ═══════════════════════════════════════════════════════════════
--  STEP 2: ADMISSIONS — Grant INSERT (create new admissions)
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY receptionist_insert_admissions ON admissions FOR INSERT
  WITH CHECK (current_setting('app.current_role', true) = 'Receptionist');


-- ═══════════════════════════════════════════════════════════════
--  STEP 3: BEDS — Grant UPDATE (ward/bed allocation during admission)
--  Note: receptionist already has UPDATE via staff_update_beds policy
--  and SELECT via any_read_beds policy. No additional policy needed.
-- ═══════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════
--  STEP 4: BILLING — Grant INSERT (OPD invoice generation)
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY receptionist_insert_billing ON billing FOR INSERT
  WITH CHECK (current_setting('app.current_role', true) = 'Receptionist');

CREATE POLICY receptionist_insert_billing_items ON billing_items FOR INSERT
  WITH CHECK (current_setting('app.current_role', true) = 'Receptionist');


-- ═══════════════════════════════════════════════════════════════
--  STEP 5: TPA_CLAIMS — Grant INSERT (cashless pre-auth applications)
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY receptionist_insert_tpa_claims ON tpa_claims FOR INSERT
  WITH CHECK (current_setting('app.current_role', true) = 'Receptionist');

-- Receptionist also needs SELECT on tpa_claims to view submitted claims
CREATE POLICY receptionist_read_tpa_claims ON tpa_claims FOR SELECT
  USING (current_setting('app.current_role', true) = 'Receptionist');

-- Receptionist needs SELECT on tpa_vendors (to pick vendor in forms)
CREATE POLICY receptionist_read_tpa_vendors ON tpa_vendors FOR SELECT
  USING (current_setting('app.current_role', true) = 'Receptionist');

-- Receptionist needs SELECT on insurance_policies (to link claims)
CREATE POLICY receptionist_read_insurance_policies ON insurance_policies FOR SELECT
  USING (current_setting('app.current_role', true) = 'Receptionist');

-- Receptionist needs SELECT + INSERT on preauth_requests
CREATE POLICY receptionist_read_preauth ON preauth_requests FOR SELECT
  USING (current_setting('app.current_role', true) = 'Receptionist');

CREATE POLICY receptionist_insert_preauth ON preauth_requests FOR INSERT
  WITH CHECK (current_setting('app.current_role', true) = 'Receptionist');


-- ═══════════════════════════════════════════════════════════════
--  STEP 6: APPOINTMENTS — Grant INSERT (scheduling)
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY receptionist_insert_appointments ON appointments FOR INSERT
  WITH CHECK (current_setting('app.current_role', true) = 'Receptionist');
