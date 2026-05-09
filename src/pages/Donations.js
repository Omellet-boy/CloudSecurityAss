import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Donations = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [selectedYear, setSelectedYear] = useState('All');

    const allDonations = [
        { id: 1, date: '2024-03-15', year: '2024', amount: '$150.00', method: 'XXXX-XXXX-1122', status: 'SUCCESS' },
        { id: 2, date: '2025-01-20', year: '2025', amount: '$50.00', method: 'XXXX-XXXX-8844', status: 'SUCCESS' },
        { id: 3, date: '2026-05-09', year: '2026', amount: '$200.00', method: 'XXXX-XXXX-9912', status: 'SUCCESS' },
    ];

    const filteredDonations = selectedYear === 'All' 
        ? allDonations 
        : allDonations.filter(d => d.year === selectedYear);

    return (
        <div className="dashboard-page">
            {/* Sidebar matching the screenshot */}
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
                    <button className="nav-item" onClick={() => navigate('/admin/adminprofile')}>My Profile</button>
                    <button className="nav-item active" onClick={() => navigate('/donations')}>Donation Logs</button>
                    <button className="nav-item" onClick={() => navigate('/admin')}>Admin Logs</button>
                </div>
            </nav>

            <main className="dash-main">
                <header className="dash-header">
                    <h2>Donation History Logs</h2>
                    <span className="header-badge">Row-Level Security (RLS) Active</span>
                </header>

                <div className="content-area">
                    {/* Consistent Security Stats Cards */}
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
                        {/* Dropdown Filter */}
                        <div style={{ padding: '15px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{fontSize: '1rem'}}>Audit Record Table</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <label style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>FILTER BY YEAR:</label>
                                <select 
                                    value={selectedYear} 
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    style={{ background: '#112240', color: 'white', border: '1px solid var(--accent)', borderRadius: '4px', padding: '5px' }}
                                >
                                    <option value="All">All Years</option>
                                    <option value="2024">2024</option>
                                    <option value="2025">2025</option>
                                    <option value="2026">2026</option>
                                </select>
                            </div>
                        </div>

                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Donated On</th>
                                    <th>Amount</th>
                                    <th>Method (Masked)</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDonations.map(donation => (
                                    <tr key={donation.id}>
                                        <td className="mono">{donation.date}</td>
                                        <td className="amount">{donation.amount}</td>
                                        <td className="mono">{donation.method}</td>
                                        <td><span className="badge update">SUCCESS</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Donations;