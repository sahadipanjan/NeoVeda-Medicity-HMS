-- Migration 025: Link billing to TPA claims and co-payment breakdown
-- Dependencies: billing, tpa_claims

-- ─── TPA claim link and insurance breakdown ───
ALTER TABLE billing ADD COLUMN IF NOT EXISTS tpa_claim_id INT REFERENCES tpa_claims(id) ON DELETE SET NULL;
ALTER TABLE billing ADD COLUMN IF NOT EXISTS insurance_covered DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE billing ADD COLUMN IF NOT EXISTS co_payment_amount DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE billing ADD COLUMN IF NOT EXISTS deductible_applied DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE billing ADD COLUMN IF NOT EXISTS patient_net_payable DECIMAL(12,2);
ALTER TABLE billing ADD COLUMN IF NOT EXISTS tariff_applied VARCHAR(30);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_billing_tpa_claim ON billing(tpa_claim_id) WHERE tpa_claim_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_billing_tariff ON billing(tariff_applied) WHERE tariff_applied IS NOT NULL;

COMMENT ON COLUMN billing.tpa_claim_id IS 'FK to tpa_claims — the insurance claim associated with this invoice';
COMMENT ON COLUMN billing.insurance_covered IS 'Amount covered by insurance (approved by TPA)';
COMMENT ON COLUMN billing.co_payment_amount IS 'Patient co-payment amount for this invoice';
COMMENT ON COLUMN billing.deductible_applied IS 'Deductible amount applied to this invoice';
COMMENT ON COLUMN billing.patient_net_payable IS 'Net amount payable by patient after insurance deductions';
COMMENT ON COLUMN billing.tariff_applied IS 'Tariff schedule applied: CGHS, ECHS, Private, or Hospital';
