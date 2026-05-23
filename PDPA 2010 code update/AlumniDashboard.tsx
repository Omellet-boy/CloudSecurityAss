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
  nric?: string;
  address?: string;
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
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // PDPA Data Corrections state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '', email: '', phone: '', nric: '', address: ''
  });
  
  // Security Crud/Credential state
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passForm, setPassForm] = useState({ newPassword: '', confirmPassword: '' });

  // Status banners
  const [editSuccess, setEditSuccess] = useState('');
  const [editError, setEditError] = useState('');

  // Donation state
  const [donateForm, setDonateForm] = useState({ amount: '', message: '' });
  const [donateMsg, setDonateMsg]   = useState('');
  const [donateErr, setDonateErr]   = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const [profRes, donRes] = await Promise.all([
        api.get(`/alumni/${user?.alumni_id}`),
        api.get('/donations')
      ]);
      setProfile(profRes.data.data);
      setDonations(donRes.data.data);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 404) {
        setFetchError("Your profile was not found on the server. Since the Alumni Portal is currently running in Fallback Mode (due to the local MS SQL Server database being offline/unreachable from our cloud container), any in-memory registration arrays are reset whenever the server compiles or restarts.");
      } else {
        setFetchError("Unable to retrieve profile data from the remote server. Please verify connections.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = () => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        nric: profile.nric || '',
        address: profile.address || ''
      });
      setEditSuccess('');
      setEditError('');
      setIsChangingPass(false);
      setIsEditing(true);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditSuccess(''); setEditError('');
    try {
      const res = await api.put('/users/update-profile', editForm);
      if (res.data.success) {
        setEditSuccess('✅ Profile updated and encrypted in compliance with PDPA 2010!');
        setIsEditing(false);
        fetchData();
        // Update browser localStorage cache so sidebar changes simultaneously
        const cachedUser = localStorage.getItem('user_data');
        if (cachedUser) {
          const uObj = JSON.parse(cachedUser);
          uObj.full_name = editForm.full_name;
          uObj.email = editForm.email;
          localStorage.setItem('user_data', JSON.stringify(uObj));
        }
      }
    } catch (err: any) {
      setEditError(err.response?.data?.message || 'Failed to update credentials.');
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditSuccess(''); setEditError('');
    if (passForm.newPassword.length < 8) {
      return setEditError('Password must be at least 8 characters.');
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      return setEditError('New passwords do not match.');
    }
    try {
      const res = await api.put('/users/update-password', { newPassword: passForm.newPassword });
      if (res.data.success) {
        setEditSuccess('✅ Password rotated and hashed successfully!');
        setPassForm({ newPassword: '', confirmPassword: '' });
        setIsChangingPass(false);
      }
    } catch (err: any) {
      setEditError(err.response?.data?.message || 'Failed to update credentials.');
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
          <div className="user-avatar">{profile?.full_name?.charAt(0).toUpperCase() || user?.full_name?.charAt(0).toUpperCase()}</div>
          <div className="user-info">
            <div className="user-name">{profile?.full_name || user?.full_name}</div>
            <div className="user-role">Alumni</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => { setActiveTab('profile'); setIsEditing(false); setIsChangingPass(false); }}>
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
        {activeTab === 'profile' && (
          <div className="content-area">
            {fetchError ? (
              <div className="error-card" style={{ padding: '2.5rem', background: 'rgba(255, 23, 23, 0.05)', borderRadius: '12px', border: '1px solid rgba(255, 23, 23, 0.25)', maxWidth: '650px', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <h3 style={{ margin: 0, color: '#ff5252', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>⚠️ Session Or Connection Offline</h3>
                <p style={{ margin: 0, color: '#cbd5e1', lineHeight: '1.6' }}>
                  {fetchError}
                </p>
                <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', borderLeft: '3px solid #ff5252' }}>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.5' }}>
                    <strong>Why is this happening?</strong> The Web Live Preview is running inside a Google Cloud container, which cannot connect to a private local IP address (like <code>192.168.100.38</code>) on your local machine or VM. The server gracefully uses the in-memory array fallback, but on compilations/server restarts, the cache resets!
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button onClick={logout} className="submit-btn" style={{ padding: '0.6rem 1.2rem', background: '#ff5252', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', maxWidth: '150px' }}>🚪 Logout & Register</button>
                  <button onClick={fetchData} className="quick-btn" style={{ padding: '0.6rem 1.2rem', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid currentColor', borderRadius: '6px', cursor: 'pointer' }}>🔄 Retry Fetch</button>
                </div>
              </div>
            ) : profile ? (
              <>
                {editSuccess && <div className="success-banner" style={{ margin: '1rem 0' }}>{editSuccess}</div>}
                {editError && <div className="error-banner" style={{ margin: '1rem 0' }}>{editError}</div>}

                {!isEditing && !isChangingPass ? (
                  <div className="profile-grid">
                    <div className="info-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0 }}>Personal Information</h3>
                        <button onClick={handleStartEdit} className="quick-btn" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', background: 'rgba(79, 195, 247, 0.12)', border: '1px solid currentColor' }}>
                          ✍️ Correct Personal Details
                        </button>
                      </div>
                      <div className="info-rows flex flex-col gap-2">
                        <div className="info-row"><span className="info-label text-sm text-slate-400">Full Name</span><span className="info-val text-slate-200">{profile.full_name}</span></div>
                        <div className="info-row"><span className="info-label text-sm text-slate-400">Email</span><span className="info-val text-slate-200">{profile.email}</span></div>
                        <div className="info-row"><span className="info-label text-sm text-slate-400">Phone</span><span className="info-val text-slate-200">{profile.phone || 'N/A'}</span></div>
                        
                        {/* Secure decrypted sensitive fields with compliance flags */}
                        <div className="info-row">
                          <span className="info-label text-sm text-slate-400">NRIC Number</span>
                          <span className="info-val text-slate-200" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {profile.nric || 'Not provided'}
                            <span className="mask-tag" style={{ background: '#4fc3f7', color: '#112240', borderRadius: '4px', fontSize: '0.65rem', padding: '2px 5px', fontWeight: 'bold' }}>AES-256 Decrypted</span>
                          </span>
                        </div>
                        <div className="info-row">
                          <span className="info-label text-sm text-slate-400">Home Address</span>
                          <span className="info-val text-slate-200" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', whiteSpace: 'pre-line' }}>
                            {profile.address || 'Not provided'}
                            <span className="mask-tag" style={{ background: '#4fc3f7', color: '#112240', borderRadius: '4px', fontSize: '0.65rem', padding: '2px 5px', fontWeight: 'bold' }}>AES-256 Decrypted</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="info-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0 }}>Academic & Security</h3>
                        <button onClick={() => { setIsChangingPass(true); setEditSuccess(''); setEditError(''); }} className="quick-btn" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', background: 'rgba(79, 195, 247, 0.12)', border: '1px solid currentColor' }}>
                          🔑 Rotate Password
                        </button>
                      </div>
                      <div className="info-rows flex flex-col gap-2">
                        <div className="info-row"><span className="info-label text-sm text-slate-400">Programme</span><span className="info-val text-slate-200">{profile.programme}</span></div>
                        <div className="info-row"><span className="info-label text-sm text-slate-400">Batch Year</span><span className="info-val text-slate-200">{profile.batch_year}</span></div>
                        <div className="info-row"><span className="info-label text-sm text-slate-400">Last Login</span><span className="info-val text-slate-200">{profile.last_login ? new Date(profile.last_login).toLocaleString() : 'N/A'}</span></div>
                      </div>
                    </div>

                    <div className="security-notice">
                      <div className="notice-icon">🛡️</div>
                      <div>
                        <strong>Data Statutory Integrity (PDPA 2010 Compliance)</strong>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#8892b0' }}>
                          In strict compliance with <strong>Section 30 (Access Right)</strong> and <strong>Section 34 (Correction Right)</strong> of Malaysia's Personal Data Protection Act 2010, you can review, correct, or restrict your personal parameters (NRIC, home address, contact details) stored in our records at any time.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : isEditing ? (
                  /* Inline PDPA Correction Form (Section 34 Right of Correction) */
                  <div className="form-card" style={{ maxWidth: '650px' }}>
                    <h3 style={{ marginTop: 0 }}>Correct Personal Information</h3>
                    <p className="form-desc" style={{ marginBottom: '1.5rem' }}>Update your registered parameters. Your updated NRIC and home address will be re-encrypted immediately using AES-256 before disk commit.</p>
                    
                    <form onSubmit={handleSaveProfile} className="donate-form">
                      <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label>Full Name</label>
                        <input type="text" value={editForm.full_name} 
                          onChange={e => setEditForm({...editForm, full_name: e.target.value})} required />
                      </div>
                      
                      <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="form-group">
                          <label>Email Address</label>
                          <input type="email" value={editForm.email} 
                            onChange={e => setEditForm({...editForm, email: e.target.value})} required />
                        </div>
                        <div className="form-group">
                          <label>Phone Number</label>
                          <input type="tel" value={editForm.phone} 
                            onChange={e => setEditForm({...editForm, phone: e.target.value})} required />
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label>NRIC / IC Number</label>
                        <input type="text" value={editForm.nric} 
                          onChange={e => setEditForm({...editForm, nric: e.target.value})} required />
                      </div>

                      <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                        <label>Home Address</label>
                        <textarea value={editForm.address} 
                          onChange={e => setEditForm({...editForm, address: e.target.value})} rows={3} required />
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button type="submit" className="submit-btn" style={{ flex: 1 }}>💾 Save Changes & Re-Encrypt</button>
                        <button type="button" className="quick-btn" onClick={() => setIsEditing(false)} style={{ background: 'rgba(255,255,255,0.05)', flex: 0.3 }}>Cancel</button>
                      </div>
                    </form>
                  </div>
                ) : (
                  /* Rotate Password Form */
                  <div className="form-card" style={{ maxWidth: '500px' }}>
                    <h3 style={{ marginTop: 0 }}>Rotate Login Credentials</h3>
                    <p className="form-desc" style={{ marginBottom: '1.5rem' }}>Choose an extremely secure password (minimum 8 characters) to safeguard your privacy rights.</p>
                    
                    <form onSubmit={handleSavePassword} className="donate-form">
                      <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label>New Password</label>
                        <input type="password" placeholder="Min. 8 characters" value={passForm.newPassword} 
                          onChange={e => setPassForm({...passForm, newPassword: e.target.value})} required />
                      </div>

                      <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                        <label>Confirm New Password</label>
                        <input type="password" placeholder="Repeat new password" value={passForm.confirmPassword} 
                          onChange={e => setPassForm({...passForm, confirmPassword: e.target.value})} required />
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button type="submit" className="submit-btn" style={{ flex: 1 }}>🔑 Update Account Password</button>
                        <button type="button" className="quick-btn" onClick={() => setIsChangingPass(false)} style={{ background: 'rgba(255,255,255,0.05)', flex: 0.3 }}>Cancel</button>
                      </div>
                    </form>
                  </div>
                )}
              </>
            ) : null}
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
