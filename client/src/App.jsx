import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { useAuth } from './context/AuthContext';
import RoleGuard, { useEffectiveRole } from './components/RoleGuard';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DepartmentDashboard from './pages/DepartmentDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import ClinicalNotes from './pages/ClinicalNotes';
import Patients from './pages/Patients';
import Doctors from './pages/Doctors';
import Appointments from './pages/Appointments';
import Wards from './pages/Wards';
import Billing from './pages/Billing';
import Admin from './pages/Admin';
import TPA from './pages/TPA';
import ChangePassword from './pages/ChangePassword';

function ProtectedRoute({ children }) {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? children : <Navigate to="/login" replace />;
}

/**
 * SmartDashboard — renders role-specific dashboards:
 *   Super/Hospital → global Dashboard
 *   Doctor         → personal DoctorDashboard
 *   Accounts       → redirect to Billing
 *   Others         → department-scoped DepartmentDashboard
 */
function SmartDashboard() {
    const { user } = useAuth();
    const effectiveRole = useEffectiveRole();

    if (effectiveRole === 'Super' || effectiveRole === 'Hospital') {
        return <Dashboard />;
    }

    if (effectiveRole === 'Doctor') {
        return <DoctorDashboard />;
    }

    if (effectiveRole === 'Accounts/Finance') {
        return <Navigate to="/billing" replace />;
    }

    if (user?.department_id) {
        return <DepartmentDashboard />;
    }

    return <Dashboard />;
}

const BILLING_ROLES = ['Super', 'Hospital', 'Accounts/Finance', 'Receptionist'];
const TPA_ROLES = ['Super', 'Hospital', 'Accounts/Finance', 'Receptionist'];
/** Roles that see the global patient/appointment/ward/doctor listings */
const CLINICAL_ROLES = ['Super', 'Hospital', 'Department', 'Nurse', 'Receptionist', 'Technician', 'Lab Technician', 'Pharmacist', 'Ward Boy'];
/** Doctor-only routes */
const DOCTOR_EMR_ROLES = ['Super', 'Hospital', 'Department', 'Doctor'];

export default function App() {
    const { isAuthenticated } = useAuth();

    return (
        <>
            <Routes>
                <Route path="/login" element={
                    isAuthenticated ? <Navigate to="/" replace /> : <Login />
                } />
                <Route path="/" element={
                    <ProtectedRoute><Layout /></ProtectedRoute>
                }>
                    <Route index element={<SmartDashboard />} />
                    <Route path="patients" element={
                        <RoleGuard allowedRoles={CLINICAL_ROLES}><Patients /></RoleGuard>
                    } />
                    <Route path="doctors" element={
                        <RoleGuard allowedRoles={[...CLINICAL_ROLES, 'Doctor']}><Doctors /></RoleGuard>
                    } />
                    <Route path="appointments" element={
                        <RoleGuard allowedRoles={[...CLINICAL_ROLES, 'Doctor']}><Appointments /></RoleGuard>
                    } />
                    <Route path="wards" element={
                        <RoleGuard allowedRoles={CLINICAL_ROLES}><Wards /></RoleGuard>
                    } />
                    <Route path="billing" element={
                        <RoleGuard allowedRoles={BILLING_ROLES}><Billing /></RoleGuard>
                    } />
                    <Route path="tpa" element={
                        <RoleGuard allowedRoles={TPA_ROLES}><TPA /></RoleGuard>
                    } />
                    <Route path="admin" element={
                        <RoleGuard allowedRoles={['Super']}><Admin /></RoleGuard>
                    } />
                    <Route path="emr" element={
                        <RoleGuard allowedRoles={DOCTOR_EMR_ROLES}><ClinicalNotes /></RoleGuard>
                    } />
                    <Route path="change-password" element={<ChangePassword />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <SpeedInsights />
        </>
    );
}

