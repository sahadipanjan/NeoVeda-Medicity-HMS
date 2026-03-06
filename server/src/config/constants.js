/**
 * Application Constants
 * 
 * Centralized constants for the Hospital Management System.
 * All magic strings and values are defined here.
 */

module.exports = {
    // ---- User Types ----
    USER_TYPES: {
        DOCTOR: 'Doctor',
        STAFF: 'Staff',
        ADMIN: 'Admin',
    },

    // ---- RBAC Roles ----
    ROLES: {
        SUPER_ADMIN: 'Super',
        HOSPITAL_ADMIN: 'Hospital',
        DEPARTMENT_ADMIN: 'Department',
        DOCTOR: 'Doctor',
        NURSE: 'Nurse',
        RECEPTIONIST: 'Receptionist',
        ACCOUNTS_FINANCE: 'Accounts/Finance',
        TECHNICIAN: 'Technician',
        PHARMACIST: 'Pharmacist',
        LAB_TECHNICIAN: 'Lab Technician',
        WARD_BOY: 'Ward Boy',
        OTHER: 'Other',
    },

    // ---- Appointment Statuses ----
    APPOINTMENT_STATUS: {
        SCHEDULED: 'Scheduled',
        CHECKED_IN: 'Checked-In',
        IN_PROGRESS: 'In-Progress',
        COMPLETED: 'Completed',
        CANCELLED: 'Cancelled',
        NO_SHOW: 'No-Show',
    },

    // ---- Appointment Types ----
    APPOINTMENT_TYPES: {
        OPD: 'OPD',
        FOLLOW_UP: 'Follow-Up',
        EMERGENCY: 'Emergency',
        TELECONSULTATION: 'Teleconsultation',
    },

    // ---- Admission Statuses ----
    ADMISSION_STATUS: {
        ACTIVE: 'Active',
        DISCHARGED: 'Discharged',
        TRANSFERRED: 'Transferred',
        LAMA: 'LAMA',
        EXPIRED: 'Expired',
    },

    // ---- Ward Types ----
    WARD_TYPES: {
        GENERAL: 'General',
        SEMI_PRIVATE: 'Semi-Private',
        PRIVATE: 'Private',
        ICU: 'ICU',
        NICU: 'NICU',
        PICU: 'PICU',
        CCU: 'CCU',
        HDU: 'HDU',
        ISOLATION: 'Isolation',
    },

    // ---- Bed Statuses ----
    BED_STATUS: {
        AVAILABLE: 'Available',
        OCCUPIED: 'Occupied',
        MAINTENANCE: 'Maintenance',
        RESERVED: 'Reserved',
    },

    // ---- Payment Statuses ----
    PAYMENT_STATUS: {
        PENDING: 'Pending',
        PARTIAL: 'Partial',
        PAID: 'Paid',
        REFUNDED: 'Refunded',
        WRITTEN_OFF: 'Written-Off',
    },

    // ---- Payment Modes ----
    PAYMENT_MODES: {
        CASH: 'Cash',
        CARD: 'Card',
        UPI: 'UPI',
        NEFT: 'NEFT',
        INSURANCE: 'Insurance',
        MIXED: 'Mixed',
    },

    // ---- Billing Item Types ----
    BILLING_ITEM_TYPES: {
        CONSULTATION: 'Consultation',
        PROCEDURE: 'Procedure',
        LAB_TEST: 'Lab Test',
        RADIOLOGY: 'Radiology',
        PHARMACY: 'Pharmacy',
        WARD_CHARGE: 'Ward Charge',
        SURGERY: 'Surgery',
        OTHER: 'Other',
    },

    // ---- Blood Groups ----
    BLOOD_GROUPS: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],

    // ---- Gender Options ----
    GENDERS: ['Male', 'Female', 'Other'],

    // ---- Department Codes (21 departments) ----
    DEPARTMENT_CODES: [
        'CARD', 'NEUR', 'ONCO', 'ORTH', 'PEDI', 'OBGY', 'GAST',
        'PULM', 'NEPH', 'UROL', 'ENDO', 'OPHT', 'ENTT', 'DERM',
        'PSYC', 'RADI', 'PATH', 'ANES', 'EMER', 'GSUR', 'INTM',
    ],

    // ---- TPA Panel Types ----
    TPA_PANEL_TYPES: {
        CGHS: 'CGHS',
        ECHS: 'ECHS',
        PRIVATE: 'Private',
        PSU: 'PSU',
    },

    // ---- Pre-Auth Statuses ----
    PREAUTH_STATUS: {
        INITIATED: 'Initiated',
        SUBMITTED: 'Submitted',
        QUERY_RAISED: 'Query Raised',
        APPROVED: 'Approved',
        PARTIALLY_APPROVED: 'Partially Approved',
        REJECTED: 'Rejected',
        ENHANCEMENT_REQ: 'Enhancement Requested',
        ENHANCEMENT_APPROVED: 'Enhancement Approved',
        CANCELLED: 'Cancelled',
    },

    // ---- TPA Claim Statuses ----
    CLAIM_STATUS: {
        DRAFT: 'Draft',
        SUBMITTED: 'Submitted',
        UNDER_REVIEW: 'Under Review',
        QUERY_RAISED: 'Query Raised',
        APPROVED: 'Approved',
        PARTIALLY_SETTLED: 'Partially Settled',
        SETTLED: 'Settled',
        REJECTED: 'Rejected',
        APPEALED: 'Appealed',
        CLOSED: 'Closed',
    },

    // ---- Claim Types ----
    CLAIM_TYPES: {
        CASHLESS: 'Cashless',
        REIMBURSEMENT: 'Reimbursement',
    },

    // ---- Policy Relations ----
    POLICY_RELATIONS: ['Self', 'Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Other'],

    // ---- Auth Constants ----
    AUTH: {
        MAX_FAILED_ATTEMPTS: 5,
        LOCKOUT_DURATION_MINUTES: 15,
        PASSWORD_MIN_LENGTH: 8,
        EMPLOYEE_CODE_PREFIX: 'EMP',
    },

    // ---- Pagination Defaults ----
    PAGINATION: {
        DEFAULT_PAGE: 1,
        DEFAULT_LIMIT: 20,
        MAX_LIMIT: 100,
    },
};
