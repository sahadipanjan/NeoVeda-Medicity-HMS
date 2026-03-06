-- Migration 003: Create doctors table
-- Dependencies: departments

CREATE TABLE IF NOT EXISTS doctors (
    id                  SERIAL          PRIMARY KEY,
    employee_code       VARCHAR(20)     NOT NULL UNIQUE,
    first_name          VARCHAR(100)    NOT NULL,
    last_name           VARCHAR(100)    NOT NULL,
    department_id       INT             NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    specialization      VARCHAR(200),
    qualification       VARCHAR(300),   -- e.g. "MBBS, MD (Cardiology), DM"
    medical_council_reg VARCHAR(50),    -- MCI / State Medical Council registration
    phone               VARCHAR(15),
    email               VARCHAR(255)    NOT NULL UNIQUE,
    consultation_fee    DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    joined_date         DATE,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Now add the deferred FK from departments.hod_doctor_id → doctors.id
ALTER TABLE departments
    ADD CONSTRAINT fk_departments_hod
    FOREIGN KEY (hod_doctor_id) REFERENCES doctors(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_doctors_department ON doctors(department_id);
CREATE INDEX idx_doctors_employee_code ON doctors(employee_code);
CREATE INDEX idx_doctors_active ON doctors(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE doctors IS 'Doctor profiles linked to departments with MCI registration';
COMMENT ON COLUMN doctors.employee_code IS 'Format: EMP-{DEPT_CODE}-{SEQUENCE}, e.g. EMP-CARD-00001';
COMMENT ON COLUMN doctors.medical_council_reg IS 'Medical Council of India or State Medical Council registration number';
