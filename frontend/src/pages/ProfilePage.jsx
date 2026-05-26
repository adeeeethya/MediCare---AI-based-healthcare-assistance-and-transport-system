import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [caretakerProfile, setCaretakerProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    const role = localStorage.getItem('role');

    // Form states
    const [formData, setFormData] = useState({});

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const userRes = await api.get('/users/me');
            setUser(userRes.data);
            setFormData(prev => ({ ...prev, ...userRes.data }));

            if (role === 'caretaker') {
                const caretakerRes = await api.get('/caretakers/me');
                setCaretakerProfile(caretakerRes.data);
                setFormData(prev => ({ ...prev, ...caretakerRes.data }));
            }
        } catch (err) {
            console.error("Failed to load profile", err);
            setError("Failed to load profile details.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        try {
            const userPayload = {
                full_name: formData.full_name,
                phone: formData.phone,
                address: formData.address
            };

            await api.put('/users/me', userPayload);

            if (role === 'caretaker') {
                const caretakerPayload = {
                    experience_years: parseInt(formData.experience_years),
                    specialization: formData.specialization,
                    driving_license: formData.driving_license
                };
                await api.put('/caretakers/me', caretakerPayload);
            }

            alert("Profile updated successfully!");
            setIsEditing(false);
            fetchProfile(); // Refresh data
        } catch (err) {
            console.error("Update failed", err);
            alert("Failed to update profile. Please try again.");
        }
    };

    if (loading) return <Layout role={role}><div className="p-4 text-center">Loading profile...</div></Layout>;
    if (error) return <Layout role={role}><div className="p-4 text-red-500 text-center">{error}</div></Layout>;

    return (
        <Layout role={role}>
            <div className="max-w-2xl mx-auto">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h1 className="text-2xl font-bold">My Profile</h1>
                    {!isEditing ? (
                        <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>
                            ✏️ Edit Profile
                        </button>
                    ) : (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSave}>💾 Save Changes</button>
                        </div>
                    )}
                </div>

                <div className="card mb-6">
                    <h3 className="text-lg font-semibold mb-4 border-b pb-2">Personal Information</h3>

                    <div className="grid gap-4">
                        <div className="form-group">
                            <label>Full Name</label>
                            {isEditing ? (
                                <input name="full_name" value={formData.full_name || ''} onChange={handleChange} />
                            ) : (
                                <div className="p-2 bg-gray-50 rounded border border-gray-200">{user.full_name}</div>
                            )}
                        </div>

                        <div className="form-group">
                            <label>Email (Read-only)</label>
                            <div className="p-2 bg-gray-100 rounded border border-gray-200 text-gray-500">{user.email}</div>
                        </div>

                        <div className="form-group">
                            <label>Phone Number</label>
                            {isEditing ? (
                                <input name="phone" value={formData.phone || ''} onChange={handleChange} />
                            ) : (
                                <div className="p-2 bg-gray-50 rounded border border-gray-200">{user.phone || 'Not set'}</div>
                            )}
                        </div>

                        <div className="form-group">
                            <label>Address</label>
                            {isEditing ? (
                                <textarea name="address" value={formData.address || ''} onChange={handleChange} rows={2} />
                            ) : (
                                <div className="p-2 bg-gray-50 rounded border border-gray-200">{user.address || 'Not set'}</div>
                            )}
                        </div>
                    </div>
                </div>

                {role === 'caretaker' && caretakerProfile && (
                    <div className="card">
                        <h3 className="text-lg font-semibold mb-4 border-b pb-2">Professional Details</h3>

                        <div className="grid gap-4">
                            <div className="form-group">
                                <label>Specialization</label>
                                {isEditing ? (
                                    <input name="specialization" value={formData.specialization || ''} onChange={handleChange} placeholder="e.g. Elderly Care, Physiotherapy" />
                                ) : (
                                    <div className="p-2 bg-gray-50 rounded border border-gray-200">{caretakerProfile.specialization || 'Not set'}</div>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Years of Experience</label>
                                {isEditing ? (
                                    <input type="number" name="experience_years" value={formData.experience_years || 0} onChange={handleChange} />
                                ) : (
                                    <div className="p-2 bg-gray-50 rounded border border-gray-200">{caretakerProfile.experience_years} Years</div>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Driving License No.</label>
                                {isEditing ? (
                                    <input name="driving_license" value={formData.driving_license || ''} onChange={handleChange} />
                                ) : (
                                    <div className="p-2 bg-gray-50 rounded border border-gray-200">{caretakerProfile.driving_license || 'Not provided'}</div>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Aadhar Number (Read-only)</label>
                                <div className="p-2 bg-gray-100 rounded border border-gray-200 text-gray-500">{caretakerProfile.aadhar_number}</div>
                            </div>

                            <div className="flex items-center gap-2 mt-2">
                                <span className={`px-2 py-1 rounded text-sm ${caretakerProfile.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {caretakerProfile.is_approved ? '✅ Approved Caretaker' : '⏳ Waiting for Approval'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default ProfilePage;
