-- Migration 020: Create insurance_policies table
-- Dependencies: patients, tpa_vendors

CREATE TABLE IF NOT EXISTS insurance_policies (
    id                      SERIAL          PRIMARY KEY,
    patient_id              INT             NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    tpa_vendor_id           INT             NOT NULL REFERENCES tpa_vendors(id) ON DELETE RESTRICT,
    policy_number           VARCHAR(50)     NOT NULL,
    insurance_company       VARCHAR(200)    NOT NULL,
    plan_name               VARCHAR(200),
    policy_start_date       DATE            NOT NULL,
    policy_end_date         DATE            NOT NULL,
    sum_insured             DECIMAL(14,2)   NOT NULL CHECK (sum_insured > 0),
    balance_available       DECIMAL(14,2)   NOT NULL CHECK (balance_available >= 0),
    co_payment_percent      DECIMAL(5,2)    NOT NULL DEFAULT 0.00 CHECK (co_payment_percent >= 0 AND co_payment_percent <= 100),
    deductible_amount       DECIMAL(10,2)   NOT NULL DEFAULT 0.00 CHECK (deductible_amount >= 0),
    room_rent_limit         DECIMAL(10,2),
    member_id               VARCHAR(50),
    relation_to_primary     VARCHAR(30)     NOT NULL DEFAULT 'Self' CHECK (relation_to_primary IN (
                                'Self', 'Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Other'
                            )),
    is_active               BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_policy_dates CHECK (policy_end_date > policy_start_date)
);

-- Indexes
CREATE INDEX idx_policies_patient ON insurance_policies(patient_id);
CREATE INDEX idx_policies_vendor ON insurance_policies(tpa_vendor_id);
CREATE INDEX idx_policies_number ON insurance_policies(policy_number);
CREATE INDEX idx_policies_active ON insurance_policies(is_active, policy_end_date) WHERE is_active = TRUE;

COMMENT ON TABLE insurance_policies IS 'Patient insurance policies — links patients to TPA vendors with coverage limits';
COMMENT ON COLUMN insurance_policies.sum_insured IS 'Total policy coverage limit in INR';
COMMENT ON COLUMN insurance_policies.balance_available IS 'Remaining coverage limit — decremented on claim settlement';
COMMENT ON COLUMN insurance_policies.co_payment_percent IS 'Patient co-payment percentage (e.g. 10.00 = 10%)';
COMMENT ON COLUMN insurance_policies.deductible_amount IS 'Fixed deductible amount in INR per claim';
COMMENT ON COLUMN insurance_policies.room_rent_limit IS 'Maximum room rent per day allowed under policy';
