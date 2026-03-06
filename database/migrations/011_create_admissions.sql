-- Migration 011: Create admissions table
-- Dependencies: patients, doctors, beds, departments

CREATE TABLE IF NOT EXISTS admissions (
    id                      SERIAL          PRIMARY KEY,
    admission_no            VARCHAR(20)     NOT NULL UNIQUE,
    patient_id              INT             NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    doctor_id               INT             NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    bed_id                  INT             NOT NULL REFERENCES beds(id) ON DELETE RESTRICT,
    department_id           INT             NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    admission_date          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    discharge_date          TIMESTAMPTZ,
    status                  VARCHAR(20)     NOT NULL DEFAULT 'Active' CHECK (status IN (
                                'Active', 'Discharged', 'Transferred', 'LAMA', 'Expired'
                            )),
    diagnosis_at_admission  TEXT,
    discharge_summary       TEXT,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_admissions_patient ON admissions(patient_id);
CREATE INDEX idx_admissions_doctor ON admissions(doctor_id);
CREATE INDEX idx_admissions_bed ON admissions(bed_id);
CREATE INDEX idx_admissions_status ON admissions(status) WHERE status = 'Active';
CREATE INDEX idx_admissions_dates ON admissions(admission_date, discharge_date);

COMMENT ON TABLE admissions IS 'Inpatient admissions — tracks bed occupancy and discharge';
COMMENT ON COLUMN admissions.status IS 'LAMA = Left Against Medical Advice';
