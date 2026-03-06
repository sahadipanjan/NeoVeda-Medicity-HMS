-- Migration 030: Doctor Role — Global directory access + caseload isolation
-- 1. Replace department-scoped doctor_read_dept with global SELECT
-- 2. Appointments & admissions already have doctor_own_* policies (018)
-- 3. medical_records already has doctor_own_records policy (018)

-- ═══════════════════════════════════════════════════════════════
--  STEP 1: DOCTORS — Grant global SELECT (all departments)
--  Drop the old department-scoped policy, create global one
-- ═══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS doctor_read_dept ON doctors;

CREATE POLICY doctor_read_all_doctors ON doctors FOR SELECT
  USING (current_setting('app.current_user_type', true) = 'Doctor');

-- Doctor retains UPDATE on own record (doctor_update_self from 018 still active)


-- ═══════════════════════════════════════════════════════════════
--  Verify existing caseload isolation (no changes needed):
--  - appointments: doctor_own_appointments (FOR ALL, doctor_id match)
--  - medical_records: doctor_own_records (FOR ALL, doctor_id match)
--  - admissions: already restricted by existing policies
-- ═══════════════════════════════════════════════════════════════

COMMENT ON POLICY doctor_read_all_doctors ON doctors IS 'Doctor can view all doctors across all 21 departments';
