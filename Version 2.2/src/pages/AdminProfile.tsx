import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './Dashboard.css';

const AdminProfile: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const[newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState('');
    const[error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setFullName(user.full_name || '');
            setEmail(user.email || '');
        }
    }, [user]);

    const handleSave = async () => {
        setMessage('');
        setError('');
        setIsSaving(true);

        try {
            await api.put('/users/update-profile', { full_name: fullName, email: email });

            if (newPassword) {
                await api.put('/users/update-password', { newPassword });
            }

            setMessage('Account settings successfully updated and audited.');
            setNewPassword(''); 
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update settings.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="dashboard-page">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <div className="brand-logo">MMU</div>
                    <div>
                        <div className="brand-title">Admin Portal</div>
                        <div className="brand-sub">Multimedia University</div>
                    </div>
                </div>
                
                <div className="user-card">
                    <div className="user-avatar">{fullName ? fullName.charAt(0).toUpperCase() : 'A'}</div>
                    <div className="user-info">
                        <div className="user-name">{fullName}</div>
                        <div className="user-role">{user?.role?.toUpperCase()}</div>
                    </div>
                </div>
                
                <nav className="sidebar-nav">
                    <button className="nav-item active" onClick={() => navigate('/admin/adminprofile')}>My Profile</button>
                    <button className="nav-item" onClick={() => navigate('/admin/donations')}>Donation Logs</button>
                    <button className="nav-item" onClick={() => navigate('/admin')}>Admin Logs</button>
                </nav>

                <button className="logout-btn" onClick={logout}>Sign Out</button>
            </aside>

            <main className="dash-main">
                <header className="dash-header">
                    <h2>Admin Account Settings</h2>
                </header>

                <div className="content-area">
                    <div className="security-notice" style={{ marginBottom: '20px' }}>
                        <div>
                            <p>You are logged in as an Administrator.</p>
                        </div>
                    </div>

                    <div className="form-card" style={{ maxWidth: '800px' }}>
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                            <div className="user-avatar" style={{width: '80px', height: '80px', fontSize: '2rem'}}>
                                {fullName ? fullName.charAt(0).toUpperCase() : 'A'}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{fullName}</h3>
                                <p style={{ color: 'var(--muted)', margin: '5px 0 0 0' }}>{email}</p>
                                <span className="badge admin" style={{ width: 'fit-content', marginTop: '8px' }}>ADMINISTRATOR</span>
                            </div>
                        </div>

                        {message && <div className="success-banner">{message}</div>}
                        {error && <div className="error-banner">{error}</div>}

                        <div className="form-group">
                            <label>Full Name</label>
                            <input 
                                type="text" 
                                value={fullName} 
                                onChange={(e) => setFullName(e.target.value)} 
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Registered Email</label>
                            <input 
                                type="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                            />
                        </div>

                        <div className="form-group">
                            <label>Service Account Master Key</label>
                            <div className="masked" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <input type="text" readOnly value="AKIA-XXXX-XXXX-8812" style={{ flex: 1, fontFamily: 'monospace', color: 'var(--danger)', cursor: 'not-allowed', opacity: 0.8 }} />
                                <span className="mask-tag">DDM ACTIVE</span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Update Password</label>
                            <input 
                                type="password" 
                                placeholder="Enter new password (min 8 chars)..." 
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>

                        <button 
                            className="submit-btn" 
                            style={{ marginTop: '20px' }} 
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? 'Updating Securely...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminProfile;
