import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerCaretaker } from '../services/auth';

const Register = () => {
    const [formData, setFormData] = useState({
        full_name: '', email: '', phone: '', password: '',
        address: '', role: 'caretaker',
        aadhar_number: '', driving_license: '', experience_years: 0, specialization: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const payload = {
                user: {
                    email: formData.email,
                    full_name: formData.full_name,
                    phone: formData.phone,
                    role: 'caretaker',
                    address: formData.address,
                    password: formData.password
                },
                aadhar_number: formData.aadhar_number,
                driving_license: formData.driving_license,
                experience_years: parseInt(formData.experience_years),
                specialization: formData.specialization
            };
            await registerCaretaker(payload);
            navigate('/login');
        } catch (err) {
            setError('Registration failed. Email might be taken.');
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
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            padding: '40px 20px'
        }}>
            <div className="glass-panel" style={{
                width: '100%',
                maxWidth: '600px',
                padding: '40px',
                borderRadius: '16px',
                color: 'white'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: '10px', color: 'white' }}>Join as Caretaker</h2>
                    <p style={{ color: '#94a3b8' }}>Start your journey with MediCare</p>
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

                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label style={{ color: '#e2e8f0' }}>Full Name</label>
                        <input name="full_name" value={formData.full_name} onChange={handleChange} required style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid #475569', color: 'white' }} />
                    </div>

                    <div className="form-group">
                        <label style={{ color: '#e2e8f0' }}>Email</label>
                        <input name="email" type="email" value={formData.email} onChange={handleChange} required style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid #475569', color: 'white' }} />
                    </div>
                    <div className="form-group">
                        <label style={{ color: '#e2e8f0' }}>Password</label>
                        <input name="password" type="password" value={formData.password} onChange={handleChange} required style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid #475569', color: 'white' }} />
                    </div>

                    <div className="form-group">
                        <label style={{ color: '#e2e8f0' }}>Phone</label>
                        <input name="phone" value={formData.phone} onChange={handleChange} required style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid #475569', color: 'white' }} />
                    </div>
                    <div className="form-group">
                        <label style={{ color: '#e2e8f0' }}>Address</label>
                        <input name="address" value={formData.address} onChange={handleChange} required style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid #475569', color: 'white' }} />
                    </div>

                    <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #475569', margin: '10px 0' }}></div>

                    <div className="form-group">
                        <label style={{ color: '#e2e8f0' }}>Aadhar Number</label>
                        <input name="aadhar_number" value={formData.aadhar_number} onChange={handleChange} required style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid #475569', color: 'white' }} />
                    </div>
                    <div className="form-group">
                        <label style={{ color: '#e2e8f0' }}>Driving License</label>
                        <input name="driving_license" value={formData.driving_license} onChange={handleChange} placeholder="Optional" style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid #475569', color: 'white' }} />
                    </div>

                    <div className="form-group">
                        <label style={{ color: '#e2e8f0' }}>Experience (Years)</label>
                        <input name="experience_years" type="number" value={formData.experience_years} onChange={handleChange} required style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid #475569', color: 'white' }} />
                    </div>
                    <div className="form-group">
                        <label style={{ color: '#e2e8f0' }}>Specialization</label>
                        <input name="specialization" value={formData.specialization} onChange={handleChange} required placeholder="e.g. Nursing" style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid #475569', color: 'white' }} />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ gridColumn: '1 / -1', marginTop: '10px', padding: '12px' }} disabled={isLoading}>
                        {isLoading ? 'Registering...' : 'Register'}
                    </button>

                    <div style={{ gridColumn: '1 / -1', marginTop: '10px', textAlign: 'center' }}>
                        <span style={{ color: '#94a3b8' }}>Already have an account? </span>
                        <Link to="/login" style={{ color: '#38bdf8', textDecoration: 'none' }}>Sign In</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
