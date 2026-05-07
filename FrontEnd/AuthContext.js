// frontend/src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  /*const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); */

  const [user, setUser] = useState({ 
  alumni_id: 1, 
  full_name: "Lil Nigma", 
  email: "ling@student.mmu.edu.my", 
  role: "alumni" 
});
const [loading, setLoading] = useState(false);

  // Check if user is already logged in on page load
  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  // Login Function
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { token, user: userData } = res.data;
      
      // Store JWT token and session data
      localStorage.setItem('jwt_token', token);
      localStorage.setItem('user_data', JSON.stringify(userData));
      setUser(userData);
      
      return userData; // Return user to route based on role ('alumni' vs 'admin')
    }
  };

  // Logout Function
  const logout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_data');
    setUser(null);
    window.location.href = '/login';
  };

  if (loading) {
    return <div className="dash-loading"><div className="spinner"></div></div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);