-- Migration 001: Create departments table
-- Dependencies: None (root entity)

CREATE TABLE IF NOT EXISTS departments (
    id              SERIAL          PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL UNIQUE,
    code            VARCHAR(10)     NOT NULL UNIQUE,
    hod_doctor_id   INT,            -- FK added after doctors table exists
    floor           VARCHAR(20),
    phone_ext       VARCHAR(10),
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Index for active department lookups
CREATE INDEX idx_departments_active ON departments(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE departments IS 'Hospital clinical and administrative departments';
COMMENT ON COLUMN departments.code IS 'Short unique department code, e.g. CARD, NEUR';
COMMENT ON COLUMN departments.hod_doctor_id IS 'FK to doctors(id) — added via ALTER after doctors table creation';
