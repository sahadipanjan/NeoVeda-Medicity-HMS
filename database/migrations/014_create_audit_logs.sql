-- Migration 014: Create audit_logs table
-- Dependencies: None (standalone, references employee_code as VARCHAR)

CREATE TABLE IF NOT EXISTS audit_logs (
    id              BIGSERIAL       PRIMARY KEY,
    employee_code   VARCHAR(20)     NOT NULL,
    action          VARCHAR(50)     NOT NULL,
    entity_type     VARCHAR(50),
    entity_id       INT,
    old_values      JSONB,
    new_values      JSONB,
    ip_address      VARCHAR(45),    -- IPv6 max length
    user_agent      TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes for compliance and auditing queries
CREATE INDEX idx_audit_employee_date ON audit_logs(employee_code, created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_date ON audit_logs(created_at);

-- Partitioning hint (for future scale — not executed yet)
-- PARTITION BY RANGE (created_at);

COMMENT ON TABLE audit_logs IS 'Immutable audit trail — every data mutation and auth event is logged';
COMMENT ON COLUMN audit_logs.old_values IS 'JSONB snapshot of entity state before mutation';
COMMENT ON COLUMN audit_logs.new_values IS 'JSONB snapshot of entity state after mutation';
