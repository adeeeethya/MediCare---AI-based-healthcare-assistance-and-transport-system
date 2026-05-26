import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/auth';

const Login = ({ isAdmin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState(isAdmin ? 'admin' : 'user');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await login(email, password);
            const storedRole = localStorage.getItem('role');

            if (storedRole === 'admin') navigate('/admin/dashboard');
            else if (storedRole === 'caretaker') navigate('/caretaker/dashboard');
            else navigate('/user/dashboard');
        } catch (err) {
            console.error(err);
            setError('Invalid credentials. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.5), rgba(15, 23, 42, 0.8)), url('/login-bg.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            padding: '20px'
        }}>
            <div className="glass-panel" style={{
                width: '100%',
                maxWidth: '450px',
                padding: '40px',
                borderRadius: '16px',
                color: 'white',
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: '10px', color: 'white' }}>{isAdmin ? 'Admin Portal' : 'Welcome Back'}</h2>
                    <p style={{ color: '#94a3b8' }}>Sign in to continue to MediCare</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', gap: '15px' }}>
                    {!isAdmin && <Link to="/admin/login" style={{ fontSize: '0.875rem', color: '#38bdf8', textDecoration: 'none' }}>Admin Login</Link>}
                    {isAdmin && <Link to="/login" style={{ fontSize: '0.875rem', color: '#38bdf8', textDecoration: 'none' }}>User Login</Link>}
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.5)',
                        color: '#fca5a5',
                        padding: '10px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {!isAdmin && (
                        <div className="form-group">
                            <label style={{ color: '#e2e8f0' }}>I am a...</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                style={{
                                    background: 'rgba(30, 41, 59, 0.8)',
                                    border: '1px solid #475569',
                                    color: 'white'
                                }}
                            >
                                <option value="user">Elderly User</option>
                                <option value="caretaker">Caretaker</option>
                            </select>
                        </div>
                    )}
                    <div className="form-group">
                        <label style={{ color: '#e2e8f0' }}>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{
                                background: 'rgba(30, 41, 59, 0.8)',
                                border: '1px solid #475569',
                                color: 'white'
                            }}
                        />
                    </div>
                    <div className="form-group">
                        <label style={{ color: '#e2e8f0' }}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                background: 'rgba(30, 41, 59, 0.8)',
                                border: '1px solid #475569',
                                color: 'white'
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{
                            width: '100%',
                            marginTop: '10px',
                            padding: '12px',
                            fontSize: '1rem'
                        }}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>

                    {!isAdmin && (
                        <div style={{ marginTop: '25px', textAlign: 'center', borderTop: '1px solid #334155', paddingTop: '20px' }}>
                            <p style={{ color: '#94a3b8', marginBottom: '15px' }}>New to MediCare?</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <Link to="/register/user" className="btn btn-secondary" style={{ textDecoration: 'none', justifyContent: 'center', background: 'transparent', color: 'white', borderColor: '#475569' }}>
                                    Register as User
                                </Link>
                                <Link to="/register/caretaker" className="btn btn-secondary" style={{ textDecoration: 'none', justifyContent: 'center', background: 'transparent', color: 'white', borderColor: '#475569' }}>
                                    Register as Caretaker
                                </Link>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default Login;
