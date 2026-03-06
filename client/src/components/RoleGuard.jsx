/**
 * RoleGuard — Route-level RBAC enforcement component.
 *
 * Wraps children and only renders them if the authenticated user's
 * effective role matches one of the allowedRoles.
 * Otherwise redirects to the home page.
 *
 * Normalizes role aliases: 'Super Admin' → 'Super'
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function getEffectiveRole(user) {
    if (!user) return null;
    const { user_type, role } = user;

    if (user_type === 'Admin') {
        // Normalize 'Super Admin' → 'Super'
        if (role === 'Super Admin' || role === 'Super') return 'Super';
        return role; // 'Hospital', 'Department'
    }
    if (user_type === 'Doctor') return 'Doctor';
    if (user_type === 'Staff') return role; // 'Nurse', 'Receptionist', 'Accounts/Finance', etc.
    return role;
}

export function useEffectiveRole() {
    const { user } = useAuth();
    return getEffectiveRole(user);
}

export default function RoleGuard({ allowedRoles, children }) {
    const { user } = useAuth();
    const effectiveRole = getEffectiveRole(user);

    if (!effectiveRole || !allowedRoles.includes(effectiveRole)) {
        return <Navigate to="/" replace />;
    }

    return children;
}
