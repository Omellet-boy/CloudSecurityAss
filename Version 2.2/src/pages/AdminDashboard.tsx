import React, {useEffect, useState} from 'react';
import {useAuth} from '../context/AuthContext';
import {useNavigate} from 'react-router-dom';
import api from '../api'; 
import './Dashboard.css';

interface AuditLog{
    log_id: number;
    action_type: string;
    table_name: string;
    changed_at: string;
    user_email: string;
    ip_address: string;
}

const AdminDashboard: React.FC = () =>{
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(true);

    useEffect(() => {
        const fetchLogs = async () =>{
            try {
                const response = await api.get('/admin/logs');
                if (response.data.success) {
                    setLogs(response.data.data);
                }
            } catch (error) {
                console.error("Failed to fetch audit logs", error);
            } finally {
                setLoadingLogs(false);
            }
        };

        fetchLogs();
    },[]);

return(
        <div className="dashboard-page">
            {/* Sidebar */}
            <nav className="sidebar">
                <div className="sidebar-brand">
                    <div className="brand-logo">MMU</div>
                    <div>
                        <div className="brand-title">Admin Portal</div>
                        <div className="brand-sub">Multimedia University</div>
                    </div>
                </div>
                
                <div className="user-card">
                    <div className="user-avatar">{user?.full_name?.charAt(0).toUpperCase()}</div>
                    <div className="user-info">
                        <div className="user-name">{user?.full_name}</div>
                        <div className="user-role">{user?.role?.toUpperCase()}</div>
                    </div>
                </div>
                
                <div className="sidebar-nav">
                    <button className="nav-item" onClick={() => navigate('/admin/adminprofile')}>My Profile</button>
                    <button className="nav-item" onClick={() => navigate('/admin/donations')}>Donation Logs</button>
                    <button className="nav-item active" onClick={() => navigate('/admin')}>Admin Logs</button>
                </div>

                <button className="logout-btn" onClick={logout} style={{marginTop: 'auto'}}>Sign Out</button>
            </nav>

            <main className="dash-main">
                <header className="dash-header">
                    <h2>Admin Security Control Panel</h2>
                </header>

                <div className="content-area">
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '25px'}}>
                        
                        <div className="stat-card" style={{ borderLeft: '4px solid #4fc3f7', background: 'rgba(30, 58, 95, 0.4)'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                <div>
                                    <div className="stat-label">Logic Tier Authentication</div>
                                    <div className="stat-value" style={{ fontSize: '1.2rem', marginTop: '5px'}}>MSA-Active</div>
                                    <div style={{fontSize: '0.75rem', color: 'var(--muted)', marginTop: '8px'}}>
                                        Connecting via Managed Service Account
                                    </div>
                                </div>
                                <div style={{fontSize: '2.5rem', opacity: 0.8}}></div>
                            </div>
                        </div>

                        <div className="stat-card" style={{borderLeft: '4px solid #43e97b', background: 'rgba(67, 233, 123, 0.1)'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                <div>
                                    <div className="stat-label">Data-at-Rest Protection</div>
                                    <div className="stat-value" style={{fontSize: '1.2rem', marginTop: '5px'}}>TDE-Enabled</div>
                                    <div style={{fontSize: '0.75rem', color: 'var(--muted)', marginTop: '8px'}}>
                                        AES-256 Transparent Data Encryption
                                    </div>
                                </div>
                                <div style={{fontSize: '2.5rem', opacity: 0.8 }}></div>
                            </div>
                        </div>

                        <div className="stat-card" style={{borderLeft: '4px solid #f0c040', background: 'rgba(240, 192, 64, 0.1)'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                <div>
                                    <div className="stat-label">Server Auditing</div>
                                    <div className="stat-value" style={{ fontSize: '1.2rem', marginTop: '5px'}}>Recording</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '8px'}}>
                                        Passive Security Monitoring Active
                                    </div>
                                </div>
                                <div style={{fontSize: '2.5rem', opacity: 0.8 }}></div>
                            </div>
                        </div>

                    </div>

                    <div className="table-wrapper">
                      <div style={{padding: '15px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                          <h3 style={{fontSize: '1rem'}}>SQL Server Audit Record Table</h3>
                      </div>

                      <table className="data-table">
                          <thead>
                              <tr>
                                  <th>Timestamp</th>
                                  <th>User Email</th>
                                  <th>Action Type</th>
                                  <th>Target Table</th>
                                  <th>IP Address</th>
                              </tr>
                          </thead>
                          <tbody>
                              {loadingLogs?(
                                  <tr><td colSpan={5} className="no-data">Loading Audit Logs from Database...</td></tr>
                              ) : logs.length === 0?(
                                  <tr><td colSpan={5} className="no-data">No audit logs found.</td></tr>
                              ) : (
                                  logs.map((log) =>(
                                      <tr key={log.log_id}>
                                          <td className="mono">{new Date(log.changed_at).toLocaleString()}</td>
                                          <td className="mono">{log.user_email || 'System'}</td>
                                          <td>{log.action_type}</td>
                                          <td>{log.table_name}</td>
                                          <td className="mono">{log.ip_address}</td>
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

export default AdminDashboard;
