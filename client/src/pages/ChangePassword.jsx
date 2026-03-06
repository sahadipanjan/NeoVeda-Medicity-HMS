/**
 * ChangePassword — Standalone security page accessible to ALL authenticated users.
 */

import React, { useState } from 'react';
import { authAPI } from '../services/api';

export default function ChangePassword() {
    const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
    const [toast, setToast] = useState(null);
    const [saving, setSaving] = useState(false);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.new_password !== form.confirm_password) {
            showToast('New passwords do not match.', 'error');
            return;
        }
        if (form.new_password.length < 8) {
            showToast('Password must be at least 8 characters.', 'error');
            return;
        }
        setSaving(true);
        try {
            await authAPI.changePassword(form.current_password, form.new_password);
            showToast('Password changed successfully! 🎉');
            setForm({ current_password: '', new_password: '', confirm_password: '' });
        } catch (err) {
            showToast(err.message || 'Password change failed.', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fade-in">
            {toast && (
                <div className="toast-container">
                    <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
                </div>
            )}

            <div className="page-header">
                <div>
                    <h1>🔐 Security Settings</h1>
                    <p className="page-subtitle">Manage your account credentials</p>
                </div>
            </div>

            <div style={{ maxWidth: 520 }}>
                <div className="card">
                    <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                        🔒 Change Password
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 20 }}>
                        Choose a strong password with at least 8 characters, including uppercase, lowercase, numbers, and symbols.
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Current Password *</label>
                            <input
                                className="form-input" type="password" required
                                placeholder="Enter current password"
                                value={form.current_password}
                                onChange={e => setForm({ ...form, current_password: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">New Password *</label>
                            <input
                                className="form-input" type="password" required
                                placeholder="Enter new password"
                                value={form.new_password}
                                onChange={e => setForm({ ...form, new_password: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Confirm New Password *</label>
                            <input
                                className="form-input" type="password" required
                                placeholder="Re-enter new password"
                                value={form.confirm_password}
                                onChange={e => setForm({ ...form, confirm_password: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={saving}
                            style={{ marginTop: 12, width: '100%' }}>
                            {saving ? (
                                <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span> Updating...</>
                            ) : (
                                <>🔐 Update Password</>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
