import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import './Login.css';
import './Register.css';

const Register = () => {
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', confirm_password: '',
    batch_year: '', programme: '', phone: ''
  });
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => 
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (form.password !== form.confirm_password) {
      return setError('Passwords do not match.');
    }
    if (form.password.length < 8) {
      return setError('Password must be at least 8 characters.');
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        batch_year: parseInt(form.batch_year),
        programme: form.programme,
        phone: form.phone
      });
      if (res.data.success) {
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed.');
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

          <div className="form-group">
            <label>Email Address</label>
            <input name="email" type="email" value={form.email}
              onChange={handleChange} placeholder="your@email.com" required />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input name="phone" type="tel" value={form.phone}
              onChange={handleChange} placeholder="e.g. 012-3456789" />
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

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="login-footer">
          <p>Already have an account? <Link to="/login">Sign in here</Link></p>
        </div>
        <div className="security-badge">🔒 Passwords hashed with bcrypt · Data encrypted at rest</div>
      </div>
    </div>
  );
};

export default Register;
