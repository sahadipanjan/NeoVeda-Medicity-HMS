import React, { useState, useEffect, useCallback } from 'react';
import { patientsAPI } from '../services/api';

export default function Patients() {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [editPatient, setEditPatient] = useState(null);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await patientsAPI.list({ page, limit: 15, search });
            setPatients(res.data);
            setPagination(res.pagination);
        } catch { } finally { setLoading(false); }
    }, [page, search]);

    useEffect(() => { load(); }, [load]);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const openCreate = () => {
        setEditPatient(null);
        setForm({
            first_name: '', last_name: '', date_of_birth: '', gender: 'Male', phone: '', email: '',
            address_line1: '', city: '', state: '', pincode: '', blood_group: '', emergency_contact_name: '', emergency_contact_phone: ''
        });
        setShowModal(true);
    };

    const openEdit = async (id) => {
        try {
            const res = await patientsAPI.get(id);
            setEditPatient(res.data);
            setForm(res.data);
            setShowModal(true);
        } catch { }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editPatient) {
                await patientsAPI.update(editPatient.id, form);
                showToast('Patient updated successfully');
            } else {
                await patientsAPI.create(form);
                showToast('Patient registered successfully');
            }
            setShowModal(false);
            load();
        } catch (err) { showToast(err.message, 'error'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`Deactivate patient: ${name}?`)) return;
        try {
            await patientsAPI.delete(id);
            showToast('Patient deactivated');
            load();
        } catch (err) { showToast(err.message, 'error'); }
    };

    return (
        <div className="fade-in">
            {toast && <div className="toast-container"><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}

            <div className="page-header">
                <div><h1>🏷️ Patients</h1><p className="page-subtitle">Patient registration & management</p></div>
                <button className="btn btn-primary" onClick={openCreate}>➕ Register Patient</button>
            </div>

            <div className="search-bar">
                <input className="form-input" placeholder="Search by name, UHID, or phone..."
                    value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                <button className="btn btn-ghost" onClick={load}>🔍 Search</button>
            </div>

            {loading ? <div className="loading-spinner"><div className="spinner"></div></div> : (
                <>
                    <div className="table-container">
                        <table>
                            <thead><tr>
                                <th>UHID</th><th>Name</th><th>Gender</th><th>Phone</th><th>Blood Group</th><th>City</th><th>Actions</th>
                            </tr></thead>
                            <tbody>
                                {patients.length === 0 ? (
                                    <tr><td colSpan="7"><div className="empty-state"><div className="empty-icon">🏷️</div><p>No patients found</p></div></td></tr>
                                ) : patients.map(p => (
                                    <tr key={p.id}>
                                        <td><span className="badge badge-info">{p.uhid}</span></td>
                                        <td style={{ fontWeight: 600 }}>{p.first_name} {p.last_name}</td>
                                        <td>{p.gender}</td><td>{p.phone}</td>
                                        <td><span className="badge badge-danger">{p.blood_group || '—'}</span></td>
                                        <td>{p.city || '—'}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p.id)}>✏️ Edit</button>
                                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id, `${p.first_name} ${p.last_name}`)}>🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {pagination.totalPages > 1 && (
                        <div className="pagination">
                            <button disabled={!pagination.hasPrevPage} onClick={() => setPage(p => p - 1)}>← Prev</button>
                            <span className="pagination-info">Page {pagination.page || page} of {pagination.totalPages}</span>
                            <button disabled={!pagination.hasNextPage} onClick={() => setPage(p => p + 1)}>Next →</button>
                        </div>
                    )}
                </>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal slide-up" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editPatient ? '✏️ Edit Patient' : '➕ Register Patient'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">First Name *</label>
                                    <input className="form-input" required value={form.first_name || ''} onChange={e => setForm({ ...form, first_name: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Last Name *</label>
                                    <input className="form-input" required value={form.last_name || ''} onChange={e => setForm({ ...form, last_name: e.target.value })} /></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">Date of Birth *</label>
                                    <input className="form-input" type="date" required value={form.date_of_birth?.split('T')[0] || ''} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Gender *</label>
                                    <select className="form-select" value={form.gender || 'Male'} onChange={e => setForm({ ...form, gender: e.target.value })}>
                                        <option>Male</option><option>Female</option><option>Other</option>
                                    </select></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">Phone *</label>
                                    <input className="form-input" required value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Blood Group</label>
                                    <select className="form-select" value={form.blood_group || ''} onChange={e => setForm({ ...form, blood_group: e.target.value })}>
                                        <option value="">Select</option>
                                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg}>{bg}</option>)}
                                    </select></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">Email</label>
                                    <input className="form-input" type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">City</label>
                                    <input className="form-input" value={form.city || ''} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">State</label>
                                    <input className="form-input" value={form.state || ''} onChange={e => setForm({ ...form, state: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Pincode</label>
                                    <input className="form-input" maxLength={6} value={form.pincode || ''} onChange={e => setForm({ ...form, pincode: e.target.value })} /></div>
                            </div>
                            <div className="form-group"><label className="form-label">Address</label>
                                <input className="form-input" value={form.address_line1 || ''} onChange={e => setForm({ ...form, address_line1: e.target.value })} /></div>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">Emergency Contact</label>
                                    <input className="form-input" value={form.emergency_contact_name || ''} onChange={e => setForm({ ...form, emergency_contact_name: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Emergency Phone</label>
                                    <input className="form-input" value={form.emergency_contact_phone || ''} onChange={e => setForm({ ...form, emergency_contact_phone: e.target.value })} /></div>
                            </div>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editPatient ? 'Update Patient' : 'Register Patient'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
