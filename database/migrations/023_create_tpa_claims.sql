-- Migration 023: Create tpa_claims table
-- Dependencies: admissions, billing, preauth_requests, insurance_policies, tpa_vendors, auth_credentials

CREATE TABLE IF NOT EXISTS tpa_claims (
    id                      SERIAL          PRIMARY KEY,
    claim_no                VARCHAR(30)     NOT NULL UNIQUE,
    admission_id            INT             NOT NULL REFERENCES admissions(id) ON DELETE RESTRICT,
    billing_id              INT             REFERENCES billing(id) ON DELETE SET NULL,
    preauth_id              INT             REFERENCES preauth_requests(id) ON DELETE SET NULL,
    insurance_policy_id     INT             NOT NULL REFERENCES insurance_policies(id) ON DELETE RESTRICT,
    tpa_vendor_id           INT             NOT NULL REFERENCES tpa_vendors(id) ON DELETE RESTRICT,
    claim_type              VARCHAR(20)     NOT NULL DEFAULT 'Cashless' CHECK (claim_type IN ('Cashless', 'Reimbursement')),
    total_bill_amount       DECIMAL(12,2)   NOT NULL CHECK (total_bill_amount >= 0),
    approved_amount         DECIMAL(12,2)   CHECK (approved_amount >= 0),
    settled_amount          DECIMAL(12,2)   CHECK (settled_amount >= 0),
    tds_deducted            DECIMAL(10,2)   NOT NULL DEFAULT 0.00 CHECK (tds_deducted >= 0),
    co_payment_amount       DECIMAL(10,2)   NOT NULL DEFAULT 0.00 CHECK (co_payment_amount >= 0),
    deductible_amount       DECIMAL(10,2)   NOT NULL DEFAULT 0.00 CHECK (deductible_amount >= 0),
    disallowance_amount     DECIMAL(10,2)   NOT NULL DEFAULT 0.00 CHECK (disallowance_amount >= 0),
    patient_payable         DECIMAL(12,2)   NOT NULL DEFAULT 0.00 CHECK (patient_payable >= 0),
    status                  VARCHAR(30)     NOT NULL DEFAULT 'Draft' CHECK (status IN (
                                'Draft', 'Submitted', 'Under Review', 'Query Raised',
                                'Approved', 'Partially Settled', 'Settled',
                                'Rejected', 'Appealed', 'Closed'
                            )),
    tpa_reference_no        VARCHAR(50),
    settlement_date         DATE,
    settlement_utr          VARCHAR(50),
    rejection_reason        TEXT,
    remarks                 TEXT,
    submitted_by            VARCHAR(20)     REFERENCES auth_credentials(employee_code),
    submitted_at            TIMESTAMPTZ,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_claims_admission ON tpa_claims(admission_id);
CREATE INDEX idx_claims_billing ON tpa_claims(billing_id) WHERE billing_id IS NOT NULL;
CREATE INDEX idx_claims_preauth ON tpa_claims(preauth_id) WHERE preauth_id IS NOT NULL;
CREATE INDEX idx_claims_policy ON tpa_claims(insurance_policy_id);
CREATE INDEX idx_claims_vendor ON tpa_claims(tpa_vendor_id);
CREATE INDEX idx_claims_status ON tpa_claims(status);
CREATE INDEX idx_claims_no ON tpa_claims(claim_no);
CREATE INDEX idx_claims_date ON tpa_claims(created_at);
CREATE INDEX idx_claims_settlement ON tpa_claims(settlement_date) WHERE settlement_date IS NOT NULL;

COMMENT ON TABLE tpa_claims IS 'Insurance claim lifecycle — from draft creation through TPA settlement';
COMMENT ON COLUMN tpa_claims.claim_no IS 'Auto-generated format: CLM-YYYYMMDDNN';
COMMENT ON COLUMN tpa_claims.claim_type IS 'Cashless = direct settlement with hospital; Reimbursement = patient pays, then claims';
COMMENT ON COLUMN tpa_claims.tds_deducted IS 'Tax Deducted at Source by TPA during settlement';
COMMENT ON COLUMN tpa_claims.disallowance_amount IS 'Amount disallowed by TPA (not covered under policy)';
COMMENT ON COLUMN tpa_claims.settlement_utr IS 'UTR/NEFT reference number for settlement payment';
COMMENT ON COLUMN tpa_claims.patient_payable IS 'Net amount patient must pay: co-pay + deductible + disallowance + non-covered';
