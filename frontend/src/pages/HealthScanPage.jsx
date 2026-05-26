import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Camera, Upload, Image as ImageIcon, HeartPulse, ShieldAlert, ArrowRight } from 'lucide-react';
import Layout from '../components/Layout';

const HealthScanPage = () => {
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file.');
                return;
            }
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
            setResult(null);
            setError('');
            setIsCameraActive(false);
            stopCamera();
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsCameraActive(true);
                setImagePreview('');
                setImageFile(null);
                setResult(null);
                setError('');
            }
        } catch (err) {
            setError('Could not access the camera. Please allow camera permissions or upload a file.');
            console.error(err);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            setIsCameraActive(false);
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
                    setImageFile(file);
                    setImagePreview(canvas.toDataURL('image/jpeg'));
                    stopCamera();
                }
            }, 'image/jpeg');
        }
    };

    const handleScan = async () => {
        if (!imageFile) {
            setError('Please provide an image to scan.');
            return;
        }

        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('file', imageFile);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:8000/ai/scan_image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });

            if (response.data.status === 'success') {
                setResult(response.data);
            } else {
                setError(response.data.message || 'Error scanning image.');
            }
        } catch (err) {
            setError(err.response?.data?.detail || err.message || 'Network error occurred while scanning.');
        } finally {
            setLoading(false);
        }
    };

    const handleBookCaretaker = () => {
        navigate('/book'); // Standardized routing link
    };

    return (
        <Layout role="user">
            <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', paddingBottom: '40px' }} className="fade-in">
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '50px', marginTop: '30px' }}>
                    <div style={{ 
                        display: 'inline-flex', padding: '20px', background: 'var(--primary-light)', 
                        borderRadius: '24px', marginBottom: '20px', color: 'var(--primary-color)',
                        boxShadow: 'var(--shadow-md)'
                    }}>
                        <HeartPulse size={48} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-xl" style={{ fontSize: '3rem', marginBottom: '16px', color: 'var(--text-main)', fontWeight: '800', letterSpacing: '-0.02em' }}>
                        AI Health Scan
                    </h1>
                    <p className="text-md" style={{ color: 'var(--text-muted)', maxWidth: '650px', margin: '0 auto', fontSize: '1.1rem', lineHeight: '1.7' }}>
                        Upload an image of your symptom or condition. Our AI will instantly analyze the visual data and provide premium preliminary insights to help guide your next steps.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '35px' }}>
                    
                    {/* Input Section */}
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', border: 'none', boxShadow: 'var(--shadow-lg)' }}>
                        <h2 className="text-lg mb-6" style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ marginRight: '12px', background: 'var(--primary-light)', padding: '8px', borderRadius: '8px' }}>📸</span> 
                            Provide Image
                        </h2>

                        <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
                            <button
                                onClick={startCamera}
                                style={{
                                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    padding: '24px 15px', border: `2px solid ${isCameraActive ? 'var(--primary-color)' : '#e2e8f0'}`,
                                    borderRadius: 'var(--border-radius)', background: isCameraActive ? 'var(--primary-light)' : '#f8fafc',
                                    cursor: 'pointer', transition: 'all 0.2s', color: isCameraActive ? 'var(--primary-color)' : 'var(--text-main)'
                                }}
                            >
                                <Camera size={32} style={{ marginBottom: '12px' }} />
                                <span style={{ fontWeight: 600 }}>Open Camera</span>
                            </button>
                            
                            <button
                                onClick={triggerFileInput}
                                style={{
                                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    padding: '24px 15px', border: '2px dashed #cbd5e1', borderRadius: 'var(--border-radius)',
                                    background: '#f8fafc', cursor: 'pointer', transition: 'all 0.2s', color: 'var(--text-main)'
                                }}
                            >
                                <Upload size={32} style={{ marginBottom: '12px', color: 'var(--secondary-color)' }} />
                                <span style={{ fontWeight: 600 }}>Upload Photo</span>
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                        </div>

                        <div style={{ 
                            position: 'relative', width: '100%', aspectRatio: '16/9', background: '#f1f5f9', 
                            borderRadius: 'var(--border-radius)', overflow: 'hidden', border: '1px solid #e2e8f0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '25px',
                            boxShadow: 'var(--shadow-inner)'
                        }}>
                            {isCameraActive ? (
                                <>
                                    <video ref={videoRef} autoPlay playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}></video>
                                    <div style={{ position: 'absolute', bottom: '20px', left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
                                        <button onClick={capturePhoto} className="btn" style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(8px)', color: 'var(--text-main)', border: '1px solid rgba(255,255,255,0.5)', padding: '10px 24px', borderRadius: '30px' }}>
                                            <Camera size={18} style={{ marginRight: '8px' }} /> Capture Photo
                                        </button>
                                    </div>
                                </>
                            ) : imagePreview ? (
                                <img src={imagePreview} alt="Preview" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', background: '#e2e8f0' }} />
                            ) : (
                                <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                                    <ImageIcon size={54} strokeWidth={1.5} style={{ marginBottom: '12px' }} />
                                    <p style={{ fontWeight: 500 }}>No image provided</p>
                                </div>
                            )}
                            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                        </div>

                        <button 
                            onClick={handleScan} 
                            disabled={!imageFile || loading || isCameraActive}
                            className={`btn ${(!imageFile || loading || isCameraActive) ? 'btn-secondary' : 'btn-primary'}`}
                            style={{ 
                                width: '100%', padding: '16px', fontSize: '1.1rem', marginTop: 'auto', 
                                opacity: (!imageFile || loading || isCameraActive) ? 0.6 : 1, 
                                cursor: (!imageFile || loading || isCameraActive) ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {loading ? (
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <div style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: '10px' }}></div>
                                    Analyzing AI Model...
                                </div>
                            ) : 'Scan Image with AI'}
                        </button>
                        
                        {error && (
                            <div className="fade-in" style={{ marginTop: '16px', padding: '14px', background: '#fef2f2', color: '#991b1b', borderRadius: 'var(--border-radius-sm)', border: '1px solid #fecaca', fontSize: '0.95rem' }}>
                                <strong>Error:</strong> {error}
                            </div>
                        )}
                    </div>

                    {/* Results Section */}
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', border: 'none', boxShadow: 'var(--shadow-lg)', background: 'linear-gradient(to bottom right, #ffffff, #f8fafc)' }}>
                        <h2 className="text-lg mb-6" style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ marginRight: '12px', background: '#dcfce7', color: '#166534', padding: '8px', borderRadius: '8px' }}>📋</span> 
                            Analysis Results
                        </h2>

                        {!result && !loading && (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', border: '2px dashed #cbd5e1', borderRadius: 'var(--border-radius)', textAlign: 'center', background: '#f1f5f9' }}>
                                <ShieldAlert size={64} style={{ color: '#94a3b8', strokeWidth: 1.5, marginBottom: '24px' }} />
                                <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.6' }}>
                                    Results will securely appear here after your image is scanned by our advanced AI model.
                                </p>
                            </div>
                        )}

                        {loading && (
                            <div className="fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-light)', borderRadius: 'var(--border-radius)', padding: '50px', textAlign: 'center' }}>
                                <div style={{ width: '60px', height: '60px', border: '4px solid var(--primary-color)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '25px' }}></div>
                                <p style={{ color: 'var(--primary-hover)', fontSize: '1.2rem', fontWeight: 600 }}>Inspecting Image...</p>
                                <p style={{ color: 'var(--primary-color)', marginTop: '12px', fontSize: '0.95rem' }}>Comparing against medical datasets. This usually takes ~5 seconds.</p>
                                <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                            </div>
                        )}

                        {result && (
                            <div className="fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--border-radius-lg)', padding: '24px', marginBottom: '30px', boxShadow: 'var(--shadow-sm)' }}>
                                    <h3 style={{ color: '#166534', fontWeight: 700, fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
                                        <div style={{ background: '#bbf7d0', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px' }}>✓</div> 
                                        Scan Complete
                                    </h3>
                                    <p style={{ color: '#14532d', whiteSpace: 'pre-line', lineHeight: '1.7', fontSize: '1.05rem' }}>
                                        {result.advice}
                                    </p>
                                </div>

                                <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>
                                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '16px', borderRadius: 'var(--border-radius)', marginBottom: '24px', color: '#b45309', display: 'flex', alignItems: 'flex-start' }}>
                                        <ShieldAlert size={24} style={{ marginRight: '16px', flexShrink: 0, marginTop: '2px', color: '#f59e0b' }} />
                                        <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }}><strong>Disclaimer:</strong> AI advice is informational. It is not a clinical diagnosis. If you feel unwell, please consult a real caretaker immediately.</p>
                                    </div>

                                    <button 
                                        onClick={handleBookCaretaker} 
                                        className="btn fade-in" 
                                        style={{ 
                                            width: '100%', background: '#0f172a', color: 'white', 
                                            padding: '18px', fontSize: '1.1rem', borderRadius: '12px',
                                            display: 'flex', justifyContent: 'center', transition: 'all 0.3s',
                                            boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.3)'
                                        }}
                                        onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(15, 23, 42, 0.4)'; }}
                                        onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(15, 23, 42, 0.3)'; }}
                                    >
                                        Book Consultation Now <ArrowRight size={20} style={{ marginLeft: '12px' }} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default HealthScanPage;
