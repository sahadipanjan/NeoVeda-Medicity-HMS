/**
 * ClinicalNotes — EMR Portal for Doctors
 *
 * Reads patient_id from URL search params.
 * Displays patient demographics/vitals and allows the doctor to:
 *   - View past clinical records
 *   - Append diagnostic notes
 *   - Prescribe medications (dosage, frequency)
 *   - Set follow-up dates
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { doctorAPI } from '../services/api';

export default function ClinicalNotes() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const patientId = searchParams.get('patient_id');
    const appointmentId = searchParams.get('appointment_id');

    const [patient, setPatient] = useState(null);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Form state
    const [form, setForm] = useState({
        diagnosis: '', symptoms: '', notes: '',
        prescription: '', follow_up_date: '',
        vitals: { bp: '', pulse: '', temperature: '', spo2: '', weight: '', height: '' },
    });

    const showToast = useCallback((msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    }, []);

    const loadRecords = useCallback(async () => {
        if (!patientId) { setLoading(false); return; }
        setLoading(true);
        setError(null);
        try {
            const res = await doctorAPI.patientRecords(patientId);
            // Handle response shape: { data: { patient, records } } or { patient, records }
            const payload = res?.data || res || {};
            setPatient(payload.patient || null);
            setRecords(payload.records || []);
        } catch (err) {
            console.error('EMR load error:', err);
            setError(err?.message || 'Failed to load patient records.');
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    useEffect(() => { loadRecords(); }, [loadRecords]);

    const resetForm = () => {
        setForm({
            diagnosis: '', symptoms: '', notes: '',
            prescription: '', follow_up_date: '',
            vitals: { bp: '', pulse: '', temperature: '', spo2: '', weight: '', height: '' },
        });
        setEditingId(null);
        setShowForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                patient_id: parseInt(patientId),
                appointment_id: appointmentId ? parseInt(appointmentId) : null,
                diagnosis: form.diagnosis || null,
                symptoms: form.symptoms || null,
                prescription: form.prescription || null,
                notes: form.notes || null,
                follow_up_date: form.follow_up_date || null,
                vitals: Object.values(form.vitals).some(v => v) ? form.vitals : null,
            };

            if (editingId) {
                await doctorAPI.updateRecord(editingId, payload);
                showToast('Clinical record updated.');
            } else {
                await doctorAPI.createRecord(payload);
                showToast('Clinical record created.');
            }
            resetForm();
            await loadRecords();
        } catch (err) {
            showToast(err.message || 'Failed to save record.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const startEdit = (rec) => {
        setForm({
            diagnosis: rec.diagnosis || '',
            symptoms: rec.symptoms || '',
            notes: rec.notes || '',
            prescription: rec.prescription || '',
            follow_up_date: rec.follow_up_date ? rec.follow_up_date.split('T')[0] : '',
            vitals: rec.vitals || { bp: '', pulse: '', temperature: '', spo2: '', weight: '', height: '' },
        });
        setEditingId(rec.id);
        setShowForm(true);
    };

    if (!patientId) return (
        <div className="fade-in">
            <div className="page-header"><div><h1>📋 EMR Portal</h1></div></div>
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                <p style={{ color: 'var(--text-muted)' }}>No patient selected. Return to your dashboard.</p>
                <button className="btn btn-primary" onClick={() => navigate('/')}>← Dashboard</button>
            </div>
        </div>
    );

    if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

    if (error) return (
        <div className="fade-in">
            <div className="page-header"><div><h1>📋 EMR Portal</h1></div></div>
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                <p style={{ color: 'var(--accent-danger)', fontSize: '1.1rem' }}>⚠️ {error}</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
                    <button className="btn btn-primary" onClick={loadRecords}>🔄 Retry</button>
                    <button className="btn btn-ghost" onClick={() => navigate('/')}>← Dashboard</button>
                </div>
            </div>
        </div>
    );

    const age = patient?.date_of_birth
        ? Math.floor((Date.now() - new Date(patient.date_of_birth)) / 31557600000)
        : '—';

    return (
        <div className="fade-in">
            {/* Toast */}
            {toast && (
                <div className={`toast toast-${toast.type}`} style={{
                    position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '12px 24px',
                    borderRadius: 8, background: toast.type === 'error' ? 'var(--accent-danger)' : 'var(--accent-success)',
                    color: '#fff', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1>📋 EMR — {patient?.first_name} {patient?.last_name}</h1>
                    <p className="page-subtitle">
                        UHID: {patient?.uhid} · {patient?.gender} · {age}y · Blood: {patient?.blood_group || '—'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
                        ＋ New Clinical Note
                    </button>
                    <button className="btn btn-ghost" onClick={() => navigate('/')}>← Dashboard</button>
                </div>
            </div>

            {/* Patient Demographics Card */}
            <div className="card" style={{ marginBottom: 24 }}>
                <h3 style={{ margin: '0 0 12px' }}>👤 Patient Demographics</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 12 }}>
                    <div><strong>Name:</strong> {patient?.first_name} {patient?.last_name}</div>
                    <div><strong>UHID:</strong> <code>{patient?.uhid}</code></div>
                    <div><strong>DOB:</strong> {patient?.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString('en-IN') : '—'}</div>
                    <div><strong>Gender:</strong> {patient?.gender}</div>
                    <div><strong>Blood Group:</strong> {patient?.blood_group || '—'}</div>
                    <div><strong>Phone:</strong> {patient?.phone || '—'}</div>
                    <div><strong>Email:</strong> {patient?.email || '—'}</div>
                    <div><strong>City:</strong> {patient?.city || '—'}, {patient?.state || '—'}</div>
                </div>
            </div>

            {/* Clinical Notes Form */}
            {showForm && (
                <div className="card" style={{ marginBottom: 24, border: '2px solid var(--accent-primary)' }}>
                    <h3 style={{ margin: '0 0 16px' }}>
                        {editingId ? '✏️ Edit Clinical Record' : '📝 New Clinical Record'}
                    </h3>
                    <form onSubmit={handleSubmit}>
                        {/* Vitals Section */}
                        <h4 style={{ margin: '0 0 8px', color: 'var(--accent-primary)' }}>🫀 Vitals</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 12, marginBottom: 16 }}>
                            <div className="form-group">
                                <label>Blood Pressure</label>
                                <input type="text" placeholder="120/80 mmHg"
                                    value={form.vitals.bp}
                                    onChange={e => setForm(f => ({ ...f, vitals: { ...f.vitals, bp: e.target.value } }))} />
                            </div>
                            <div className="form-group">
                                <label>Pulse (bpm)</label>
                                <input type="number" placeholder="72"
                                    value={form.vitals.pulse}
                                    onChange={e => setForm(f => ({ ...f, vitals: { ...f.vitals, pulse: e.target.value } }))} />
                            </div>
                            <div className="form-group">
                                <label>Temperature (°F)</label>
                                <input type="number" step="0.1" placeholder="98.6"
                                    value={form.vitals.temperature}
                                    onChange={e => setForm(f => ({ ...f, vitals: { ...f.vitals, temperature: e.target.value } }))} />
                            </div>
                            <div className="form-group">
                                <label>SpO₂ (%)</label>
                                <input type="number" placeholder="98"
                                    value={form.vitals.spo2}
                                    onChange={e => setForm(f => ({ ...f, vitals: { ...f.vitals, spo2: e.target.value } }))} />
                            </div>
                            <div className="form-group">
                                <label>Weight (kg)</label>
                                <input type="number" step="0.1" placeholder="70"
                                    value={form.vitals.weight}
                                    onChange={e => setForm(f => ({ ...f, vitals: { ...f.vitals, weight: e.target.value } }))} />
                            </div>
                            <div className="form-group">
                                <label>Height (cm)</label>
                                <input type="number" placeholder="170"
                                    value={form.vitals.height}
                                    onChange={e => setForm(f => ({ ...f, vitals: { ...f.vitals, height: e.target.value } }))} />
                            </div>
                        </div>

                        {/* Diagnosis & Symptoms */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                            <div className="form-group">
                                <label>Symptoms</label>
                                <textarea rows={3} placeholder="Chief complaints..."
                                    value={form.symptoms}
                                    onChange={e => setForm(f => ({ ...f, symptoms: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label>Diagnosis</label>
                                <textarea rows={3} placeholder="Clinical diagnosis..."
                                    value={form.diagnosis}
                                    onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))} />
                            </div>
                        </div>

                        {/* Prescription */}
                        <div className="form-group" style={{ marginBottom: 16 }}>
                            <label>💊 Prescription (Medications, Dosage & Frequency)</label>
                            <textarea rows={4}
                                placeholder="1. Tab Paracetamol 500mg — 1 tab TDS after food × 5 days&#10;2. Cap Amoxicillin 500mg — 1 cap BD × 7 days&#10;3. Syp Cough Relief 100ml — 10ml TDS × 3 days"
                                value={form.prescription}
                                onChange={e => setForm(f => ({ ...f, prescription: e.target.value }))} />
                        </div>

                        {/* Treatment Notes & Follow-up */}
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
                            <div className="form-group">
                                <label>Treatment Notes / Protocol</label>
                                <textarea rows={3} placeholder="Treatment plan, advice, investigations..."
                                    value={form.notes}
                                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label>Follow-up Date</label>
                                <input type="date" value={form.follow_up_date}
                                    onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button type="button" className="btn btn-ghost" onClick={resetForm}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? 'Saving...' : editingId ? 'Update Record' : 'Save Record'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Past Clinical Records */}
            <div className="card">
                <h3 style={{ margin: '0 0 16px' }}>📚 Clinical History ({records.length} records)</h3>
                {records.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
                        No clinical records found for this patient.
                    </p>
                ) : (
                    records.map(rec => (
                        <div key={rec.id} style={{
                            border: '1px solid var(--border-color)', borderRadius: 8,
                            padding: 16, marginBottom: 12, background: 'var(--bg-secondary)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <div>
                                    <strong style={{ color: 'var(--accent-primary)' }}>{rec.record_no}</strong>
                                    <span style={{ marginLeft: 12, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        {new Date(rec.created_at).toLocaleDateString('en-IN')} —
                                        Dr. {rec.doctor_first} {rec.doctor_last} ({rec.specialization})
                                    </span>
                                </div>
                                <button className="btn btn-sm btn-ghost" onClick={() => startEdit(rec)}>✏️ Edit</button>
                            </div>

                            {/* Vitals */}
                            {rec.vitals && (
                                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 8, fontSize: '0.85rem' }}>
                                    {rec.vitals.bp && <span>🩸 BP: <strong>{rec.vitals.bp}</strong></span>}
                                    {rec.vitals.pulse && <span>💓 Pulse: <strong>{rec.vitals.pulse}</strong></span>}
                                    {rec.vitals.temperature && <span>🌡️ Temp: <strong>{rec.vitals.temperature}°F</strong></span>}
                                    {rec.vitals.spo2 && <span>🫁 SpO₂: <strong>{rec.vitals.spo2}%</strong></span>}
                                    {rec.vitals.weight && <span>⚖️ {rec.vitals.weight}kg</span>}
                                    {rec.vitals.height && <span>📏 {rec.vitals.height}cm</span>}
                                </div>
                            )}

                            {rec.symptoms && <div style={{ marginBottom: 6 }}><strong>Symptoms:</strong> {rec.symptoms}</div>}
                            {rec.diagnosis && <div style={{ marginBottom: 6 }}><strong>Diagnosis:</strong> {rec.diagnosis}</div>}
                            {rec.prescription && (
                                <div style={{ marginBottom: 6, whiteSpace: 'pre-wrap', background: 'var(--bg-primary)', padding: 8, borderRadius: 6 }}>
                                    <strong>💊 Prescription:</strong><br />{rec.prescription}
                                </div>
                            )}
                            {rec.notes && <div style={{ marginBottom: 6 }}><strong>Notes:</strong> {rec.notes}</div>}
                            {rec.follow_up_date && (
                                <div style={{ fontSize: '0.85rem', color: 'var(--accent-warning)' }}>
                                    📅 Follow-up: {new Date(rec.follow_up_date).toLocaleDateString('en-IN')}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
