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

// Secure Route Wrapper (Enforces login requirement)
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user } = useAuth();

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
