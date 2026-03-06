-- Migration 022: Create preauth_requests table
-- Dependencies: admissions, insurance_policies, tpa_vendors, auth_credentials

CREATE TABLE IF NOT EXISTS preauth_requests (
    id                      SERIAL          PRIMARY KEY,
    preauth_no              VARCHAR(30)     NOT NULL UNIQUE,
    admission_id            INT             NOT NULL REFERENCES admissions(id) ON DELETE RESTRICT,
    insurance_policy_id     INT             NOT NULL REFERENCES insurance_policies(id) ON DELETE RESTRICT,
    tpa_vendor_id           INT             NOT NULL REFERENCES tpa_vendors(id) ON DELETE RESTRICT,
    requested_amount        DECIMAL(12,2)   NOT NULL CHECK (requested_amount > 0),
    approved_amount         DECIMAL(12,2)   CHECK (approved_amount >= 0),
    diagnosis               TEXT            NOT NULL,
    procedure_planned       TEXT,
    icd_code                VARCHAR(10),                  -- ICD-10 diagnosis code
    status                  VARCHAR(30)     NOT NULL DEFAULT 'Initiated' CHECK (status IN (
                                'Initiated', 'Submitted', 'Query Raised', 'Approved',
                                'Partially Approved', 'Rejected', 'Enhancement Requested',
                                'Enhancement Approved', 'Cancelled'
                            )),
    tpa_reference_no        VARCHAR(50),
    query_details           TEXT,                         -- TPA queries / remarks
    remarks                 TEXT,
    requested_by            VARCHAR(20)     REFERENCES auth_credentials(employee_code),
    submitted_at            TIMESTAMPTZ,
    approved_at             TIMESTAMPTZ,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_preauth_admission ON preauth_requests(admission_id);
CREATE INDEX idx_preauth_policy ON preauth_requests(insurance_policy_id);
CREATE INDEX idx_preauth_vendor ON preauth_requests(tpa_vendor_id);
CREATE INDEX idx_preauth_status ON preauth_requests(status);
CREATE INDEX idx_preauth_no ON preauth_requests(preauth_no);
CREATE INDEX idx_preauth_date ON preauth_requests(created_at);

COMMENT ON TABLE preauth_requests IS 'Insurance pre-authorization workflow — tracks approval lifecycle from initiation to final decision';
COMMENT ON COLUMN preauth_requests.preauth_no IS 'Auto-generated format: PA-YYYYMMDDNN';
COMMENT ON COLUMN preauth_requests.icd_code IS 'ICD-10 diagnosis code for TPA submission';
COMMENT ON COLUMN preauth_requests.tpa_reference_no IS 'Reference number assigned by the TPA';
COMMENT ON COLUMN preauth_requests.query_details IS 'Queries raised by TPA during review';
