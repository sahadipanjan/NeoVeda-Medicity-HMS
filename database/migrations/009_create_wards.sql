-- Migration 009: Create wards table
-- Dependencies: departments

CREATE TABLE IF NOT EXISTS wards (
    id              SERIAL          PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL,
    ward_code       VARCHAR(10)     NOT NULL UNIQUE,
    department_id   INT             REFERENCES departments(id) ON DELETE SET NULL,
    ward_type       VARCHAR(30)     NOT NULL CHECK (ward_type IN (
                        'General', 'Semi-Private', 'Private',
                        'ICU', 'NICU', 'PICU', 'CCU', 'HDU', 'Isolation'
                    )),
    floor           VARCHAR(20),
    total_beds      INT             NOT NULL CHECK (total_beds > 0),
    charge_per_day  DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_wards_department ON wards(department_id);
CREATE INDEX idx_wards_type ON wards(ward_type);
CREATE INDEX idx_wards_active ON wards(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE wards IS 'Hospital wards — General, ICU, NICU, CCU, etc.';
COMMENT ON COLUMN wards.ward_type IS 'ICU=Intensive Care, NICU=Neonatal ICU, PICU=Pediatric ICU, CCU=Coronary Care, HDU=High Dependency';
