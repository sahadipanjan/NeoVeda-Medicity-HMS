import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const res = await adminAPI.dashboard();
            setStats(res.data);
        } catch (err) {
            console.error('Dashboard load failed:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1>📊 Dashboard</h1>
                    <p className="page-subtitle">NeoVeda Medicity — Overview at a glance</p>
                </div>
                <button className="btn btn-ghost" onClick={loadStats}>🔄 Refresh</button>
            </div>

            <div className="stats-grid">
                <div className="stat-card blue">
                    <div className="stat-icon">🏷️</div>
                    <div className="stat-value">{stats?.patients?.total || 0}</div>
                    <div className="stat-label">Total Patients</div>
                </div>
                <div className="stat-card purple">
                    <div className="stat-icon">👨‍⚕️</div>
                    <div className="stat-value">{stats?.doctors?.total || 0}</div>
                    <div className="stat-label">Active Doctors</div>
                </div>
                <div className="stat-card green">
                    <div className="stat-icon">👥</div>
                    <div className="stat-value">{stats?.staff?.total || 0}</div>
                    <div className="stat-label">Staff Members</div>
                </div>
                <div className="stat-card amber">
                    <div className="stat-icon">📅</div>
                    <div className="stat-value">{stats?.appointments?.today || 0}</div>
                    <div className="stat-label">Today's Appointments</div>
                </div>
                <div className="stat-card cyan">
                    <div className="stat-icon">🛏️</div>
                    <div className="stat-value">{stats?.admissions?.available_beds || 0}</div>
                    <div className="stat-label">Available Beds</div>
                </div>
                <div className="stat-card red">
                    <div className="stat-icon">🏨</div>
                    <div className="stat-value">{stats?.admissions?.active_admissions || 0}</div>
                    <div className="stat-label">Active Admissions</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div className="card">
                    <div className="card-header">
                        <h3>📅 Appointments Overview</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="detail-field">
                            <div className="field-label">Scheduled</div>
                            <div className="field-value" style={{ color: 'var(--accent-info)' }}>
                                {stats?.appointments?.scheduled || 0}
                            </div>
                        </div>
                        <div className="detail-field">
                            <div className="field-label">Completed</div>
                            <div className="field-value" style={{ color: 'var(--accent-success)' }}>
                                {stats?.appointments?.completed || 0}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3>💰 Billing Summary</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="detail-field">
                            <div className="field-label">Collected</div>
                            <div className="field-value" style={{ color: 'var(--accent-success)' }}>
                                ₹{Number(stats?.billing?.total_collected || 0).toLocaleString('en-IN')}
                            </div>
                        </div>
                        <div className="detail-field">
                            <div className="field-label">Pending</div>
                            <div className="field-value" style={{ color: 'var(--accent-warning)' }}>
                                ₹{Number(stats?.billing?.total_pending || 0).toLocaleString('en-IN')}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card" style={{ gridColumn: '1 / -1' }}>
                    <div className="card-header">
                        <h3>🛏️ Bed Occupancy</h3>
                    </div>
                    <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
                        <div className="detail-field">
                            <div className="field-label">Occupied</div>
                            <div className="field-value" style={{ color: 'var(--accent-danger)', fontSize: '1.5rem' }}>
                                {stats?.admissions?.occupied_beds || 0}
                            </div>
                        </div>
                        <div className="detail-field">
                            <div className="field-label">Available</div>
                            <div className="field-value" style={{ color: 'var(--accent-success)', fontSize: '1.5rem' }}>
                                {stats?.admissions?.available_beds || 0}
                            </div>
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{
                                height: 12, borderRadius: 6, background: 'var(--bg-glass)', overflow: 'hidden',
                            }}>
                                <div style={{
                                    height: '100%', borderRadius: 6,
                                    background: 'var(--gradient-primary)',
                                    width: `${((stats?.admissions?.occupied_beds || 0) /
                                        ((stats?.admissions?.occupied_beds || 0) + (stats?.admissions?.available_beds || 1))) * 100}%`,
                                    transition: 'width 0.5s ease',
                                }} />
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 4 }}>
                                {Math.round(((stats?.admissions?.occupied_beds || 0) /
                                    ((stats?.admissions?.occupied_beds || 0) + (stats?.admissions?.available_beds || 1))) * 100)}% occupancy
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
