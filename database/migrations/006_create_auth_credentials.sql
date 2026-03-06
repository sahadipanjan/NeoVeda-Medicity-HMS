-- Migration 006: Create auth_credentials table
-- Dependencies: doctors, staff, admins (polymorphic reference)

CREATE TABLE IF NOT EXISTS auth_credentials (
    id                      SERIAL          PRIMARY KEY,
    employee_code           VARCHAR(20)     NOT NULL UNIQUE,
    password_hash           VARCHAR(255)    NOT NULL,
    salt                    VARCHAR(64)     NOT NULL,
    user_type               VARCHAR(20)     NOT NULL CHECK (user_type IN ('Doctor', 'Staff', 'Admin')),
    user_ref_id             INT             NOT NULL,
    last_login              TIMESTAMPTZ,
    failed_attempts         INT             NOT NULL DEFAULT 0,
    locked_until            TIMESTAMPTZ,
    password_changed_at     TIMESTAMPTZ,
    must_change_password    BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_auth_employee_code ON auth_credentials(employee_code);
CREATE INDEX idx_auth_user_type_ref ON auth_credentials(user_type, user_ref_id);
CREATE INDEX idx_auth_locked ON auth_credentials(locked_until) WHERE locked_until IS NOT NULL;

COMMENT ON TABLE auth_credentials IS 'Authentication table — Employee Code + Password login only';
COMMENT ON COLUMN auth_credentials.user_ref_id IS 'Polymorphic FK: references doctors(id), staff(id), or admins(id) based on user_type';
COMMENT ON COLUMN auth_credentials.password_hash IS 'bcrypt or argon2id hashed password';
COMMENT ON COLUMN auth_credentials.failed_attempts IS 'Counter for rate-limiting — locks after 5 failures';
