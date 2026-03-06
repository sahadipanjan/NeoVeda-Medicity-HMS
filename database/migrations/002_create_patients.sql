-- Migration 002: Create patients table
-- Dependencies: None

CREATE TABLE IF NOT EXISTS patients (
    id                      SERIAL          PRIMARY KEY,
    uhid                    VARCHAR(20)     NOT NULL UNIQUE,
    first_name              VARCHAR(100)    NOT NULL,
    last_name               VARCHAR(100)    NOT NULL,
    date_of_birth           DATE            NOT NULL,
    gender                  VARCHAR(10)     NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    aadhaar_number          VARCHAR(12)     UNIQUE,   -- Encrypted at application layer
    phone                   VARCHAR(15)     NOT NULL,
    email                   VARCHAR(255),
    address_line1           VARCHAR(255),
    address_line2           VARCHAR(255),
    city                    VARCHAR(100),
    state                   VARCHAR(100),
    pincode                 VARCHAR(6),
    blood_group             VARCHAR(5)      CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
    emergency_contact_name  VARCHAR(200),
    emergency_contact_phone VARCHAR(15),
    is_active               BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes for common lookup patterns
CREATE INDEX idx_patients_uhid ON patients(uhid);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_name ON patients(last_name, first_name);
CREATE INDEX idx_patients_active ON patients(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE patients IS 'Patient demographics and identification — UHID is the unique hospital identifier';
COMMENT ON COLUMN patients.uhid IS 'Unique Hospital ID, format: UHID-YYYYMMDD-XXXXX';
COMMENT ON COLUMN patients.aadhaar_number IS 'Indian national ID — encrypted at rest via application layer';
