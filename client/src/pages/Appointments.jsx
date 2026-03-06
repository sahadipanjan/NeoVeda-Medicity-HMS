import React, { useState, useEffect, useCallback } from 'react';
import { appointmentsAPI, doctorsAPI, patientsAPI, adminAPI } from '../services/api';

const STATUS_BADGES = {
    'Scheduled': 'badge-info', 'Checked-In': 'badge-primary', 'In-Progress': 'badge-warning',
    'Completed': 'badge-success', 'Cancelled': 'badge-danger', 'No-Show': 'badge-danger',
};

export default function Appointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});
    const [filterStatus, setFilterStatus] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: 15 };
            if (filterStatus) params.status = filterStatus;
            const res = await appointmentsAPI.list(params);
            setAppointments(res.data);
            setPagination(res.pagination);
        } catch { } finally { setLoading(false); }
    }, [page, filterStatus]);

    useEffect(() => { load(); adminAPI.departments().then(r => setDepartments(r.data)).catch(() => { }); }, [load]);

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

    const openCreate = () => {
        setForm({ patient_id: '', doctor_id: '', department_id: '', appointment_date: '', appointment_time: '', type: 'OPD', notes: '' });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            await appointmentsAPI.create(form);
            showToast('Appointment scheduled');
            setShowModal(false); load();
        } catch (err) { showToast(err.message, 'error'); }
        finally { setSaving(false); }
    };

    const updateStatus = async (id, status) => {
        try { await appointmentsAPI.updateStatus(id, status); showToast(`Status → ${status}`); load(); }
        catch (err) { showToast(err.message, 'error'); }
    };

    return (
        <div className="fade-in">
            {toast && <div className="toast-container"><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}

            <div className="page-header">
                <div><h1>📅 Appointments</h1><p className="page-subtitle">Schedule & manage appointments</p></div>
                <button className="btn btn-primary" onClick={openCreate}>➕ New Appointment</button>
            </div>

            <div className="search-bar">
                <select className="form-select" style={{ maxWidth: 200 }} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
                    <option value="">All Statuses</option>
                    {['Scheduled', 'Checked-In', 'In-Progress', 'Completed', 'Cancelled', 'No-Show'].map(s => <option key={s}>{s}</option>)}
                </select>
                <button className="btn btn-ghost" onClick={load}>🔄 Refresh</button>
            </div>

            {loading ? <div className="loading-spinner"><div className="spinner"></div></div> : (
                <>
                    <div className="table-container">
                        <table>
                            <thead><tr>
                                <th>Apt #</th><th>Patient</th><th>Doctor</th><th>Department</th><th>Date</th><th>Time</th><th>Status</th><th>Actions</th>
                            </tr></thead>
                            <tbody>
                                {appointments.length === 0 ? (
                                    <tr><td colSpan="8"><div className="empty-state"><p>No appointments found</p></div></td></tr>
                                ) : appointments.map(a => (
                                    <tr key={a.id}>
                                        <td style={{ fontWeight: 600, fontSize: '0.8rem' }}>{a.appointment_no}</td>
                                        <td>{a.patient_first_name} {a.patient_last_name}<br /><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.uhid}</span></td>
                                        <td>Dr. {a.doctor_first_name} {a.doctor_last_name}</td>
                                        <td><span className="badge badge-info">{a.department_name}</span></td>
                                        <td>{new Date(a.appointment_date).toLocaleDateString('en-IN')}</td>
                                        <td>{a.appointment_time?.slice(0, 5)}</td>
                                        <td><span className={`badge ${STATUS_BADGES[a.status] || 'badge-info'}`}>{a.status}</span></td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                {a.status === 'Scheduled' && <>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => updateStatus(a.id, 'Checked-In')}>✅ Check-In</button>
                                                    <button className="btn btn-danger btn-sm" onClick={() => updateStatus(a.id, 'Cancelled')}>❌</button>
                                                </>}
                                                {a.status === 'Checked-In' && <button className="btn btn-ghost btn-sm" onClick={() => updateStatus(a.id, 'In-Progress')}>▶️ Start</button>}
                                                {a.status === 'In-Progress' && <button className="btn btn-success btn-sm" onClick={() => updateStatus(a.id, 'Completed')}>✅ Complete</button>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {pagination?.totalPages > 1 && (
                        <div className="pagination">
                            <button disabled={!pagination.hasPrevPage} onClick={() => setPage(p => p - 1)}>← Prev</button>
                            <span className="pagination-info">Page {page} of {pagination.totalPages}</span>
                            <button disabled={!pagination.hasNextPage} onClick={() => setPage(p => p + 1)}>Next →</button>
                        </div>
                    )}
                </>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal slide-up" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>➕ New Appointment</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">Patient ID *</label>
                                    <input className="form-input" type="number" required value={form.patient_id} onChange={e => setForm({ ...form, patient_id: e.target.value })} placeholder="Enter Patient ID" /></div>
                                <div className="form-group"><label className="form-label">Doctor ID *</label>
                                    <input className="form-input" type="number" required value={form.doctor_id} onChange={e => setForm({ ...form, doctor_id: e.target.value })} placeholder="Enter Doctor ID" /></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">Department *</label>
                                    <select className="form-select" required value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}>
                                        <option value="">Select</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select></div>
                                <div className="form-group"><label className="form-label">Type</label>
                                    <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                        <option>OPD</option><option>Follow-Up</option><option>Emergency</option><option>Teleconsultation</option>
                                    </select></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">Date *</label>
                                    <input className="form-input" type="date" required value={form.appointment_date} onChange={e => setForm({ ...form, appointment_date: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Time *</label>
                                    <input className="form-input" type="time" required value={form.appointment_time} onChange={e => setForm({ ...form, appointment_time: e.target.value })} /></div>
                            </div>
                            <div className="form-group"><label className="form-label">Notes</label>
                                <textarea className="form-textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Scheduling...' : 'Schedule Appointment'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
