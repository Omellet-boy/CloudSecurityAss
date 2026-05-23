import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import './Login.css';
import './Register.css';

const Register = () => {
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', confirm_password: '',
    batch_year: '', programme: '', phone: '', nric: '', address: ''
  });
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const programmes = [
    'Bachelor of Computer Science (Software Engineering)',
    'Bachelor of Computer Science (Data Science)',
    'Bachelor of Computer Science (Cybersecurity)',
    'Bachelor of Information Technology',
    'Bachelor of Computer Science (Artificial Intelligence)',
    'Bachelor of Software Engineering',
    'Master of Computer Science',
    'Doctor of Philosophy (Computer Science)',
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => 
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!pdpaConsent) {
      return setError('You must agree to the PDPA 2010 Personal Data Consent Statement to register.');
    }
    if (form.password !== form.confirm_password) {
      return setError('Passwords do not match.');
    }
    if (form.password.length < 8) {
      return setError('Password must be at least 8 characters.');
    }
    if (!form.nric.trim()) {
      return setError('NRIC number is required for digital verification.');
    }
    if (!form.address.trim()) {
      return setError('Home address is required.');
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        batch_year: parseInt(form.batch_year),
        programme: form.programme,
        phone: form.phone,
        nric: form.nric,
        address: form.address,
        pdpa_consent: String(pdpaConsent)
      });
      if (res.data.success) {
        setSuccess('Registration successful! Directing to your dashboard...');
        
        // Auto-login on registration
        if (res.data.token && res.data.user) {
          localStorage.setItem('jwt_token', res.data.token);
          localStorage.setItem('user_data', JSON.stringify(res.data.user));
          
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1500);
        } else {
          // Fallback if token wasn't returned
          setTimeout(() => navigate('/login'), 2000);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card register-card">
        <div className="login-header">
          <div className="logo-circle">MMU</div>
          <h1>Create Account</h1>
          <p>Join the MMU Alumni Network</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error   && <div className="error-banner">{error}</div>}
          {success && <div className="success-banner">{success}</div>}

          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input name="full_name" type="text" value={form.full_name}
                onChange={handleChange} placeholder="As per IC" required />
            </div>
            <div className="form-group">
              <label>Batch Year</label>
              <input name="batch_year" type="number" value={form.batch_year}
                onChange={handleChange} placeholder="e.g. 2022" min="1990" max="2030" required />
            </div>
          </div>

          <div className="form-group">
            <label>Programme</label>
            <select name="programme" value={form.programme} onChange={handleChange} required>
              <option value="">Select your programme</option>
              {programmes.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email Address</label>
              <input name="email" type="email" value={form.email}
                onChange={handleChange} placeholder="your@email.com" required />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input name="phone" type="tel" value={form.phone}
                onChange={handleChange} placeholder="e.g. 012-3456789" required />
            </div>
          </div>

          {/* Sensitive Personal Data Inputs */}
          <div className="form-group">
            <label>NRIC / IC Number (Sensitive Personal Data)</label>
            <input name="nric" type="text" value={form.nric}
              onChange={handleChange} placeholder="e.g. 990101-14-1234" required />
            </div>

          <div className="form-group">
            <label>Home Address (Sensitive Personal Data)</label>
            <textarea name="address" value={form.address}
              onChange={handleChange} placeholder="Full home address" 
              rows={2} style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(79, 195, 247, 0.18)',
                borderRadius: '10px',
                padding: '0.85rem 1rem',
                color: '#f0f4ff',
                fontSize: '0.95rem'
              }} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Password</label>
              <input name="password" type="password" value={form.password}
                onChange={handleChange} placeholder="Min. 8 characters" required />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input name="confirm_password" type="password" value={form.confirm_password}
                onChange={handleChange} placeholder="Repeat password" required />
            </div>
          </div>

          {/* PDPA Accordion/Consent Clause */}
          <div className="pdpa-consent-section" style={{
            background: 'rgba(23, 42, 69, 0.5)',
            border: '1px solid rgba(79, 195, 247, 0.15)',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.2rem',
            fontSize: '0.850rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input 
                id="pdpa_consent_checkbox"
                type="checkbox" 
                checked={pdpaConsent} 
                onChange={(e) => setPdpaConsent(e.target.checked)}
                style={{ marginTop: '3px', cursor: 'pointer' }}
                required 
              />
              <label htmlFor="pdpa_consent_checkbox" style={{ color: '#a8b2d1', fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none' }}>
                I hereby declare that I give explicit consent to MMU to collect, process, and store my sensitive personal data (NRIC, home address, and contact) as per Malaysia's <strong>Personal Data Protection Act (PDPA) 2010</strong>.
              </label>
            </div>
            
            <button 
              type="button" 
              onClick={() => setShowNotice(!showNotice)} 
              style={{
                background: 'none',
                border: 'none',
                color: '#4fc3f7',
                fontSize: '0.85rem',
                padding: 0,
                cursor: 'pointer',
                textDecoration: 'underline',
                display: 'block',
                marginTop: '0.2rem'
              }}
            >
              {showNotice ? 'Hide Privacy Notice Summary' : 'View Privacy Notice Summary'}
            </button>

            {showNotice && (
              <div style={{
                marginTop: '0.75rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid rgba(79, 195, 247, 0.1)',
                color: '#8892b0',
                lineHeight: '1.4',
                fontSize: '0.8rem',
                maxHeight: '130px',
                overflowY: 'auto'
              }}>
                <p style={{ marginBottom: '0.5rem' }}><strong>Privacy Notice (PDPA 2010 Compliance):</strong></p>
                <p style={{ marginBottom: '0.5rem' }}>1. <strong>Purpose of Collection:</strong> We collect your identity (NRIC), location (address), and contacts solely for verifying authentication, protecting integrity, and maintaining active communications in our Alumni Portal transaction stream.</p>
                <p style={{ marginBottom: '0.5rem' }}>2. <strong>Security Safeguards:</strong> Your critical identifiers (NRIC and Address) are encrypted directly on the server level using military-grade AES-256-CBC, preventing database compromises from leaking plaintext identity. Phone numbers are masked in all public lists.</p>
                <p style={{ marginBottom: '0.5rem' }}>3. <strong>Your Rights (Access & Correction):</strong> You hold full statutory rights under the PDPA 2010 to view, inspect, edit, or withdraw your processed private records at any moment by visiting your Alumni Settings panel.</p>
              </div>
            )}
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="login-footer">
          <p>Already have an account? <Link to="/login">Sign in here</Link></p>
        </div>
        <div className="security-badge">🔒 AES-256 encrypted · TLS protected · PDPA Compliant</div>
      </div>
    </div>
  );
};

export default Register;
