-- Migration 017: Assign HOD doctors to departments
-- Resolve NULL hod_doctor_id by selecting the earliest-joined doctor per department

UPDATE departments d
SET hod_doctor_id = sub.doctor_id
FROM (
    SELECT DISTINCT ON (department_id)
        department_id,
        id AS doctor_id
    FROM doctors
    WHERE is_active = TRUE
    ORDER BY department_id, joined_date ASC NULLS LAST, id ASC
) sub
WHERE d.id = sub.department_id
  AND d.hod_doctor_id IS NULL;

COMMENT ON COLUMN departments.hod_doctor_id IS 'Head of Department — auto-assigned to earliest-joined active doctor';
