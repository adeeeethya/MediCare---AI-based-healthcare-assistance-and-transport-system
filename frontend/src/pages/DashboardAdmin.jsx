import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

const DashboardAdmin = () => {
    const [caretakers, setCaretakers] = useState([]);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const cRes = await api.get('/caretakers/'); // Admin gets all
                setCaretakers(cRes.data);
                const uRes = await api.get('/users/');
                setUsers(uRes.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, []);

    const approveCaretaker = async (id) => {
        try {
            await api.post(`/caretakers/${id}/approve`);
            setCaretakers(prev => prev.map(c => c.id === id ? { ...c, is_approved: true } : c));
        } catch (err) {
            console.error("Failed to approve");
            alert("Failed to approve caretaker");
        }
    };

    const deleteCaretaker = async (id) => {
        if (window.confirm("Are you sure you want to delete this caretaker profile?")) {
            try {
                await api.delete(`/caretakers/${id}`);
                setCaretakers(prev => prev.filter(c => c.id !== id));
            } catch (err) {
                console.error("Failed to delete caretaker", err);
                alert("Failed to delete caretaker.");
            }
        }
    };

    const deleteUser = async (id) => {
        if (window.confirm("Are you sure you want to delete this user completely? This will remove all their data.")) {
            try {
                await api.delete(`/users/${id}`);
                setUsers(prev => prev.filter(u => u.id !== id));
            } catch (err) {
                console.error("Failed to delete user", err);
                alert("Failed to delete user.");
            }
        }
    };

    return (
        <Layout role="admin">
            <h1 className="text-xl mb-6">Admin Dashboard</h1>

            <div className="dashboard-grid mb-6">
                <div className="card" style={{ borderLeft: '4px solid var(--primary-color)' }}>
                    <div className="text-sm">Total Users</div>
                    <div className="text-xl" style={{ color: 'var(--primary-color)' }}>{users.length}</div>
                </div>
                <div className="card" style={{ borderLeft: '4px solid var(--accent-color)' }}>
                    <div className="text-sm">Total Caretakers</div>
                    <div className="text-xl" style={{ color: 'var(--accent-color)' }}>{caretakers.length}</div>
                </div>
                <div className="card" style={{ borderLeft: '4px solid var(--warning-color)' }}>
                    <div className="text-sm">Pending Approvals</div>
                    <div className="text-xl" style={{ color: 'var(--warning-color)' }}>{caretakers.filter(c => !c.is_approved).length}</div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="card">
                    <h3 className="text-lg mb-4">Pending Caretakers</h3>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {caretakers.filter(c => !c.is_approved).map(c => (
                            <li key={c.id} style={{
                                marginBottom: '15px',
                                padding: '20px',
                                background: '#f8fafc',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '15px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '5px' }}>
                                            {c.user.full_name || 'Name not provided'}
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            <span>📧 {c.user.email}</span>
                                            <span>📞 {c.user.phone || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => approveCaretaker(c.id)}
                                            style={{ background: 'var(--success-color)', borderColor: 'var(--success-color)', padding: '6px 12px', fontSize: '0.9rem' }}
                                        >
                                            Approve
                                        </button>
                                        <button
                                            className="btn btn-danger"
                                            onClick={() => deleteCaretaker(c.id)}
                                            style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                <div style={{
                                    background: 'white',
                                    padding: '15px',
                                    borderRadius: '8px',
                                    border: '1px solid #f1f5f9',
                                    display: 'grid',
                                    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                                    gap: '10px'
                                }}>
                                    <div><div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Specialization</div><div style={{ fontWeight: '500', fontSize: '0.9rem', wordBreak: 'break-word' }}>{c.specialization}</div></div>
                                    <div><div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Experience</div><div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{c.experience_years} years</div></div>
                                    <div><div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Aadhar Number</div><div style={{ fontWeight: '500', fontSize: '0.9rem', wordBreak: 'break-word' }}>{c.aadhar_number}</div></div>
                                    <div><div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Driving License</div><div style={{ fontWeight: '500', fontSize: '0.9rem', wordBreak: 'break-word' }}>{c.driving_license || 'Not Provided'}</div></div>
                                </div>
                            </li>
                        ))}
                        {caretakers.filter(c => !c.is_approved).length === 0 && <p className="text-muted">No pending approvals.</p>}
                    </ul>
                </div>

                <div className="card">
                    <h3 className="text-lg mb-4">Active Caretakers</h3>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {caretakers.filter(c => c.is_approved).map(c => (
                            <li key={c.id} style={{
                                marginBottom: '15px',
                                padding: '20px',
                                background: '#f8fafc',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '15px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '5px' }}>
                                            {c.user.full_name || 'Name not provided'}
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            <span>📧 {c.user.email}</span>
                                            <span>📞 {c.user.phone || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <button
                                        className="btn btn-danger"
                                        onClick={() => deleteCaretaker(c.id)}
                                        style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                                    >
                                        Remove Profile
                                    </button>
                                </div>

                                <div style={{
                                    background: 'white',
                                    padding: '15px',
                                    borderRadius: '8px',
                                    border: '1px solid #f1f5f9',
                                    display: 'grid',
                                    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                                    gap: '10px'
                                }}>
                                    <div><div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Specialization</div><div style={{ fontWeight: '500', fontSize: '0.9rem', wordBreak: 'break-word' }}>{c.specialization}</div></div>
                                    <div><div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Experience</div><div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{c.experience_years} years</div></div>
                                    <div><div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Aadhar Number</div><div style={{ fontWeight: '500', fontSize: '0.9rem', wordBreak: 'break-word' }}>{c.aadhar_number}</div></div>
                                    <div><div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Driving License</div><div style={{ fontWeight: '500', fontSize: '0.9rem', wordBreak: 'break-word' }}>{c.driving_license || 'Not Provided'}</div></div>
                                </div>
                            </li>
                        ))}
                        {caretakers.filter(c => c.is_approved).length === 0 && <p>No active caretakers found.</p>}
                    </ul>
                </div>
            </div>

            <div className="card" style={{ marginTop: '20px' }}>
                <h3 className="text-lg mb-4">All Users</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                    {users.map(u => (
                        <div key={u.id} style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '8px', background: 'white' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{u.full_name || 'No Name'}</div>
                                    <div className="text-sm" style={{ color: '#64748b', marginTop: '4px' }}>📧 {u.email}</div>
                                    {u.phone && <div className="text-sm" style={{ color: '#64748b', marginTop: '4px' }}>📞 {u.phone}</div>}
                                    {u.address && <div className="text-sm" style={{ color: '#64748b', marginTop: '4px' }}>🏠 {u.address}</div>}
                                    <div className="text-sm" style={{ color: '#64748b', marginTop: '8px', fontSize: '0.8rem' }}>Role: <span style={{ textTransform: 'capitalize' }}>{u.role}</span> | Joined: {new Date(u.created_at).toLocaleDateString()}</div>
                                </div>
                                <button className="btn btn-danger" style={{ fontSize: '0.8rem', padding: '4px 8px' }} onClick={() => deleteUser(u.id)}>Delete</button>
                            </div>
                        </div>
                    ))}
                    {users.length === 0 && <p>No users found.</p>}
                </div>
            </div>
        </Layout>
    );
};

export default DashboardAdmin;
