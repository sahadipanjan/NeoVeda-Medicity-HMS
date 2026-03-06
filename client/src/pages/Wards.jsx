import React, { useState, useEffect } from 'react';
import { wardsAPI } from '../services/api';

const TYPE_COLORS = {
    'General': 'badge-success', 'Semi-Private': 'badge-info', 'Private': 'badge-purple',
    'ICU': 'badge-danger', 'NICU': 'badge-danger', 'PICU': 'badge-danger', 'CCU': 'badge-warning', 'HDU': 'badge-warning', 'Isolation': 'badge-danger'
};

export default function Wards() {
    const [wards, setWards] = useState([]);
    const [selectedWard, setSelectedWard] = useState(null);
    const [wardDetail, setWardDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAdmit, setShowAdmit] = useState(false);
    const [admitForm, setAdmitForm] = useState({ patient_id: '', doctor_id: '', bed_id: '', department_id: '' });
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => { loadWards(); }, []);

    const loadWards = async () => {
        setLoading(true);
        try { const res = await wardsAPI.list(); setWards(res.data); } catch { } finally { setLoading(false); }
    };

    const loadWardDetail = async (id) => {
        setSelectedWard(id);
        try { const res = await wardsAPI.get(id); setWardDetail(res.data); } catch { }
    };

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

    const handleAdmit = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            await wardsAPI.admit(admitForm);
            showToast('Patient admitted'); setShowAdmit(false); loadWards(); if (selectedWard) loadWardDetail(selectedWard);
        } catch (err) { showToast(err.message, 'error'); }
        finally { setSaving(false); }
    };

    const handleDischarge = async (admId) => {
        const summary = prompt('Enter discharge summary:');
        if (!summary) return;
        try {
            await wardsAPI.discharge(admId, summary);
            showToast('Patient discharged'); loadWards(); if (selectedWard) loadWardDetail(selectedWard);
        } catch (err) { showToast(err.message, 'error'); }
    };

    return (
        <div className="fade-in">
            {toast && <div className="toast-container"><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}

            <div className="page-header">
                <div><h1>🛏️ Wards & Beds</h1><p className="page-subtitle">Ward management & patient admissions</p></div>
                <button className="btn btn-primary" onClick={() => { setShowAdmit(true); setAdmitForm({ patient_id: '', doctor_id: '', bed_id: '', department_id: '' }); }}>
                    ➕ Admit Patient
                </button>
            </div>

            {loading ? <div className="loading-spinner"><div className="spinner"></div></div> : (
                <div style={{ display: 'grid', gridTemplateColumns: selectedWard ? '1fr 1fr' : '1fr', gap: 24 }}>
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                            {wards.map(w => (
                                <div key={w.id} className="card" style={{ cursor: 'pointer', borderColor: selectedWard === w.id ? 'var(--accent-primary)' : undefined }}
                                    onClick={() => loadWardDetail(w.id)}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <h3>{w.name}</h3>
                                            <span className={`badge ${TYPE_COLORS[w.ward_type] || 'badge-info'}`} style={{ marginTop: 4 }}>{w.ward_type}</span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{w.floor}</div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>₹{Number(w.charge_per_day).toLocaleString('en-IN')}/day</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                                        <div><span style={{ color: 'var(--accent-success)', fontWeight: 700, fontSize: '1.2rem' }}>{w.available_beds}</span>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}> available</span></div>
                                        <div><span style={{ color: 'var(--accent-danger)', fontWeight: 700, fontSize: '1.2rem' }}>{w.occupied_beds}</span>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}> occupied</span></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {wardDetail && (
                        <div className="card slide-up">
                            <div className="card-header">
                                <h3>🛏️ {wardDetail.name} — Beds</h3>
                                <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedWard(null); setWardDetail(null); }}>✕</button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
                                {wardDetail.beds?.map(b => (
                                    <div key={b.id} style={{
                                        padding: '12px', borderRadius: 8, textAlign: 'center', fontSize: '0.85rem',
                                        background: b.status === 'Available' ? 'rgba(16,185,129,0.1)' : b.status === 'Occupied' ? 'rgba(239,68,68,0.1)' : 'var(--bg-glass)',
                                        border: `1px solid ${b.status === 'Available' ? 'rgba(16,185,129,0.3)' : b.status === 'Occupied' ? 'rgba(239,68,68,0.3)' : 'var(--border-color)'}`,
                                    }}>
                                        <div style={{ fontWeight: 700 }}>Bed {b.bed_number}</div>
                                        <div style={{ fontSize: '0.75rem', color: b.status === 'Available' ? 'var(--accent-success)' : 'var(--accent-danger)' }}>{b.status}</div>
                                        {b.patient_name && <div style={{ fontSize: '0.7rem', marginTop: 4, color: 'var(--text-secondary)' }}>{b.patient_name}</div>}
                                        {b.admission_id && <button className="btn btn-danger btn-sm" style={{ marginTop: 6, fontSize: '0.7rem', padding: '3px 8px' }}
                                            onClick={() => handleDischarge(b.admission_id)}>Discharge</button>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {showAdmit && (
                <div className="modal-overlay" onClick={() => setShowAdmit(false)}>
                    <div className="modal slide-up" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>➕ Admit Patient</h2><button className="modal-close" onClick={() => setShowAdmit(false)}>×</button></div>
                        <form onSubmit={handleAdmit}>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">Patient ID *</label>
                                    <input className="form-input" type="number" required value={admitForm.patient_id} onChange={e => setAdmitForm({ ...admitForm, patient_id: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Doctor ID *</label>
                                    <input className="form-input" type="number" required value={admitForm.doctor_id} onChange={e => setAdmitForm({ ...admitForm, doctor_id: e.target.value })} /></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">Bed ID *</label>
                                    <input className="form-input" type="number" required value={admitForm.bed_id} onChange={e => setAdmitForm({ ...admitForm, bed_id: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Department ID *</label>
                                    <input className="form-input" type="number" required value={admitForm.department_id} onChange={e => setAdmitForm({ ...admitForm, department_id: e.target.value })} /></div>
                            </div>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowAdmit(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Admitting...' : 'Admit Patient'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
