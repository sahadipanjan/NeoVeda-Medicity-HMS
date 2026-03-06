-- Migration 004: Create staff table
-- Dependencies: departments

CREATE TABLE IF NOT EXISTS staff (
    id              SERIAL          PRIMARY KEY,
    employee_code   VARCHAR(20)     NOT NULL UNIQUE,
    first_name      VARCHAR(100)    NOT NULL,
    last_name       VARCHAR(100)    NOT NULL,
    role            VARCHAR(50)     NOT NULL CHECK (role IN (
                        'Nurse', 'Technician', 'Receptionist', 'Pharmacist',
                        'Lab Technician', 'Ward Boy', 'Other'
                    )),
    department_id   INT             REFERENCES departments(id) ON DELETE SET NULL,
    phone           VARCHAR(15),
    email           VARCHAR(255)    UNIQUE,
    shift           VARCHAR(20)     CHECK (shift IN ('Morning', 'Afternoon', 'Night', 'Rotational')),
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    joined_date     DATE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_staff_department ON staff(department_id);
CREATE INDEX idx_staff_role ON staff(role);
CREATE INDEX idx_staff_employee_code ON staff(employee_code);
CREATE INDEX idx_staff_active ON staff(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE staff IS 'Non-doctor hospital staff: nurses, technicians, receptionists, etc.';
COMMENT ON COLUMN staff.employee_code IS 'Format: EMP-{DEPT_CODE}-{SEQUENCE}';
