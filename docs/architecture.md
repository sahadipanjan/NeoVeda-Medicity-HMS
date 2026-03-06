# Hospital Management System — Architecture Reference

> Full architectural documentation, 3NF schema, auth design, and execution graph
> are maintained in the implementation plan artifact.
>
> This file serves as the in-repo anchor pointing to the live plan.

## Quick Reference

- **Database**: Neon PostgreSQL (14 tables, 3NF normalized)
- **Auth**: Employee Code + Password (bcrypt, JWT, RBAC)
- **Frontend**: React SPA (designs via Stitch + Pencil MCP)
- **Backend**: Node.js + Express API
- **Departments**: 21 clinical departments

## Entities

| Entity | Table(s) | Key Fields |
|---|---|---|
| Departments | `departments` | code, name, hod_doctor_id |
| Patients | `patients` | uhid, aadhaar_number |
| Doctors | `doctors` | employee_code, department_id |
| Staff | `staff` | employee_code, role, department_id |
| Admins | `admins` | employee_code, access_level |
| Auth | `auth_credentials` | employee_code, password_hash |
| Appointments | `appointments` | appointment_no, patient_id, doctor_id |
| Medical Records | `medical_records` | record_no, patient_id, doctor_id |
| Wards | `wards` + `beds` | ward_code, bed_number |
| Admissions | `admissions` | admission_no, patient_id, bed_id |
| Billing | `billing` + `billing_items` | invoice_no, patient_id |
| Audit | `audit_logs` | employee_code, action |

## Employee Code Format

```
EMP-{DEPT_CODE}-{SEQUENCE}
Example: EMP-CARD-00001
```
