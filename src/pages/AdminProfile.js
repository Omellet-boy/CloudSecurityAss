import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const AdminProfile = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="dashboard-page">
            <nav className="sidebar">
                <div className="sidebar-brand">
                    <div className="brand-logo">MMU</div>
                    <div>
                        <div className="brand-title">Admin Portal</div>
                        <div className="brand-sub">Multimedia University</div>
                    </div>
                </div>
                <div className="sidebar-nav">
                    <button className="nav-item active" onClick={() => navigate('/admin/adminprofile')}>My Profile</button>
                    <button className="nav-item" onClick={() => navigate('/donations')}>Donation Logs</button>
                    <button className="nav-item" onClick={() => navigate('/admin')}>Admin Logs</button>
                </div>
            </nav>

            <main className="dash-main">
                <header className="dash-header">
                    <h2>Admin Account Settings</h2>
                    <button className="submit-btn" style={{width: 'auto'}}>Save Changes</button>
                </header>

                <div className="content-area">
                    <div className="form-card" style={{ maxWidth: '800px' }}>
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                            <div className="user-avatar" style={{width: '80px', height: '80px', fontSize: '2rem'}}>
                                {user?.full_name ? user.full_name[0] : 'A'}
                            </div>
                            <div>
                                <h3>{user?.full_name}</h3>
                                <p style={{color: 'var(--muted)'}}>{user?.email} - Administrator</p>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Full Name</label>
                            <input type="text" defaultValue={user?.full_name} />
                        </div>

                        {/* EVIDENCE FOR TASK 5: DYNAMIC DATA MASKING */}
                        <div className="form-group">
                            <label>Admin Access Key (Masked - Lecture 3)</label>
                            <div className="masked">
                                <input type="text" readOnly value="AKIA-XXXX-XXXX-9912" />
                                <span className="mask-tag">DDM ACTIVE</span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Change Password</label>
                            <input type="password" placeholder=".........." />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminProfile;