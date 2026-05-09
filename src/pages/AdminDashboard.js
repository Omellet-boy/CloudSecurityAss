import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const AdminDashboard = () => {
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
                
                <div className="user-card">
                    <div className="user-avatar">{user?.full_name ? user.full_name[0] : 'A'}</div>
                    <div>
                        <div className="user-name">{user?.full_name}</div>
                        <div className="user-role">{user?.role}</div>
                    </div>
                </div>
                
                <div className="sidebar-nav">
                    {/* FIXED PATH HERE */}
                    <button className="nav-item" onClick={() => navigate('/admin/adminprofile')}>My Profile</button>
                    <button className="nav-item" onClick={() => navigate('/donations')}>Donation Logs</button>
                    <button className="nav-item active" onClick={() => navigate('/admin')}>Admin Logs</button>
                </div>
            </nav>

            <main className="dash-main">
                <header className="dash-header">
                    <h2>Admin Security Control Panel</h2>
                    <span className="header-badge">Security Level: High</span>
                </header>

                <div className="content-area">
                    <div className="stats-grid">
                        <div className="stat-card blue">
                            <div className="stat-label">Service Account</div>
                            <div className="stat-value" style={{fontSize: '1rem'}}>MSA-Active</div>
                        </div>
                        <div className="stat-card green">
                            <div className="stat-label">Encryption</div>
                            <div className="stat-value" style={{fontSize: '1rem'}}>TDE-Enabled</div>
                        </div>
                    </div>

                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>User</th>
                                    <th>Action</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>2026-05-09 10:15</td>
                                    <td>unknown_attacker</td>
                                    <td>BRUTE_FORCE_ATTEMPT</td>
                                    <td><span className="badge delete">BLOCKED</span></td>
                                </tr>
                                <tr>
                                    <td>2026-05-09 11:30</td>
                                    <td>{user?.full_name}</td>
                                    <td>SYSTEM_CONFIG_CHANGE</td>
                                    <td><span className="badge update">SUCCESS</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;