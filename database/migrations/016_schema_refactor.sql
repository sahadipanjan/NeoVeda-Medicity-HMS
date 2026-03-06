-- Migration 016: Schema Refactoring
-- Add supplementary demographic fields to all personnel tables

-- ─── Doctors: add blood_group and assigned_shift ───
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS blood_group VARCHAR(5);
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS assigned_shift VARCHAR(50);

-- ─── Staff: add blood_group, qualifications, specialization, mci_registration ───
ALTER TABLE staff ADD COLUMN IF NOT EXISTS blood_group VARCHAR(5);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS qualifications VARCHAR(300);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS specialization VARCHAR(200);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS mci_registration VARCHAR(50);

-- ─── Admins: add blood_group, assigned_shift, qualifications, specialization, mci_registration ───
ALTER TABLE admins ADD COLUMN IF NOT EXISTS blood_group VARCHAR(5);
ALTER TABLE admins ADD COLUMN IF NOT EXISTS assigned_shift VARCHAR(50);
ALTER TABLE admins ADD COLUMN IF NOT EXISTS qualifications VARCHAR(300);
ALTER TABLE admins ADD COLUMN IF NOT EXISTS specialization VARCHAR(200);
ALTER TABLE admins ADD COLUMN IF NOT EXISTS mci_registration VARCHAR(50);

COMMENT ON COLUMN doctors.blood_group IS 'Blood group: A+, A-, B+, B-, AB+, AB-, O+, O-';
COMMENT ON COLUMN doctors.assigned_shift IS 'Work shift: Morning, Afternoon, General, etc.';
COMMENT ON COLUMN staff.qualifications IS 'Educational qualifications';
COMMENT ON COLUMN staff.specialization IS 'Area of specialization';
