/**
 * DoctorDashboard — Personalized dashboard for the authenticated physician.
 *
 * Displays:
 *   - Profile summary & quick stats
 *   - Today's appointment schedule with EMR action buttons
 *   - Current inpatient ward rounds
 *
 * IMPORTANT: EMR links pass patient_id (from appointment data) not appointment.id
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doctorAPI } from '../services/api';

export default function DoctorDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadDashboard = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await doctorAPI.dashboard();
            setData(res?.data || res);
        } catch (err) {
            console.error('Dashboard load error:', err);
            setError(err?.message || 'Failed to load dashboard.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadDashboard(); }, [loadDashboard]);

    // EMR navigation — passes correct patient_id + appointment_id
    const openEMR = (patientId, appointmentId) => {
        const params = new URLSearchParams();
        if (patientId) params.set('patient_id', patientId);
        if (appointmentId) params.set('appointment_id', appointmentId);
        navigate(`/emr?${params.toString()}`);
    };

    if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

    if (error) return (
        <div className="fade-in">
            <div className="page-header"><div><h1>🩺 My Dashboard</h1></div></div>
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                <p style={{ color: 'var(--accent-danger)', fontSize: '1.1rem' }}>⚠️ {error}</p>
                <button className="btn btn-primary" onClick={loadDashboard} style={{ marginTop: 12 }}>
                    🔄 Retry
                </button>
            </div>
        </div>
    );

    const profile = data?.profile || {};
    const today_appointments = data?.today_appointments || [];
    const inpatients = data?.inpatients || [];
    const stats = data?.stats || {};

    return (
        <div className="fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1>🩺 Dr. {profile?.first_name || user?.first_name} {profile?.last_name || user?.last_name}</h1>
                    <p className="page-subtitle">
                        {profile?.specialization || '—'} · {profile?.department_name || '—'}
                    </p>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <div>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    <div style={{ marginTop: 4 }}>{profile?.qualification || ''}</div>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
                <div className="card stat-card">
                    <div className="stat-icon" style={{ fontSize: '1.8rem' }}>📋</div>
                    <div className="stat-value">{stats?.pending_appointments ?? 0}</div>
                    <div className="stat-label">Pending Today</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-icon" style={{ fontSize: '1.8rem' }}>⏳</div>
                    <div className="stat-value">{stats?.in_progress ?? 0}</div>
                    <div className="stat-label">In Progress</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-icon" style={{ fontSize: '1.8rem' }}>✅</div>
                    <div className="stat-value">{stats?.completed ?? 0}</div>
                    <div className="stat-label">Completed</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-icon" style={{ fontSize: '1.8rem' }}>🛏️</div>
                    <div className="stat-value">{stats?.total_inpatients ?? 0}</div>
                    <div className="stat-label">Inpatients</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-icon" style={{ fontSize: '1.8rem' }}>📊</div>
                    <div className="stat-value">{stats?.total_records ?? 0}</div>
                    <div className="stat-label">Total Records</div>
                </div>
            </div>

            {/* Today's Schedule */}
            <div className="card" style={{ marginBottom: 24 }}>
                <h2 style={{ margin: '0 0 16px' }}>📅 Today's Schedule</h2>
                {today_appointments.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
                        No appointments scheduled for today.
                    </p>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Patient</th>
                                    <th>UHID</th>
                                    <th>Gender / Age</th>
                                    <th>Notes / Type</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {today_appointments.map(apt => {
                                    const age = apt?.date_of_birth
                                        ? Math.floor((Date.now() - new Date(apt.date_of_birth)) / 31557600000)
                                        : '—';
                                    return (
                                        <tr key={apt.id}>
                                            <td><strong>{apt.appointment_time?.slice(0, 5) || '—'}</strong></td>
                                            <td>{apt.patient_first || ''} {apt.patient_last || ''}</td>
                                            <td><code>{apt.uhid || '—'}</code></td>
                                            <td>{apt.gender || '—'} / {age}y</td>
                                            <td>{apt.notes || apt.type || '—'}</td>
                                            <td>
                                                <span className={`badge badge-${apt.status === 'Completed' ? 'success' :
                                                    apt.status === 'Cancelled' ? 'danger' :
                                                        apt.status === 'In-Progress' ? 'warning' : 'info'
                                                    }`}>
                                                    {apt.status || '—'}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="btn btn-sm btn-primary"
                                                    onClick={() => openEMR(apt.patient_id, apt.id)}>
                                                    📝 EMR
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Inpatient Ward Rounds */}
            <div className="card">
                <h2 style={{ margin: '0 0 16px' }}>🛏️ Current Inpatients</h2>
                {inpatients.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
                        No active inpatients under your care.
                    </p>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Patient</th>
                                    <th>UHID</th>
                                    <th>Ward</th>
                                    <th>Bed</th>
                                    <th>Blood Group</th>
                                    <th>Admitted</th>
                                    <th>Diagnosis</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inpatients.map(ip => (
                                    <tr key={ip.admission_id}>
                                        <td>{ip.patient_first || ''} {ip.patient_last || ''}</td>
                                        <td><code>{ip.uhid || '—'}</code></td>
                                        <td>{ip.ward_name || '—'}</td>
                                        <td>{ip.bed_number || '—'}</td>
                                        <td><span className="badge badge-warning">{ip.blood_group || '—'}</span></td>
                                        <td>{ip.admission_date ? new Date(ip.admission_date).toLocaleDateString('en-IN') : '—'}</td>
                                        <td>{ip.diagnosis_at_admission || '—'}</td>
                                        <td>
                                            <button className="btn btn-sm btn-primary"
                                                onClick={() => openEMR(ip.patient_id)}>
                                                📝 EMR
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
