import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './Dashboard.css';

interface Donation {
    donation_id: number;
    receipt_ref: string;
    amount: number;
    donated_at: string;
    message: string;
    alumni_id: number; // Added for Admin oversight
}

const AdminDonations: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState('All');

    useEffect(() => {
        const fetchDonations = async () => {
            try {
                const response = await api.get('/donations');
                if (response.data.success) {
                    setDonations(response.data.data);
                }
            } catch (error) {
                console.error("Failed to fetch donations", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDonations();
    }, []);

    const filteredDonations = selectedYear === 'All' 
        ? donations 
        : donations.filter(d => new Date(d.donated_at).getFullYear().toString() === selectedYear);

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
                    <div className="user-avatar">{user?.full_name?.charAt(0)}</div>
                    <div className="user-info">
                        <div className="user-name">{user?.full_name}</div>
                        <div className="user-role">ADMIN</div>
                    </div>
                </div>
                
                <div className="sidebar-nav">
                    <button className="nav-item" onClick={() => navigate('/admin/adminprofile')}>My Profile</button>
                    <button className="nav-item active" onClick={() => navigate('/admin/donations')}>Donation Logs</button>
                    <button className="nav-item" onClick={() => navigate('/admin')}>Admin Logs</button>
                </div>

                <button className="logout-btn" onClick={logout} style={{ marginTop: 'auto' }}>
                    <span>🚪</span> Sign Out
                </button>
            </nav>
            

            <main className="dash-main">
                <header className="dash-header">
                    <h2>Global Donation Logs</h2>
                    <div className="header-badge">Privileged Access Level: 4</div>
                </header>

                <div className="content-area">
                    {/* TASK 5 EVIDENCE: SECURITY STATUS CARD */}
                    <div className="security-notice" style={{marginBottom: '20px', borderLeft: '5px solid var(--gold)'}}>
                        <div className="notice-icon">🛡️</div>
                        <div>
                            <p>This view bypasses standard Row-Level Security filters. Access is logged via SQL Server Audit and authenticated using a <strong>Managed Service Account (MSA)</strong> to protect database-tier credentials.</p>
                        </div>
                    </div>

                    <div className="table-wrapper">
                        <div style={{ padding: '15px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{fontSize: '0.9rem', color: 'var(--accent)'}}>GLOBAL TRANSACTION AUDIT</h3>
                            
                            <div className="form-group" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <label style={{ fontSize: '0.75rem' }}>FILTER BY YEAR:</label>
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
                                    <th>Receipt Ref</th>
                                    <th>Alumni ID</th>
                                    <th>Amount (MYR)</th>
                                    <th>Donated On</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={5} className="no-data">Accessing Secure Data Tier...</td></tr>
                                ) : filteredDonations.length === 0 ? (
                                    <tr><td colSpan={5} className="no-data">No records found for {selectedYear}</td></tr>
                                ) : (
                                    filteredDonations.map((d) => (
                                        <tr key={d.donation_id}>
                                            <td className="mono">{d.receipt_ref}</td>
                                            <td className="mono">{d.alumni_id}</td>
                                            <td className="amount">RM {Number(d.amount).toFixed(2)}</td>
                                            <td>{new Date(d.donated_at).toLocaleDateString()}</td>
                                            <td><span className="badge update">SECURED</span></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDonations;