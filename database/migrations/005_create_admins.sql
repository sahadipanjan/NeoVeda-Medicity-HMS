-- Migration 005: Create admins table
-- Dependencies: departments

CREATE TABLE IF NOT EXISTS admins (
    id              SERIAL          PRIMARY KEY,
    employee_code   VARCHAR(20)     NOT NULL UNIQUE,
    first_name      VARCHAR(100)    NOT NULL,
    last_name       VARCHAR(100)    NOT NULL,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    phone           VARCHAR(15),
    access_level    VARCHAR(20)     NOT NULL CHECK (access_level IN ('Super', 'Hospital', 'Department')),
    department_id   INT             REFERENCES departments(id) ON DELETE SET NULL,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_admins_employee_code ON admins(employee_code);
CREATE INDEX idx_admins_access_level ON admins(access_level);

COMMENT ON TABLE admins IS 'Administrative users with tiered access levels';
COMMENT ON COLUMN admins.access_level IS 'Super = full system, Hospital = all departments, Department = single department';
