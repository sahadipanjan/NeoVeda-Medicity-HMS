import React, { useState, useEffect, useCallback } from 'react';
import { doctorsAPI, adminAPI } from '../services/api';

export default function Doctors() {
    const [doctors, setDoctors] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});
    const [filterDept, setFilterDept] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: 15 };
            if (filterDept) params.department_id = filterDept;
            const [docRes, deptRes] = await Promise.all([doctorsAPI.list(params), adminAPI.departments()]);
            setDoctors(docRes.data);
            setPagination(docRes.pagination);
            setDepartments(deptRes.data);
        } catch { } finally { setLoading(false); }
    }, [page, filterDept]);

    useEffect(() => { load(); }, [load]);

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

    const openCreate = () => {
        setForm({
            first_name: '', last_name: '', department_id: '', specialization: '', qualification: '',
            medical_council_reg: '', phone: '', email: '', consultation_fee: '', password: ''
        });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await doctorsAPI.create(form);
            showToast('Doctor registered with Employee Code');
            setShowModal(false);
            load();
        } catch (err) { showToast(err.message, 'error'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`Deactivate Dr. ${name}?`)) return;
        try { await doctorsAPI.delete(id); showToast('Doctor deactivated'); load(); }
        catch (err) { showToast(err.message, 'error'); }
    };

    return (
        <div className="fade-in">
            {toast && <div className="toast-container"><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}

            <div className="page-header">
                <div><h1>👨‍⚕️ Doctors</h1><p className="page-subtitle">Medical staff directory & management</p></div>
                <button className="btn btn-primary" onClick={openCreate}>➕ Register Doctor</button>
            </div>

            <div className="search-bar">
                <select className="form-select" style={{ maxWidth: 250 }} value={filterDept} onChange={e => { setFilterDept(e.target.value); setPage(1); }}>
                    <option value="">All Departments</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <button className="btn btn-ghost" onClick={load}>🔄 Refresh</button>
            </div>

            {loading ? <div className="loading-spinner"><div className="spinner"></div></div> : (
                <>
                    <div className="table-container">
                        <table>
                            <thead><tr>
                                <th>Employee Code</th><th>Name</th><th>Department</th><th>Specialization</th><th>Fee (₹)</th><th>Actions</th>
                            </tr></thead>
                            <tbody>
                                {doctors.length === 0 ? (
                                    <tr><td colSpan="6"><div className="empty-state"><p>No doctors found</p></div></td></tr>
                                ) : doctors.map(d => (
                                    <tr key={d.id}>
                                        <td><span className="badge badge-purple">{d.employee_code}</span></td>
                                        <td style={{ fontWeight: 600 }}>Dr. {d.first_name} {d.last_name}</td>
                                        <td><span className="badge badge-info">{d.department_name}</span></td>
                                        <td>{d.specialization || '—'}</td>
                                        <td>₹{Number(d.consultation_fee).toLocaleString('en-IN')}</td>
                                        <td>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d.id, `${d.first_name} ${d.last_name}`)}>🗑️</button>
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
                            <h2>➕ Register Doctor</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">First Name *</label>
                                    <input className="form-input" required value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Last Name *</label>
                                    <input className="form-input" required value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} /></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">Department *</label>
                                    <select className="form-select" required value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}>
                                        <option value="">Select Department</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select></div>
                                <div className="form-group"><label className="form-label">Email *</label>
                                    <input className="form-input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">Specialization</label>
                                    <input className="form-input" value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Qualification</label>
                                    <input className="form-input" placeholder="MBBS, MD..." value={form.qualification} onChange={e => setForm({ ...form, qualification: e.target.value })} /></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">MCI Registration</label>
                                    <input className="form-input" value={form.medical_council_reg} onChange={e => setForm({ ...form, medical_council_reg: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Consultation Fee (₹)</label>
                                    <input className="form-input" type="number" value={form.consultation_fee} onChange={e => setForm({ ...form, consultation_fee: e.target.value })} /></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">Phone</label>
                                    <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Initial Password *</label>
                                    <input className="form-input" type="password" required placeholder="Min 8 chars, 1 uppercase, 1 digit, 1 special" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
                            </div>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Registering...' : 'Register Doctor'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
