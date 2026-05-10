import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import './Dashboard.css';

interface Profile {
  full_name: string;
  email: string;
  phone: string;
  programme: string;
  batch_year: number;
  last_login: string;
  alumni_id: number;
}

interface Donation {
  donation_id: number;
  receipt_ref: string;
  amount: number;
  donated_at: string;
  message: string;
}

const AlumniDashboard = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile]     = useState<Profile | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading]     = useState(true);
  const [donateForm, setDonateForm] = useState({ amount: '', message: '' });
  const [donateMsg, setDonateMsg]   = useState('');
  const [donateErr, setDonateErr]   = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profRes, donRes] = await Promise.all([
        api.get(`/alumni/${user?.alumni_id}`),
        api.get('/donations')
      ]);
      setProfile(profRes.data.data);
      setDonations(donRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    setDonateMsg(''); setDonateErr('');
    try {
      const res = await api.post('/donations', donateForm);
      if (res.data.success) {
        setDonateMsg(`✅ Donation successful! Receipt: ${res.data.receipt_ref}`);
        setDonateForm({ amount: '', message: '' });
        fetchData();
      }
    } catch (err: any) {
      setDonateErr(err.response?.data?.message || 'Donation failed.');
    }
  };

  if (loading) return (
    <div className="dash-loading">
      <div className="spinner"></div>
      <p>Loading your dashboard...</p>
    </div>
  );

  return (
    <div className="dashboard-page">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">MMU</div>
          <div>
            <div className="brand-title">Alumni Portal</div>
            <div className="brand-sub">Multimedia University</div>
          </div>
        </div>

        <div className="user-card">
          <div className="user-avatar">{user?.full_name?.charAt(0).toUpperCase()}</div>
          <div className="user-info">
            <div className="user-name">{user?.full_name}</div>
            <div className="user-role">Alumni</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
            <span className="nav-icon">👤</span> <span>My Profile</span>
          </button>
          <button className={`nav-item ${activeTab === 'donations' ? 'active' : ''}`} onClick={() => setActiveTab('donations')}>
            <span className="nav-icon">💰</span> <span>Donations</span>
          </button>
          <button className={`nav-item ${activeTab === 'donate' ? 'active' : ''}`} onClick={() => setActiveTab('donate')}>
            <span className="nav-icon">🎁</span> <span>Make Donation</span>
          </button>
        </nav>

        <button className="logout-btn" onClick={logout}>
          <span>🚪</span> Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="dash-main">
        <header className="dash-header">
          <h2>{activeTab === 'profile' ? 'My Profile' : activeTab === 'donations' ? 'My Donations' : 'Make a Donation'}</h2>
          <div className="header-badge">🔒 Secure Session</div>
        </header>

        {/* Profile Tab */}
        {activeTab === 'profile' && profile && (
          <div className="content-area">
            <div className="profile-grid">
              <div className="info-card">
                <h3>Personal Information</h3>
                <div className="info-rows">
                  <div className="info-row"><span className="info-label">Full Name</span><span className="info-val">{profile.full_name}</span></div>
                  <div className="info-row"><span className="info-label">Email</span><span className="info-val">{profile.email}</span></div>
                  <div className="info-row"><span className="info-label">Phone</span><span className="info-val masked">{profile.phone || 'XXX-XXX-****'} <span className="mask-tag">Masked</span></span></div>
                </div>
              </div>

              <div className="info-card">
                <h3>Academic Information</h3>
                <div className="info-rows">
                  <div className="info-row"><span className="info-label">Programme</span><span className="info-val">{profile.programme}</span></div>
                  <div className="info-row"><span className="info-label">Batch Year</span><span className="info-val">{profile.batch_year}</span></div>
                  <div className="info-row"><span className="info-label">Last Login</span><span className="info-val">{profile.last_login ? new Date(profile.last_login).toLocaleString() : 'N/A'}</span></div>
                </div>
              </div>

              <div className="security-notice">
                <div className="notice-icon">🛡️</div>
                <div>
                  <strong>Data Privacy Notice</strong>
                  <p>Your NRIC and home address are encrypted using AES-256. Your phone number is partially masked for non-admin viewers in compliance with PDPA 2010.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Donations History Tab */}
        {activeTab === 'donations' && (
          <div className="content-area">
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Receipt Ref</th>
                    <th>Amount (MYR)</th>
                    <th>Date</th>
                    <th>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.length === 0 ? (
                    <tr><td colSpan={4} className="no-data">No donations yet.</td></tr>
                  ) : donations.map(d => (
                    <tr key={d.donation_id}>
                      <td className="mono">{d.receipt_ref}</td>
                      <td className="amount">RM {Number(d.amount).toFixed(2)}</td>
                      <td>{new Date(d.donated_at).toLocaleDateString()}</td>
                      <td>{d.message || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="table-footer">Total: {donations.length} donation(s)</div>
            </div>
          </div>
        )}

        {/* Make Donation Tab */}
        {activeTab === 'donate' && (
          <div className="content-area">
            <div className="form-card">
              <h3>Make a Donation</h3>
              <p className="form-desc">Your donation supports MMU students and campus development. All transactions are securely recorded.</p>

              {donateMsg && <div className="success-banner">{donateMsg}</div>}
              {donateErr && <div className="error-banner">{donateErr}</div>}

              <form onSubmit={handleDonate} className="donate-form">
                <div className="form-group">
                  <label>Donation Amount (MYR)</label>
                  <input type="number" min="1" step="0.01"
                    value={donateForm.amount}
                    onChange={e => setDonateForm({ ...donateForm, amount: e.target.value })}
                    placeholder="e.g. 50.00" required />
                </div>
                <div className="quick-amounts">
                  {[10, 50, 100, 500].map(amt => (
                    <button type="button" key={amt}
                      className={`quick-btn ${donateForm.amount === amt.toString() ? 'active' : ''}`}
                      onClick={() => setDonateForm({ ...donateForm, amount: amt.toString() })}>
                      RM {amt}
                    </button>
                  ))}
                </div>
                <div className="form-group">
                  <label>Message (Optional)</label>
                  <textarea
                    value={donateForm.message}
                    onChange={e => setDonateForm({ ...donateForm, message: e.target.value })}
                    placeholder="Leave a message for the university..."
                    rows={3} />
                </div>
                <button type="submit" className="submit-btn">💳 Confirm Donation</button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AlumniDashboard;
