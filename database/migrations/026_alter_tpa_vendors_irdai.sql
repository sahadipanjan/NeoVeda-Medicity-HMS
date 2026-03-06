-- Migration 026: Add IRDAI fields to tpa_vendors and alter schema
-- Dependencies: tpa_vendors (019)

-- ─── Add IRDAI registration, toll-free helpline columns ───
ALTER TABLE tpa_vendors ADD COLUMN IF NOT EXISTS irdai_registration_no VARCHAR(10);
ALTER TABLE tpa_vendors ADD COLUMN IF NOT EXISTS toll_free_helpline VARCHAR(20);

-- Ensure vendor_code can accommodate TPA001-TPA030 format
-- (already VARCHAR(20), no change needed)

CREATE INDEX IF NOT EXISTS idx_tpa_vendors_irdai ON tpa_vendors(irdai_registration_no) WHERE irdai_registration_no IS NOT NULL;

COMMENT ON COLUMN tpa_vendors.irdai_registration_no IS 'IRDAI TPA registration number';
COMMENT ON COLUMN tpa_vendors.toll_free_helpline IS 'Toll-free customer helpline number';
