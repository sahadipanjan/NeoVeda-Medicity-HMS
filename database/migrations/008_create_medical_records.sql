-- Migration 008: Create medical_records table
-- Dependencies: patients, doctors, appointments

CREATE TABLE IF NOT EXISTS medical_records (
    id              SERIAL          PRIMARY KEY,
    record_no       VARCHAR(20)     NOT NULL UNIQUE,
    patient_id      INT             NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    doctor_id       INT             NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    appointment_id  INT             REFERENCES appointments(id) ON DELETE SET NULL,
    diagnosis       TEXT,
    symptoms        TEXT,
    prescription    TEXT,
    lab_results     JSONB,          -- Flexible lab result storage
    vitals          JSONB,          -- e.g. {"bp":"120/80","pulse":72,"temp":98.6,"spo2":98,"weight":70}
    follow_up_date  DATE,
    notes           TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_records_patient ON medical_records(patient_id);
CREATE INDEX idx_records_doctor ON medical_records(doctor_id);
CREATE INDEX idx_records_patient_date ON medical_records(patient_id, created_at DESC);

-- GIN index for JSONB queries on lab_results
CREATE INDEX idx_records_lab_results ON medical_records USING GIN (lab_results);

COMMENT ON TABLE medical_records IS 'Clinical records: diagnosis, prescriptions, vitals, and lab results';
COMMENT ON COLUMN medical_records.vitals IS 'JSON: bp, pulse, temperature, spo2, weight, height';
COMMENT ON COLUMN medical_records.lab_results IS 'JSON: flexible lab test results with test names and values';
