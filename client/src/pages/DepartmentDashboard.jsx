/**
 * DepartmentDashboard — Context-aware dashboard for non-admin users.
 *
 * Shows department-scoped metrics:
 *   - Department name & HOD
 *   - Doctor count, Staff count, Today's appointments, Available beds
 *
 * Filters data strictly by the authenticated user's assigned department.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../services/api';

export default function DepartmentDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadDeptStats();
    }, []);

    const loadDeptStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await adminAPI.departmentStats(user.department_id);
            setStats(res.data);
        } catch (err) {
            console.error('Department stats failed:', err);
            setError('Unable to load department data.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

    if (error) return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1>📊 My Department</h1>
                    <p className="page-subtitle">Department overview</p>
                </div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                <p style={{ color: 'var(--accent-danger)', fontSize: '1.1rem' }}>⚠️ {error}</p>
                <button className="btn btn-primary" onClick={loadDeptStats} style={{ marginTop: 16 }}>🔄 Retry</button>
            </div>
        </div>
    );

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1>📊 Department Dashboard</h1>
                    <p className="page-subtitle">
                        {stats?.department_name || 'Your Department'} — Real-time overview
                    </p>
                </div>
                <button className="btn btn-ghost" onClick={loadDeptStats}>🔄 Refresh</button>
            </div>

            {/* Department Info Card */}
            <div className="card" style={{ marginBottom: 24, background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 4 }}>
                            Department
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            🏥 {stats?.department_name || '—'}
                        </div>
                    </div>
                    {stats?.hod_name && (
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 4 }}>
                                Head of Department
                            </div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                                👨‍⚕️ Dr. {stats.hod_name}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card purple">
                    <div className="stat-icon">👨‍⚕️</div>
                    <div className="stat-value">{stats?.doctor_count || 0}</div>
                    <div className="stat-label">Doctors in Department</div>
                </div>
                <div className="stat-card green">
                    <div className="stat-icon">👥</div>
                    <div className="stat-value">{stats?.staff_count || 0}</div>
                    <div className="stat-label">Staff Members</div>
                </div>
                <div className="stat-card amber">
                    <div className="stat-icon">📅</div>
                    <div className="stat-value">{stats?.today_appointments || 0}</div>
                    <div className="stat-label">Today's Appointments</div>
                </div>
                <div className="stat-card cyan">
                    <div className="stat-icon">🛏️</div>
                    <div className="stat-value">{stats?.available_beds || 0}</div>
                    <div className="stat-label">Available Beds</div>
                </div>
                <div className="stat-card blue">
                    <div className="stat-icon">🏷️</div>
                    <div className="stat-value">{stats?.active_patients || 0}</div>
                    <div className="stat-label">Active Patients</div>
                </div>
                <div className="stat-card red">
                    <div className="stat-icon">🏨</div>
                    <div className="stat-value">{stats?.occupied_beds || 0}</div>
                    <div className="stat-label">Occupied Beds</div>
                </div>
            </div>

            {/* Department Quick Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 }}>
                <div className="card">
                    <div className="card-header">
                        <h3>📅 Appointment Status</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="detail-field">
                            <div className="field-label">Scheduled</div>
                            <div className="field-value" style={{ color: 'var(--accent-info)' }}>
                                {stats?.scheduled_appointments || 0}
                            </div>
                        </div>
                        <div className="detail-field">
                            <div className="field-label">Completed</div>
                            <div className="field-value" style={{ color: 'var(--accent-success)' }}>
                                {stats?.completed_appointments || 0}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3>🛏️ Bed Occupancy</h3>
                    </div>
                    <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
                        <div className="detail-field">
                            <div className="field-label">Occupied</div>
                            <div className="field-value" style={{ color: 'var(--accent-danger)', fontSize: '1.5rem' }}>
                                {stats?.occupied_beds || 0}
                            </div>
                        </div>
                        <div className="detail-field">
                            <div className="field-label">Available</div>
                            <div className="field-value" style={{ color: 'var(--accent-success)', fontSize: '1.5rem' }}>
                                {stats?.available_beds || 0}
                            </div>
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{
                                height: 12, borderRadius: 6, background: 'var(--bg-glass)', overflow: 'hidden',
                            }}>
                                <div style={{
                                    height: '100%', borderRadius: 6,
                                    background: 'var(--gradient-primary)',
                                    width: `${((stats?.occupied_beds || 0) /
                                        ((stats?.occupied_beds || 0) + (stats?.available_beds || 1))) * 100}%`,
                                    transition: 'width 0.5s ease',
                                }} />
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 4 }}>
                                {Math.round(((stats?.occupied_beds || 0) /
                                    ((stats?.occupied_beds || 0) + (stats?.available_beds || 1))) * 100)}% occupancy
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
