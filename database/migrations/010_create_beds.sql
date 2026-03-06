-- Migration 010: Create beds table
-- Dependencies: wards

CREATE TABLE IF NOT EXISTS beds (
    id              SERIAL          PRIMARY KEY,
    bed_number      VARCHAR(10)     NOT NULL,
    ward_id         INT             NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
    status          VARCHAR(20)     NOT NULL DEFAULT 'Available' CHECK (status IN (
                        'Available', 'Occupied', 'Maintenance', 'Reserved'
                    )),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- Unique bed number within each ward
    CONSTRAINT uq_bed_ward UNIQUE (ward_id, bed_number)
);

-- Indexes
CREATE INDEX idx_beds_ward ON beds(ward_id);
CREATE INDEX idx_beds_status ON beds(status) WHERE status = 'Available';

COMMENT ON TABLE beds IS 'Individual beds within wards — unique per ward';
COMMENT ON COLUMN beds.bed_number IS 'Formatted as ward-relative number, e.g. 01, 02, 03';
