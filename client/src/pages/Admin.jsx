import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../services/api';

export default function Admin() {
    const [tab, setTab] = useState('dashboard');
    const [stats, setStats] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [auditPage, setAuditPage] = useState(1);
    const [auditPagination, setAuditPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    // Staff registration form
    const [showStaffReg, setShowStaffReg] = useState(false);
    const [staffForm, setStaffForm] = useState({
        first_name: '', last_name: '', role: 'Nurse', department_id: '', phone: '', email: '', shift: 'Morning', password: ''
    });
    const [saving, setSaving] = useState(false);

    // Password change is now at /change-password (standalone page for all users)

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const [statsRes, deptRes] = await Promise.all([adminAPI.dashboard(), adminAPI.departments()]);
            setStats(statsRes.data);
            setDepartments(deptRes.data);
        } catch { } finally { setLoading(false); }
    };

    const loadAuditLogs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminAPI.auditLogs({ page: auditPage, limit: 20 });
            setAuditLogs(res.data);
            setAuditPagination(res.pagination);
        } catch { } finally { setLoading(false); }
    }, [auditPage]);

    useEffect(() => { loadDashboard(); }, []);
    useEffect(() => { if (tab === 'audit') loadAuditLogs(); }, [tab, loadAuditLogs]);

    const handleStaffReg = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            const res = await adminAPI.createStaff(staffForm);
            showToast(`Staff registered: ${res.data?.employee_code}`);
            setShowStaffReg(false);
        } catch (err) { showToast(err.message, 'error'); }
        finally { setSaving(false); }
    };

    const tabs = [
        { key: 'dashboard', icon: '📊', label: 'Overview' },
        { key: 'departments', icon: '🏥', label: 'Departments' },
        { key: 'audit', icon: '📋', label: 'Audit Logs' },
        { key: 'register', icon: '👤', label: 'Register Staff' },
    ];

    return (
        <div className="fade-in">
            {toast && <div className="toast-container"><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}

            <div className="page-header">
                <div><h1>⚙️ Admin Panel</h1><p className="page-subtitle">System administration & configuration</p></div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid var(--border-color)', paddingBottom: 4 }}>
                {tabs.map(t => (
                    <button key={t.key} className={`btn ${tab === t.key ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ borderRadius: '8px 8px 0 0' }} onClick={() => setTab(t.key)}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* Dashboard Tab */}
            {tab === 'dashboard' && (
                loading ? <div className="loading-spinner"><div className="spinner"></div></div> : stats && (
                    <div>
                        <div className="stats-grid">
                            <div className="stat-card blue"><div className="stat-value">{stats.patients?.total || 0}</div><div className="stat-label">Patients</div></div>
                            <div className="stat-card purple"><div className="stat-value">{stats.doctors?.total || 0}</div><div className="stat-label">Doctors</div></div>
                            <div className="stat-card green"><div className="stat-value">{stats.staff?.total || 0}</div><div className="stat-label">Staff</div></div>
                            <div className="stat-card amber"><div className="stat-value">{stats.appointments?.today || 0}</div><div className="stat-label">Today's Appointments</div></div>
                        </div>
                    </div>
                )
            )}

            {/* Departments Tab */}
            {tab === 'departments' && (
                <div className="table-container">
                    <table>
                        <thead><tr><th>Code</th><th>Department</th><th>Description</th></tr></thead>
                        <tbody>
                            {departments.map(d => (
                                <tr key={d.id}>
                                    <td><span className="badge badge-primary">{d.code}</span></td>
                                    <td style={{ fontWeight: 600 }}>{d.name}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{d.description || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Audit Logs Tab */}
            {tab === 'audit' && (
                loading ? <div className="loading-spinner"><div className="spinner"></div></div> : (
                    <>
                        <div className="table-container">
                            <table>
                                <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Table</th><th>Record ID</th></tr></thead>
                                <tbody>
                                    {auditLogs.length === 0 ? (
                                        <tr><td colSpan="5"><div className="empty-state"><p>No audit logs found</p></div></td></tr>
                                    ) : auditLogs.map(log => (
                                        <tr key={log.id}>
                                            <td style={{ fontSize: '0.8rem' }}>{new Date(log.created_at).toLocaleString('en-IN')}</td>
                                            <td>{log.employee_code || 'System'}</td>
                                            <td><span className={`badge ${log.action?.includes('CREATE') ? 'badge-success' : log.action?.includes('UPDATE') ? 'badge-warning' : 'badge-danger'}`}>{log.action}</span></td>
                                            <td>{log.entity_type}</td>
                                            <td>{log.entity_id}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {auditPagination?.totalPages > 1 && (
                            <div className="pagination">
                                <button disabled={!auditPagination.hasPrevPage} onClick={() => setAuditPage(p => p - 1)}>← Prev</button>
                                <span className="pagination-info">Page {auditPage} of {auditPagination.totalPages}</span>
                                <button disabled={!auditPagination.hasNextPage} onClick={() => setAuditPage(p => p + 1)}>Next →</button>
                            </div>
                        )}
                    </>
                )
            )}

            {/* Register Staff Tab */}
            {tab === 'register' && (
                <div style={{ maxWidth: 600 }}>
                    <div className="card">
                        <h3 style={{ marginBottom: 20 }}>👤 Register New Staff Member</h3>
                        <form onSubmit={handleStaffReg}>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">First Name *</label>
                                    <input className="form-input" required value={staffForm.first_name} onChange={e => setStaffForm({ ...staffForm, first_name: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Last Name *</label>
                                    <input className="form-input" required value={staffForm.last_name} onChange={e => setStaffForm({ ...staffForm, last_name: e.target.value })} /></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">Role *</label>
                                    <select className="form-select" value={staffForm.role} onChange={e => setStaffForm({ ...staffForm, role: e.target.value })}>
                                        {['Nurse', 'Ward Boy', 'Receptionist', 'Technician', 'Lab Technician', 'Pharmacist'].map(r => <option key={r}>{r}</option>)}
                                    </select></div>
                                <div className="form-group"><label className="form-label">Department *</label>
                                    <select className="form-select" required value={staffForm.department_id} onChange={e => setStaffForm({ ...staffForm, department_id: e.target.value })}>
                                        <option value="">Select</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">Phone</label>
                                    <input className="form-input" value={staffForm.phone} onChange={e => setStaffForm({ ...staffForm, phone: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Email</label>
                                    <input className="form-input" type="email" value={staffForm.email} onChange={e => setStaffForm({ ...staffForm, email: e.target.value })} /></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">Shift</label>
                                    <select className="form-select" value={staffForm.shift} onChange={e => setStaffForm({ ...staffForm, shift: e.target.value })}>
                                        {['Morning', 'Afternoon', 'Night', 'Rotational'].map(s => <option key={s}>{s}</option>)}
                                    </select></div>
                                <div className="form-group"><label className="form-label">Initial Password *</label>
                                    <input className="form-input" type="password" required value={staffForm.password} onChange={e => setStaffForm({ ...staffForm, password: e.target.value })} /></div>
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: 12 }}>
                                {saving ? 'Registering...' : '✅ Register & Generate Employee Code'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
