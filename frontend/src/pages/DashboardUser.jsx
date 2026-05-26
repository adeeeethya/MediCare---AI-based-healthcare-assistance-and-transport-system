import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import MapComponent from '../components/MapComponent';
import { Link } from 'react-router-dom';

const DashboardUser = ({ view = 'dashboard' }) => {
    const [bookings, setBookings] = useState([]);
    const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 });

    const refreshBookings = async () => {
        try {
            const res = await api.get('/bookings/');
            setBookings(Array.isArray(res.data) ? res.data : []);

            // Calculate stats
            const total = res.data.length;
            const active = res.data.filter(b => ['accepted', 'on_the_way', 'in_service'].includes(b.status)).length;
            const completed = res.data.filter(b => b.status === 'completed').length;
            setStats({ total, active, completed });
        } catch (err) {
            console.error("Failed to refresh bookings");
        }
    };

    const handleCancelBooking = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this request?")) return;
        try {
            await api.delete(`/bookings/${id}`);
            refreshBookings();
            alert("Booking cancelled successfully.");
        } catch (err) {
            console.error("Failed to cancel booking", err);
            alert("Failed to cancel booking: " + (err.response?.data?.detail || err.message));
        }
    };

    useEffect(() => {
        refreshBookings();
        const interval = setInterval(refreshBookings, 15000); // 15s auto-refresh
        return () => clearInterval(interval);
    }, []);

    return (
        <Layout role="user">
            <h1 className="text-xl mb-6">User Dashboard</h1>

            {/* Show Stats and Actions ONLY on Dashboard view */}
            {view === 'dashboard' && (
                <>
                    {/* Stats Components */}
                    <div className="dashboard-grid mb-6">
                        <div className="card" style={{ borderLeft: '4px solid var(--primary-color)' }}>
                            <div className="text-sm">Total Bookings</div>
                            <div className="text-xl" style={{ color: 'var(--primary-color)' }}>{stats.total}</div>
                        </div>
                        <div className="card" style={{ borderLeft: '4px solid var(--warning-color)' }}>
                            <div className="text-sm">Active Services</div>
                            <div className="text-xl" style={{ color: 'var(--warning-color)' }}>{stats.active}</div>
                        </div>
                        <div className="card" style={{ borderLeft: '4px solid var(--success-color)' }}>
                            <div className="text-sm">Completed</div>
                            <div className="text-xl" style={{ color: 'var(--success-color)' }}>{stats.completed}</div>
                        </div>
                    </div>

                    <div className="dashboard-grid">
                        <div className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <h3 className="text-lg">Quick Actions</h3>
                                <button className="btn btn-secondary" onClick={refreshBookings} style={{ fontSize: '0.8rem', padding: '4px 8px' }}>
                                    🔄 Refresh Status
                                </button>
                            </div>
                            <div style={{ display: 'grid', gap: '15px' }}>
                                <Link to="/book" className="btn btn-primary" style={{ justifyContent: 'center' }}>
                                    <span style={{ fontSize: '1.2rem' }}>🚑</span> Book a Caretaker
                                </Link>
                                <button className="btn btn-secondary" style={{ justifyContent: 'center' }}>
                                    <span style={{ fontSize: '1.2rem' }}>🤖</span> AI Health Chat
                                </button>
                                <Link to="/profile" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
                                    <span style={{ fontSize: '1.2rem' }}>👤</span> My Profile
                                </Link>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Show Bookings List on BOTH, or specialized for Bookings view */}
            {(view === 'bookings' || view === 'dashboard') && (
                <div className="card" style={{ marginTop: view === 'bookings' ? '0' : '20px' }}>
                    <h3 className="text-lg mb-4">{view === 'bookings' ? 'My Bookings History' : 'Active Bookings & Tracking'}</h3>

                    {(!bookings || !Array.isArray(bookings) || bookings.length === 0) ? (
                        <p className="text-muted" style={{ fontStyle: 'italic' }}>No bookings found.</p>
                    ) : (
                        <div>
                            {/* For Dashboard, show only active. For Bookings page, show ALL */}
                            {bookings.filter(b => b && (view === 'bookings' ? true : ['pending', 'accepted', 'on_the_way', 'in_service'].includes(b.status))).map(b => (
                                <div key={b.id} style={{
                                    marginBottom: '20px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    padding: '15px',
                                    background: '#f8fafc'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <div style={{ fontWeight: '600' }}>{b.service_type}</div>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            <div style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.8rem',
                                                background: b.status === 'accepted' ? '#dcfce7' : '#ffedd5',
                                                color: b.status === 'accepted' ? '#166534' : '#9a3412',
                                                textTransform: 'capitalize'
                                            }}>
                                                {b.status.replace(/_/g, ' ')}
                                            </div>
                                            {(b.status === 'pending' || b.status === 'accepted') && (
                                                <button
                                                    onClick={() => handleCancelBooking(b.id)}
                                                    className="btn btn-danger"
                                                    style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-sm" style={{ marginBottom: '10px' }}>
                                        📅 {b.scheduled_time ? new Date(b.scheduled_time).toLocaleString() : 'Date TBD'}
                                    </p>

                                    {/* Caretaker Details Section */}
                                    {b.caretaker && b.caretaker.user && (
                                        <div className="text-sm" style={{ marginBottom: '15px', padding: '12px', backgroundColor: '#e0f2fe', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                                            <div style={{ fontWeight: '600', color: '#0369a1', marginBottom: '6px' }}>Assigned Caretaker</div>
                                            <div style={{ display: 'flex', gap: '20px', color: '#0f172a' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{ fontSize: '1.1em' }}>👤</span> {b.caretaker.user.full_name || 'Name not provided'}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{ fontSize: '1.1em' }}>📞</span> {b.caretaker.user.phone || 'Phone not provided'}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Tracking Map for Active Bookings */}
                                    {['accepted', 'on_the_way', 'in_service'].includes(b.status) && (
                                        <div style={{ marginTop: '10px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                            <div style={{ padding: '8px', background: '#e2e8f0', fontSize: '0.8rem', fontWeight: 'bold' }}>Live Tracking</div>
                                            {b.caretaker && b.caretaker.user && typeof b.caretaker.user.latitude === 'number' ? (
                                                <div style={{ height: '200px' }}>
                                                    <MapComponent
                                                        readOnly={true}
                                                        centerCoords={{ lat: b.start_location_lat, lng: b.start_location_lng }}
                                                        markers={[
                                                            { lat: b.caretaker.user.latitude, lng: b.caretaker.user.longitude, title: "Caretaker" }
                                                        ]}
                                                    />
                                                </div>
                                            ) : (
                                                <div style={{ background: '#f8f9fa', padding: '20px', textAlign: 'center' }}>
                                                    <p className="text-sm">Waiting for caretaker location...</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </Layout>
    );
};

export default DashboardUser;
