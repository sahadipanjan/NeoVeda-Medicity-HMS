/**
 * API Service Layer
 * 
 * Centralized HTTP client for all backend API calls.
 * Handles auth token refresh, error formatting, and request/response normalization.
 */

const API_BASE = '/api';

async function request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;

    const config = {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        credentials: 'include', // Send cookies
        ...options,
    };

    if (options.body && typeof options.body === 'object') {
        config.body = JSON.stringify(options.body);
    }

    let response = await fetch(url, config);

    // If 401, attempt token refresh
    if (response.status === 401 && !endpoint.includes('/auth/')) {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
        });

        if (refreshRes.ok) {
            response = await fetch(url, config);
        } else {
            window.location.href = '/login';
            throw new Error('Session expired');
        }
    }

    const data = await response.json();

    if (!response.ok) {
        throw { status: response.status, message: data.message || 'Request failed', errors: data.errors };
    }

    return data;
}

// ---- Auth ----
export const authAPI = {
    login: (employee_code, password) =>
        request('/auth/login', { method: 'POST', body: { employee_code, password } }),
    logout: () =>
        request('/auth/logout', { method: 'POST' }),
    refresh: () =>
        request('/auth/refresh', { method: 'POST' }),
    changePassword: (current_password, new_password) =>
        request('/auth/change-password', { method: 'POST', body: { current_password, new_password } }),
};

// ---- Patients ----
export const patientsAPI = {
    list: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/patients?${qs}`);
    },
    get: (id) => request(`/patients/${id}`),
    create: (data) => request('/patients', { method: 'POST', body: data }),
    update: (id, data) => request(`/patients/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/patients/${id}`, { method: 'DELETE' }),
};

// ---- Doctors ----
export const doctorsAPI = {
    list: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/doctors?${qs}`);
    },
    get: (id) => request(`/doctors/${id}`),
    create: (data) => request('/doctors', { method: 'POST', body: data }),
    update: (id, data) => request(`/doctors/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/doctors/${id}`, { method: 'DELETE' }),
};

// ---- Appointments ----
export const appointmentsAPI = {
    list: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/appointments?${qs}`);
    },
    get: (id) => request(`/appointments/${id}`),
    create: (data) => request('/appointments', { method: 'POST', body: data }),
    updateStatus: (id, status) =>
        request(`/appointments/${id}/status`, { method: 'PATCH', body: { status } }),
};

// ---- Wards ----
export const wardsAPI = {
    list: () => request('/wards'),
    get: (id) => request(`/wards/${id}`),
    create: (data) => request('/wards', { method: 'POST', body: data }),
    addBeds: (wardId, count) => request(`/wards/${wardId}/beds`, { method: 'POST', body: { count } }),
    admit: (data) => request('/wards/admissions', { method: 'POST', body: data }),
    discharge: (id, discharge_summary) =>
        request(`/wards/admissions/${id}/discharge`, { method: 'PATCH', body: { discharge_summary } }),
};

// ---- Billing ----
export const billingAPI = {
    list: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/billing?${qs}`);
    },
    get: (id) => request(`/billing/${id}`),
    create: (data) => request('/billing', { method: 'POST', body: data }),
    recordPayment: (id, payment_status, payment_mode) =>
        request(`/billing/${id}/payment`, { method: 'PATCH', body: { payment_status, payment_mode } }),
};

// ---- Doctor Dashboard & EMR ----
export const doctorAPI = {
    dashboard: () => request('/doctor/dashboard'),
    patientRecords: (patientId) => request(`/doctor/patients/${patientId}/records`),
    createRecord: (data) => request('/doctor/records', { method: 'POST', body: data }),
    updateRecord: (id, data) => request(`/doctor/records/${id}`, { method: 'PUT', body: data }),
};

// ---- Admin ----
export const adminAPI = {
    dashboard: () => request('/admin/dashboard'),
    departments: () => request('/admin/departments'),
    departmentStats: (departmentId) => request(`/admin/department-stats?department_id=${departmentId}`),
    auditLogs: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/admin/audit-logs?${qs}`);
    },
    createStaff: (data) => request('/admin/staff', { method: 'POST', body: data }),
    createAdmin: (data) => request('/admin/admins', { method: 'POST', body: data }),
};

// ---- TPA / Insurance ----
export const tpaAPI = {
    // Vendors
    vendors: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/tpa/vendors?${qs}`);
    },
    getVendor: (id) => request(`/tpa/vendors/${id}`),
    createVendor: (data) => request('/tpa/vendors', { method: 'POST', body: data }),
    updateVendor: (id, data) => request(`/tpa/vendors/${id}`, { method: 'PUT', body: data }),

    // Insurance Policies
    policies: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/tpa/policies?${qs}`);
    },
    getPolicy: (id) => request(`/tpa/policies/${id}`),
    createPolicy: (data) => request('/tpa/policies', { method: 'POST', body: data }),
    updatePolicy: (id, data) => request(`/tpa/policies/${id}`, { method: 'PUT', body: data }),

    // Pre-Authorization
    preauthList: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/tpa/preauth?${qs}`);
    },
    getPreauth: (id) => request(`/tpa/preauth/${id}`),
    createPreauth: (data) => request('/tpa/preauth', { method: 'POST', body: data }),
    updatePreauthStatus: (id, data) =>
        request(`/tpa/preauth/${id}/status`, { method: 'PATCH', body: data }),

    // Claims
    claims: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/tpa/claims?${qs}`);
    },
    getClaim: (id) => request(`/tpa/claims/${id}`),
    createClaim: (data) => request('/tpa/claims', { method: 'POST', body: data }),
    updateClaimStatus: (id, data) =>
        request(`/tpa/claims/${id}/status`, { method: 'PATCH', body: data }),
    settleClaim: (id, data) =>
        request(`/tpa/claims/${id}/settle`, { method: 'PATCH', body: data }),

    // Tariffs
    tariffs: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/tpa/tariffs?${qs}`);
    },
    createTariff: (data) => request('/tpa/tariffs', { method: 'POST', body: data }),
    updateTariff: (id, data) => request(`/tpa/tariffs/${id}`, { method: 'PUT', body: data }),
    applyTariff: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/tpa/tariffs/apply?${qs}`);
    },
};
