import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Layout = ({ children, role }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    const navLinks = [
        { path: '/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/profile', label: 'Profile', icon: '👤' },
        ...(role === 'user' ? [
            { path: '/bookings', label: 'Bookings', icon: '📅' },
            { path: '/book', label: 'Voice Booking', icon: '📝' },
            { path: '/voice-ai', label: 'Voice AI', icon: '🎙️' },
            { path: '/health-scan', label: 'Health Scan', icon: '📸' }
        ] : []),
        ...(role === 'caretaker' ? [{ path: '/schedule', label: 'My Schedule', icon: '🕒' }] : []),
    ];

    return (
        <div className="app-container">
            <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`} style={{
                width: isSidebarOpen ? 'var(--sidebar-width)' : '80px',
                height: '100vh',
                backgroundColor: 'var(--bg-sidebar)',
                color: 'var(--text-light)',
                transition: 'width 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '4px 0 10px rgba(0,0,0,0.1)',
                zIndex: 10
            }}>
                <div style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {isSidebarOpen && <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-light)' }}>MediCare</h2>}
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>
                        {isSidebarOpen ? '◀' : '▶'}
                    </button>
                </div>

                <nav style={{ flex: 1, padding: '10px' }}>
                    {navLinks.map(link => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`nav-item ${location.pathname.includes(link.path) ? 'active' : ''}`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '12px 15px',
                                color: location.pathname.includes(link.path) ? 'white' : 'var(--text-muted)',
                                textDecoration: 'none',
                                marginBottom: '8px',
                                borderRadius: 'var(--border-radius)',
                                backgroundColor: location.pathname.includes(link.path) ? 'rgba(255,255,255,0.1)' : 'transparent',
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden'
                            }}
                        >
                            <span style={{ fontSize: '1.2rem', marginRight: '15px' }}>{link.icon}</span>
                            {isSidebarOpen && <span>{link.label}</span>}
                        </Link>
                    ))}
                </nav>

                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        {isSidebarOpen && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>Logged in as {role}</div>}
                        <button
                            onClick={handleLogout}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                                padding: '10px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: '#ef4444',
                                border: 'none',
                                borderRadius: 'var(--border-radius)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <span style={{ fontSize: '1.2rem', marginRight: isSidebarOpen ? '10px' : 0 }}>🚪</span>
                            {isSidebarOpen && 'Logout'}
                        </button>
                    </div>
                </div>
            </aside>

            <div className="main-content">
                <header className="header" style={{
                    height: 'var(--header-height)',
                    backgroundColor: 'white',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    padding: '0 30px',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>Welcome Back</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date().toLocaleDateString()}</div>
                        </div>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'var(--primary-light)',
                            color: 'var(--primary-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold'
                        }}>
                            U
                        </div>
                    </div>
                </header>
                <main className="page-content fade-in" style={{ flex: 1, overflowY: 'auto' }}>
                    {console.log("Layout Rendering. Role:", role)}
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
