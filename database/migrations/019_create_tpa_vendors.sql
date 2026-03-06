-- Migration 019: Create TPA vendors master table
-- Dependencies: None

CREATE TABLE IF NOT EXISTS tpa_vendors (
    id                  SERIAL          PRIMARY KEY,
    vendor_code         VARCHAR(20)     NOT NULL UNIQUE,
    name                VARCHAR(200)    NOT NULL,
    panel_type          VARCHAR(30)     NOT NULL CHECK (panel_type IN ('CGHS', 'ECHS', 'Private', 'PSU')),
    contact_person      VARCHAR(200),
    phone               VARCHAR(15),
    email               VARCHAR(255),
    address             TEXT,
    gst_number          VARCHAR(20),
    empanelment_date    DATE,
    expiry_date         DATE,
    settlement_tat_days INT             DEFAULT 30,       -- Expected settlement turnaround
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tpa_vendors_panel ON tpa_vendors(panel_type);
CREATE INDEX idx_tpa_vendors_active ON tpa_vendors(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_tpa_vendors_code ON tpa_vendors(vendor_code);

COMMENT ON TABLE tpa_vendors IS 'Master registry of Third-Party Administrator companies and insurance panels';
COMMENT ON COLUMN tpa_vendors.panel_type IS 'CGHS=Central Govt Health Scheme, ECHS=Ex-Servicemen, PSU=Public Sector Undertaking';
COMMENT ON COLUMN tpa_vendors.settlement_tat_days IS 'Expected number of days for claim settlement';
