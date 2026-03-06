import React, { createContext, useContext, useState, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('neoveda_user');
        return saved ? JSON.parse(saved) : null;
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const login = useCallback(async (employeeCode, password) => {
        setLoading(true);
        setError(null);
        try {
            const res = await authAPI.login(employeeCode, password);
            const userData = res.data.user;
            setUser(userData);
            localStorage.setItem('neoveda_user', JSON.stringify(userData));
            return { success: true, mustChangePassword: res.data.mustChangePassword };
        } catch (err) {
            setError(err.message || 'Login failed');
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        try { await authAPI.logout(); } catch { }
        setUser(null);
        localStorage.removeItem('neoveda_user');
    }, []);

    const value = { user, loading, error, login, logout, isAuthenticated: !!user };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
