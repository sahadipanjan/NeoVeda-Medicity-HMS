import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [employeeCode, setEmployeeCode] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login, loading, error } = useAuth();
    const navigate = useNavigate();

    // Theme toggle for login page
    const [theme, setTheme] = useState(() => localStorage.getItem('neoveda_theme') || 'dark');
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('neoveda_theme', theme);
    }, [theme]);
    const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!employeeCode.trim() || !password.trim()) return;
        const result = await login(employeeCode.trim(), password);
        if (result.success) navigate('/', { replace: true });
    };

    return (
        <div className="login-container">
            {/* Theme toggle floating in top-right */}
            <button className="theme-toggle" onClick={toggleTheme}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                style={{ position: 'absolute', top: 24, right: 24, zIndex: 10 }}>
                <span className="toggle-icon">
                    {theme === 'dark' ? '💡' : '🌙'}
                </span>
            </button>

            <div className="login-card slide-up">
                <div className="login-logo">
                    <img src="/assets/neoveda-logo.png" alt="NeoVeda Medicity"
                        style={{ width: 280, height: 'auto', marginBottom: 16 }} />
                </div>

                {error && <div className="login-error">⚠️ {error}</div>}

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="employee-code">Employee Code</label>
                        <input id="employee-code" className="form-input" type="text"
                            placeholder="EMP-CARD-00001" value={employeeCode}
                            onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                            autoFocus required autoComplete="username" />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input id="password" className="form-input"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your password" value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required autoComplete="current-password" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem'
                                }}>
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary login-btn"
                        disabled={loading || !employeeCode.trim() || !password.trim()}>
                        {loading ? (
                            <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span> Authenticating...</>
                        ) : (<>🔐 Sign In with Employee Code</>)}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <p>Authorized personnel only</p>
                    <p style={{ marginTop: 4 }}>Contact IT Admin for credential issues</p>
                </div>
            </div>
        </div>
    );
}
