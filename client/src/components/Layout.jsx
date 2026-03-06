import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffectiveRole } from './RoleGuard';
import { useTheme } from '../hooks/useTheme';

/** Roles permitted to see the Billing nav item */
const BILLING_ROLES = ['Super', 'Hospital', 'Accounts/Finance', 'Receptionist'];
const TPA_ROLES = ['Super', 'Hospital', 'Accounts/Finance', 'Receptionist'];
/** Roles that see global patient/ward listings (Doctor excluded — uses dashboard caseload) */
const CLINICAL_ROLES = ['Super', 'Hospital', 'Department', 'Nurse', 'Receptionist', 'Technician', 'Lab Technician', 'Pharmacist', 'Ward Boy'];
const DOCTOR_ROLES = ['Doctor'];

export default function Layout() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const { theme, toggle: toggleTheme } = useTheme();
    const effectiveRole = useEffectiveRole();

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    const isDoctor = DOCTOR_ROLES.includes(effectiveRole);

    // Build nav items conditionally based on user role
    const navItems = [
        { path: '/', icon: '📊', label: isDoctor ? 'My Dashboard' : 'Dashboard', show: true },
        { path: '/patients', icon: '🏷️', label: 'Patients', show: CLINICAL_ROLES.includes(effectiveRole) },
        { path: '/doctors', icon: '👨‍⚕️', label: 'Doctors Directory', show: CLINICAL_ROLES.includes(effectiveRole) || isDoctor },
        { path: '/appointments', icon: '📅', label: isDoctor ? 'My Appointments' : 'Appointments', show: CLINICAL_ROLES.includes(effectiveRole) || isDoctor },
        { path: '/wards', icon: '🛏️', label: 'Wards & Beds', show: CLINICAL_ROLES.includes(effectiveRole) },
        { path: '/billing', icon: '💰', label: 'Billing', show: BILLING_ROLES.includes(effectiveRole) },
        { path: '/tpa', icon: '🏥', label: 'TPA / Insurance', show: TPA_ROLES.includes(effectiveRole) },
        { path: '/emr', icon: '📋', label: 'EMR Portal', show: isDoctor },
        { path: '/admin', icon: '⚙️', label: 'Admin Panel', show: effectiveRole === 'Super' },
    ];

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <img src="/assets/neoveda-logo.png" alt="NeoVeda Medicity"
                        style={{ width: 180, height: 'auto' }} />
                </div>

                <nav className="sidebar-nav">
                    {navItems.filter(item => item.show).map((item) => (
                        <button key={item.path}
                            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                            onClick={() => navigate(item.path)}>
                            <span className="nav-icon">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}

                    {/* Divider */}
                    <div style={{
                        height: 1, background: 'var(--border-color)',
                        margin: '12px 12px', opacity: 0.5
                    }} />

                    {/* Security section — always visible */}
                    <div style={{
                        fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 1.5,
                        color: 'var(--text-muted)', padding: '4px 16px', marginBottom: 2
                    }}>
                        Security
                    </div>
                    <button
                        className={`nav-item ${location.pathname === '/change-password' ? 'active' : ''}`}
                        onClick={() => navigate('/change-password')}>
                        <span className="nav-icon">🔐</span>
                        Change Password
                    </button>
                </nav>

                <div className="sidebar-user">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div>
                            <div className="user-name">{user?.first_name} {user?.last_name}</div>
                            <div className="user-role">{user?.role} · {user?.user_type}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                {user?.employee_code}
                            </div>
                        </div>
                        <button className="theme-toggle" onClick={toggleTheme}
                            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
                            <span className="toggle-icon">
                                {theme === 'dark' ? '💡' : '🌙'}
                            </span>
                        </button>
                    </div>
                    <button className="btn btn-ghost btn-sm logout-btn" onClick={handleLogout}>
                        🚪 Sign Out
                    </button>
                </div>
            </aside>

            <main className="main-content fade-in">
                <Outlet />
            </main>
        </div>
    );
}
