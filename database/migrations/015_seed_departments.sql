-- Migration 015: Seed 21 departments + create updated_at trigger function
-- Dependencies: departments table (001)

-- ============================================================
-- 1. Auto-update trigger for updated_at columns
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN
        SELECT unnest(ARRAY[
            'departments', 'patients', 'doctors', 'staff', 'admins',
            'auth_credentials', 'appointments', 'medical_records',
            'wards', 'beds', 'admissions', 'billing'
        ])
    LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_%s_updated_at
             BEFORE UPDATE ON %I
             FOR EACH ROW
             EXECUTE FUNCTION update_updated_at_column()',
            tbl, tbl
        );
    END LOOP;
END;
$$;

-- ============================================================
-- 2. Seed 21 clinical departments
-- ============================================================

INSERT INTO departments (name, code, floor, phone_ext) VALUES
    ('Cardiology',                  'CARD',  'Floor 3',  '3001'),
    ('Neurology',                   'NEUR',  'Floor 3',  '3002'),
    ('Oncology',                    'ONCO',  'Floor 4',  '4001'),
    ('Orthopedics',                 'ORTH',  'Floor 2',  '2001'),
    ('Pediatrics',                  'PEDI',  'Floor 1',  '1001'),
    ('Obstetrics and Gynecology',   'OBGY',  'Floor 1',  '1002'),
    ('Gastroenterology',            'GAST',  'Floor 4',  '4002'),
    ('Pulmonology',                 'PULM',  'Floor 3',  '3003'),
    ('Nephrology',                  'NEPH',  'Floor 4',  '4003'),
    ('Urology',                     'UROL',  'Floor 2',  '2002'),
    ('Endocrinology',               'ENDO',  'Floor 5',  '5001'),
    ('Ophthalmology',               'OPHT',  'Floor 1',  '1003'),
    ('ENT',                         'ENTT',  'Floor 1',  '1004'),
    ('Dermatology',                 'DERM',  'Floor 5',  '5002'),
    ('Psychiatry',                  'PSYC',  'Floor 5',  '5003'),
    ('Radiology',                   'RADI',  'Ground',   '0001'),
    ('Pathology',                   'PATH',  'Ground',   '0002'),
    ('Anesthesiology',              'ANES',  'Floor 2',  '2003'),
    ('Emergency Medicine',          'EMER',  'Ground',   '0003'),
    ('General Surgery',             'GSUR',  'Floor 2',  '2004'),
    ('Internal Medicine',           'INTM',  'Floor 3',  '3004')
ON CONFLICT (code) DO NOTHING;

COMMENT ON FUNCTION update_updated_at_column IS 'Auto-updates updated_at timestamp on row modification';
