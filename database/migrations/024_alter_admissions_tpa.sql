-- Migration 024: Link admissions to TPA entities
-- Dependencies: admissions, insurance_policies, preauth_requests

-- ─── Insurance case flag and policy link ───
ALTER TABLE admissions ADD COLUMN IF NOT EXISTS is_insurance_case BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE admissions ADD COLUMN IF NOT EXISTS insurance_policy_id INT REFERENCES insurance_policies(id) ON DELETE SET NULL;
ALTER TABLE admissions ADD COLUMN IF NOT EXISTS preauth_id INT REFERENCES preauth_requests(id) ON DELETE SET NULL;
ALTER TABLE admissions ADD COLUMN IF NOT EXISTS co_payment_percent DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE admissions ADD COLUMN IF NOT EXISTS deductible_amount DECIMAL(10,2) DEFAULT 0.00;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admissions_insurance ON admissions(is_insurance_case) WHERE is_insurance_case = TRUE;
CREATE INDEX IF NOT EXISTS idx_admissions_policy ON admissions(insurance_policy_id) WHERE insurance_policy_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_admissions_preauth ON admissions(preauth_id) WHERE preauth_id IS NOT NULL;

COMMENT ON COLUMN admissions.is_insurance_case IS 'TRUE if this admission is covered by an insurance policy';
COMMENT ON COLUMN admissions.insurance_policy_id IS 'FK to insurance_policies — the active policy for this admission';
COMMENT ON COLUMN admissions.preauth_id IS 'FK to preauth_requests — approved pre-authorization for this admission';
COMMENT ON COLUMN admissions.co_payment_percent IS 'Co-payment percentage copied from policy at admission time';
COMMENT ON COLUMN admissions.deductible_amount IS 'Deductible amount copied from policy at admission time';
