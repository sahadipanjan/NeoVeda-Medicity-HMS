-- Migration 013: Create billing_items table
-- Dependencies: billing

CREATE TABLE IF NOT EXISTS billing_items (
    id              SERIAL          PRIMARY KEY,
    billing_id      INT             NOT NULL REFERENCES billing(id) ON DELETE CASCADE,
    item_type       VARCHAR(30)     NOT NULL CHECK (item_type IN (
                        'Consultation', 'Procedure', 'Lab Test', 'Radiology',
                        'Pharmacy', 'Ward Charge', 'Surgery', 'Other'
                    )),
    description     VARCHAR(255)    NOT NULL,
    quantity        INT             NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price      DECIMAL(10,2)   NOT NULL CHECK (unit_price >= 0),
    total_price     DECIMAL(10,2)   NOT NULL CHECK (total_price >= 0),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_billing_items_billing ON billing_items(billing_id);

COMMENT ON TABLE billing_items IS 'Line items for each invoice — separated for 3NF compliance';
COMMENT ON COLUMN billing_items.total_price IS 'Computed as quantity * unit_price at application layer';
