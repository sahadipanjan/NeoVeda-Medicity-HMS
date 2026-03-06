import { useState, useEffect } from 'react';

/**
 * useTheme — Manages theme state (dark/light) with localStorage persistence.
 * Extracted from Layout.jsx for reusability across components.
 */
export function useTheme() {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('neoveda_theme') || 'dark';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('neoveda_theme', theme);
    }, [theme]);

    const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
    return { theme, toggle };
}
