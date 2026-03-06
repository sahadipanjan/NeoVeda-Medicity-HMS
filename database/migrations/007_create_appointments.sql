-- Migration 007: Create appointments table
-- Dependencies: patients, doctors, departments, auth_credentials

CREATE TABLE IF NOT EXISTS appointments (
    id                  SERIAL          PRIMARY KEY,
    appointment_no      VARCHAR(20)     NOT NULL UNIQUE,
    patient_id          INT             NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    doctor_id           INT             NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    department_id       INT             NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    appointment_date    DATE            NOT NULL,
    appointment_time    TIME            NOT NULL,
    duration_minutes    INT             NOT NULL DEFAULT 30,
    status              VARCHAR(20)     NOT NULL DEFAULT 'Scheduled' CHECK (status IN (
                            'Scheduled', 'Checked-In', 'In-Progress',
                            'Completed', 'Cancelled', 'No-Show'
                        )),
    type                VARCHAR(30)     CHECK (type IN (
                            'OPD', 'Follow-Up', 'Emergency', 'Teleconsultation'
                        )),
    notes               TEXT,
    created_by          VARCHAR(20)     REFERENCES auth_credentials(employee_code),
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Composite index for doctor schedule queries
CREATE INDEX idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_status ON appointments(status) WHERE status IN ('Scheduled', 'Checked-In', 'In-Progress');
CREATE INDEX idx_appointments_date ON appointments(appointment_date);

COMMENT ON TABLE appointments IS 'OPD and follow-up appointment scheduling';
COMMENT ON COLUMN appointments.appointment_no IS 'Auto-generated appointment reference number';
