-- Migration 012: Create billing table
-- Dependencies: patients, admissions, auth_credentials

CREATE TABLE IF NOT EXISTS billing (
    id                  SERIAL          PRIMARY KEY,
    invoice_no          VARCHAR(20)     NOT NULL UNIQUE,
    patient_id          INT             NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    admission_id        INT             REFERENCES admissions(id) ON DELETE SET NULL,  -- NULL for OPD billing
    total_amount        DECIMAL(12,2)   NOT NULL CHECK (total_amount >= 0),
    discount            DECIMAL(12,2)   NOT NULL DEFAULT 0.00 CHECK (discount >= 0),
    tax_amount          DECIMAL(12,2)   NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    net_amount          DECIMAL(12,2)   NOT NULL CHECK (net_amount >= 0),
    payment_status      VARCHAR(20)     NOT NULL DEFAULT 'Pending' CHECK (payment_status IN (
                            'Pending', 'Partial', 'Paid', 'Refunded', 'Written-Off'
                        )),
    payment_mode        VARCHAR(20)     CHECK (payment_mode IN (
                            'Cash', 'Card', 'UPI', 'NEFT', 'Insurance', 'Mixed'
                        )),
    insurance_claim_id  VARCHAR(50),
    generated_by        VARCHAR(20)     REFERENCES auth_credentials(employee_code),
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_billing_patient ON billing(patient_id);
CREATE INDEX idx_billing_admission ON billing(admission_id) WHERE admission_id IS NOT NULL;
CREATE INDEX idx_billing_status ON billing(payment_status);
CREATE INDEX idx_billing_date ON billing(created_at);

COMMENT ON TABLE billing IS 'Invoice header — supports OPD (no admission) and inpatient billing';
COMMENT ON COLUMN billing.tax_amount IS 'GST amount as applicable under Indian tax law';
COMMENT ON COLUMN billing.payment_mode IS 'UPI = Unified Payments Interface, NEFT = National Electronic Funds Transfer';
