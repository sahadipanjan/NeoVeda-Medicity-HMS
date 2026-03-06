-- Migration 021: Create tariff_master table
-- Dependencies: tpa_vendors

CREATE TABLE IF NOT EXISTS tariff_master (
    id                  SERIAL          PRIMARY KEY,
    tariff_code         VARCHAR(30)     NOT NULL,
    panel_type          VARCHAR(30)     NOT NULL CHECK (panel_type IN ('CGHS', 'ECHS', 'Private', 'Hospital')),
    tpa_vendor_id       INT             REFERENCES tpa_vendors(id) ON DELETE SET NULL,
    item_type           VARCHAR(30)     NOT NULL CHECK (item_type IN (
                            'Consultation', 'Procedure', 'Lab Test', 'Radiology',
                            'Pharmacy', 'Ward Charge', 'Surgery', 'Other'
                        )),
    procedure_name      VARCHAR(300)    NOT NULL,
    procedure_code      VARCHAR(30),                     -- CGHS procedure code if applicable
    nabh_rate           DECIMAL(10,2),                   -- NABH-accredited hospital rate
    non_nabh_rate       DECIMAL(10,2),                   -- Non-NABH rate
    hospital_rate       DECIMAL(10,2),                   -- Hospital's own rate
    effective_from      DATE            NOT NULL DEFAULT CURRENT_DATE,
    effective_to        DATE,                            -- NULL = currently active
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_tariff_panel_eff UNIQUE (tariff_code, panel_type, effective_from)
);

-- Indexes
CREATE INDEX idx_tariff_panel ON tariff_master(panel_type);
CREATE INDEX idx_tariff_item_type ON tariff_master(item_type);
CREATE INDEX idx_tariff_vendor ON tariff_master(tpa_vendor_id) WHERE tpa_vendor_id IS NOT NULL;
CREATE INDEX idx_tariff_active ON tariff_master(is_active, effective_from, effective_to);
CREATE INDEX idx_tariff_code ON tariff_master(tariff_code);

COMMENT ON TABLE tariff_master IS 'Centralized tariff schedules — CGHS rates, ECHS rates, private panel rates, and hospital rates';
COMMENT ON COLUMN tariff_master.nabh_rate IS 'Rate for NABH-accredited hospitals — typically higher than non-NABH';
COMMENT ON COLUMN tariff_master.non_nabh_rate IS 'Rate for non-NABH hospitals';
COMMENT ON COLUMN tariff_master.hospital_rate IS 'Hospital actual rate — may differ from panel-approved rates';
COMMENT ON COLUMN tariff_master.effective_to IS 'NULL means tariff is currently active';
