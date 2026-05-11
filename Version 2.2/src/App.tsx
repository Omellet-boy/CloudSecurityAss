/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';


// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import AlumniDashboard from './pages/AlumniDashboard';
import Directory from './pages/Directory';
import AdminDashboard from './pages/AdminDashboard'; 
import AdminProfile from './pages/AdminProfile';     
import AdminDonations from './pages/AdminDonations';


// Secure Route Wrapper (Enforces login requirement)
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="dash-loading" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a1628', color: 'white' }}>
        <div className="spinner"></div>
        <p style={{ marginLeft: '15px' }}>Verifying Security Context...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check RBAC (Role-Based Access Control)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />; // or an unauthorized page
  }

  return children as React.ReactElement;
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes (Alumni Only) */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['alumni']}>
                <AlumniDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Protected Routes (Alumni Only) */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['alumni']}>
                <AlumniDashboard />
              </ProtectedRoute>
            } 
          />

          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route 
            path="/admin/donations" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDonations />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/adminprofile" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminProfile />
              </ProtectedRoute>
            } 
          />
          
          {/* Add the Directory Route Here */}
          <Route 
            path="/directory" 
            element={
              <ProtectedRoute allowedRoles={['alumni', 'admin']}>
                <Directory />
              </ProtectedRoute>
            } 
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
