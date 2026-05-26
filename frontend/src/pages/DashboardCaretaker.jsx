import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import MapComponent from '../components/MapComponent';
import { Link } from 'react-router-dom';


const DashboardCaretaker = ({ view = 'dashboard' }) => {
    const [caretaker, setCaretaker] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [location, setLocation] = useState(null);
    const [initialLocation, setInitialLocation] = useState(null);

    const refreshBookings = async () => {
        try {
            const bookRes = await api.get('/bookings/');
            setBookings(Array.isArray(bookRes.data) ? bookRes.data : []);
        } catch (err) {
            console.error("Failed to refresh bookings");
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const meRes = await api.get('/caretakers/me');
                setCaretaker(meRes.data);
                // Pre-fill location if exists
                if (meRes.data && meRes.data.user && meRes.data.user.latitude) {
                    const loc = { lat: meRes.data.user.latitude, lng: meRes.data.user.longitude };
                    setLocation(loc);
                    setInitialLocation(loc); // Only set this once or when explicitly refreshed
                }


                await refreshBookings();
            } catch (err) {
                console.error("Dashboard Load Error:", err);
                const status = err.response ? err.response.status : "Unknown";
                const detail = err.response?.data?.detail || err.message;
                setError(status === 400
                    ? "Access Denied: Please login as a Caretaker."
                    : `Failed to load dashboard. ${detail}`);
            } finally {
                setLoading(false);
            }
        };
        fetchData();

        // Auto-refresh every 15 seconds
        const interval = setInterval(refreshBookings, 15000);
        return () => clearInterval(interval);
    }, []);

    const toggleAvailability = async () => {
        try {
            const newStatus = !caretaker.is_available;
            await api.put(`/caretakers/me/availability?is_available=${newStatus}`);
            setCaretaker(prev => ({ ...prev, is_available: newStatus }));
        } catch (err) {
            alert("Failed to update availability");
        }
    };

    const handleLocationSelect = (loc) => {
        setLocation(loc);
    };

    const updateLocation = async () => {
        if (!location) return;
        try {
            await api.put(`/caretakers/me/location?latitude=${location.lat}&longitude=${location.lng}`);
            alert("Location updated successfully!");
        } catch (err) {
            alert("Failed to update location");
        }
    };

    const handleBookingAction = async (id, status) => {
        try {
            await api.put(`/bookings/${id}/status?status=${status}`);
            refreshBookings();
        } catch (err) {
            alert("Failed to update booking status");
        }
    };

    if (loading) return <Layout role="caretaker"><div style={{ padding: '20px', textAlign: 'center' }}>Loading dashboard...</div></Layout>;
    if (error) return <Layout role="caretaker"><div style={{ padding: '20px', color: 'red' }}>Error: {error}</div></Layout>;
    if (!caretaker) return <Layout role="caretaker"><div style={{ padding: '20px' }}>No caretaker profile found.</div></Layout>;

    return (
        <Layout role="caretaker">
            <h1 className="text-xl mb-6">Caretaker Dashboard</h1>

            {view === 'dashboard' && (
                <div className="dashboard-grid">
                    <div className="card">
                        <h3 className="text-lg mb-4">Status & Location</h3>
                        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                            <div>
                                <div className="text-sm">Current Status</div>
                                <div style={{
                                    fontWeight: 'bold',
                                    color: caretaker.is_available ? 'var(--success-color)' : 'var(--danger-color)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: caretaker.is_available ? 'var(--success-color)' : 'var(--danger-color)' }}></span>
                                    {caretaker.is_available ? "Available" : "Busy"}
                                </div>
                            </div>
                            <button className={`btn ${caretaker.is_available ? 'btn-danger' : 'btn-primary'}`} onClick={toggleAvailability}>
                                {caretaker.is_available ? "Go Busy" : "Go Available"}
                            </button>
                        </div>

                        <div className="mb-4">
                            <Link to="/profile" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                                👤 Manage Profile & License
                            </Link>
                        </div>

                        <h4 className="text-md mb-2">Set My Location</h4>
                        <p className="text-sm mb-2" style={{ color: '#666' }}>Pinpoint your location so users can track you.</p>
                        <div style={{ height: '250px', marginBottom: '15px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                            <MapComponent
                                onLocationSelect={handleLocationSelect}
                                centerCoords={initialLocation}
                                markers={location ? [location] : []}
                            />
                        </div>
                        {location && (
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <button className="btn btn-primary" onClick={updateLocation} style={{ flex: 1 }}>
                                    Update Location
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {(view === 'schedule' || view === 'dashboard') && (
                <>
                    {/* Show Booking Requests */}
                    <div className="dashboard-grid" style={{ marginTop: view === 'schedule' ? 0 : '20px' }}>
                        <div className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <h3 className="text-lg">Booking Requests</h3>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <button className="btn btn-secondary" onClick={refreshBookings} style={{ fontSize: '0.8rem', padding: '4px 8px' }}>
                                        🔄 Refresh
                                    </button>
                                    <span style={{
                                        background: 'var(--primary-color)',
                                        color: 'white',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.8rem'
                                    }}>
                                        {bookings ? bookings.filter(b => b.status === 'pending').length : 0} New
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {(!bookings || !Array.isArray(bookings) || bookings.length === 0) ? (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                                        No pending requests.
                                    </div>
                                ) : (
                                    bookings.filter(b => b.status === 'pending').map(b => (
                                        <div key={b.id} style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '8px', background: '#f8fafc' }}>
                                            <div style={{ marginBottom: '10px' }}>
                                                <div style={{ fontWeight: '600' }}>{b.service_type}</div>
                                                <div className="text-sm">📅 {b.scheduled_time ? new Date(b.scheduled_time).toLocaleString() : 'TBD'}</div>
                                                <div className="text-sm">📍 {b.address || 'Location provided on map'}</div>
                                                {b.target_hospital && <div className="text-sm" style={{ color: '#0369a1' }}>🏥 <strong>Hospital:</strong> {b.target_hospital}</div>}
                                                <div className="text-sm" style={{ color: b.has_car ? '#15803d' : '#b45309' }}>
                                                    {b.has_car ? '🚗 User has a personal car' : '🚕 User needs transportation'}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button className="btn btn-primary" style={{ flex: 1, padding: '8px' }} onClick={() => handleBookingAction(b.id, 'accepted')}>Accept</button>
                                                <button className="btn btn-danger" style={{ flex: 1, padding: '8px' }} onClick={() => handleBookingAction(b.id, 'rejected')}>Reject</button>
                                            </div>
                                        </div>
                                    )))}
                            </div>
                        </div>
                    </div>

                    {/* Show Active Jobs */}
                    <div className="card" style={{ marginTop: '20px' }}>
                        <h3 className="text-lg mb-4">Upcoming / Active Jobs</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                            {bookings && bookings.filter(b => ['accepted', 'on_the_way', 'in_service'].includes(b.status)).map(b => (
                                <div key={b.id} style={{ border: '1px solid #cbd5e1', padding: '15px', borderRadius: '8px', borderLeft: '4px solid var(--accent-color)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <strong>{b.service_type}</strong>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            background: '#eff6ff',
                                            color: '#1d4ed8',
                                            border: '1px solid #bfdbfe'
                                        }}>
                                            {b.status.replace(/_/g, ' ').toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="text-sm">Client ID: #{b.user_id}</div>
                                    <div className="text-sm" style={{ margin: '5px 0' }}>📍 {b.address}</div>
                                    {b.target_hospital && <div className="text-sm" style={{ margin: '5px 0', color: '#0369a1' }}>🏥 <strong>Hospital:</strong> {b.target_hospital}</div>}
                                    <div className="text-sm" style={{ margin: '5px 0', color: b.has_car ? '#15803d' : '#b45309' }}>
                                        {b.has_car ? '🚗 User has a personal car' : '🚕 User needs transportation'}
                                    </div>

                                    <div style={{ marginTop: '10px', display: 'flex', gap: '5px' }}>
                                        {b.status === 'accepted' && (
                                            <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '5px 10px' }} onClick={() => handleBookingAction(b.id, 'on_the_way')}>Start Journey</button>
                                        )}
                                        {b.status === 'on_the_way' && (
                                            <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '5px 10px' }} onClick={() => handleBookingAction(b.id, 'in_service')}>Arrived</button>
                                        )}
                                        {b.status === 'in_service' && (
                                            <button className="btn btn-success" style={{ fontSize: '0.8rem', padding: '5px 10px', background: 'var(--success-color)', color: 'white', border: 'none' }} onClick={() => handleBookingAction(b.id, 'completed')}>Complete Job</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {bookings && bookings.filter(b => ['accepted', 'on_the_way', 'in_service'].includes(b.status)).length === 0 && (
                                <p className="text-muted">No active jobs at the moment.</p>
                            )}
                        </div>
                    </div>
                </>
            )}

        </Layout>
    );
};

export default DashboardCaretaker;
