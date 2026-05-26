import React, { useState } from 'react';
import Layout from '../components/Layout';
import MapComponent from '../components/MapComponent';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${date}T${hours}:${minutes}`;
};

const BookingPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        service_type: 'caretaker',
        scheduled_time: getCurrentDateTime(),
        duration_hours: 1,
        address: '',
        has_car: false,
        target_hospital: '',
        notes: '',
        emergency_flag: false
    });
    const [location, setLocation] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isExtractingVoice, setIsExtractingVoice] = useState(false);

    // Voice Booking State
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = React.useRef(null);
    const isRecordingRef = React.useRef(false);
    const transcriptRef = React.useRef("");

    const handleVoiceBooking = async (transcript) => {
        setIsExtractingVoice(true);
        try {
            const res = await api.post('/ai/extract_booking', { transcript });
            if (res.data.status === 'success') {
                const data = res.data.data;
                // Ensure boolean parsing
                const parsedHasCar = data.has_car === 'true' || data.has_car === true;

                // Fuzzy match hospital names to dropdown options
                let parsedHospital = data.target_hospital === 'null' ? '' : data.target_hospital;
                if (parsedHospital) {
                    const rawHospital = parsedHospital.toLowerCase();
                    if (rawHospital.includes("amrita")) parsedHospital = "Amrita Hospital, Kochi";
                    else if (rawHospital.includes("aster")) parsedHospital = "Aster Medcity, Kochi";
                    else if (rawHospital.includes("kims")) parsedHospital = "KIMSHEALTH, Trivandrum";
                    else if (rawHospital.includes("rajagiri")) parsedHospital = "Rajagiri Hospital, Aluva";
                    else if (rawHospital.includes("lakeshore")) parsedHospital = "Lakeshore Hospital, Kochi";
                    else if (rawHospital.includes("medical college") && rawHospital.includes("trivandrum")) parsedHospital = "Medical College Hospital, Trivandrum";
                    else if (rawHospital.includes("medical college") && rawHospital.includes("kozhikode")) parsedHospital = "Medical College Hospital, Kozhikode";
                    else if (rawHospital.includes("baby")) parsedHospital = "Baby Memorial Hospital, Kozhikode";
                    else parsedHospital = parsedHospital; // Keep raw if no match (though select might ignore)
                }

                setFormData(prev => {
                    // Fallback to previous if the AI didn't catch a hospital
                    const finalHospital = parsedHospital || prev.target_hospital;

                    return {
                        ...prev,
                        service_type: data.service_type === 'null' ? prev.service_type : (data.service_type || prev.service_type),
                        scheduled_time: (data.date && data.date !== 'null' && data.time && data.time !== 'null') ? `${data.date}T${data.time}` : prev.scheduled_time,
                        has_car: data.has_car !== null && data.has_car !== 'null' ? parsedHasCar : prev.has_car,
                        target_hospital: finalHospital
                    };
                });
                alert("Voice booking details extracted! Please double check the form mapping before submitting.");
            } else {
                alert("Could not extract booking details from audio. Please try again.");
            }
        } catch (error) {
            console.error("AI Extractor error", error);
            alert("Error sending voice to AI. You can still type.");
        } finally {
            setIsExtractingVoice(false);
        }
    };

    React.useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }

                if (finalTranscript) {
                    transcriptRef.current += finalTranscript + " ";
                }
            };

            recognitionRef.current.onerror = (event) => {
                if (event.error === 'no-speech' && isRecordingRef.current) {
                    return;
                }
                console.error('Speech recognition error in booking:', event.error);
                setIsListening(false);
                isRecordingRef.current = false;
                setIsExtractingVoice(false);
                let errorMessage = "Voice recognition failed. ";
                if (event.error === 'not-allowed') {
                    errorMessage += "Microphone access was denied. Please allow microphone permissions in your browser settings.";
                } else if (event.error === 'network') {
                    errorMessage += "There is a network connection error.";
                } else if (event.error === 'no-speech') {
                    errorMessage += "No speech was detected. Please try speaking closer to the microphone.";
                } else {
                    errorMessage += "Please try again or type manually.";
                }
                alert(errorMessage);
            };

            recognitionRef.current.onend = () => {
                if (isRecordingRef.current) {
                    try {
                        recognitionRef.current.start();
                    } catch (e) {
                        console.error("Failed to restart speech recognition:", e);
                        setIsListening(false);
                        isRecordingRef.current = false;
                        setIsExtractingVoice(false);
                    }
                } else {
                    setIsListening(false);
                    // Process final transcript after microphone fully releases
                    if (transcriptRef.current.trim().length > 0) {
                        handleVoiceBooking(transcriptRef.current);
                        transcriptRef.current = ""; // Reset
                    } else {
                        setIsExtractingVoice(false);
                    }
                }
            };
        }
    }, [handleVoiceBooking]);

    const handleVoiceToggle = () => {
        if (!recognitionRef.current) {
            alert("Your browser does not support voice recognition. Please try Chrome.");
            return;
        }

        if (isListening) {
            // Stop listening immediately, onend will handle the AI extraction
            isRecordingRef.current = false;
            setIsListening(false);
            setIsExtractingVoice(true);
            recognitionRef.current.stop();
        } else {
            // Start listening
            transcriptRef.current = "";
            isRecordingRef.current = true;
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleLocationSelect = React.useCallback((loc) => {
        setLocation(loc);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!location) {
            alert("Please select a location on the map");
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                ...formData,
                address: formData.address || `Lat: ${location.lat.toFixed(6)}, Lng: ${location.lng.toFixed(6)}`,
                limit_lat: location.lat,
                limit_lng: location.lng
            };
            await api.post('/bookings/', payload);
            alert("Booking request sent successfully!");
            navigate('/user/dashboard');
        } catch (err) {
            console.error("Booking failed", err);
            console.log("Error response:", err.response);
            const errorMsg = err.response?.data?.detail
                ? (typeof err.response.data.detail === 'object' ? JSON.stringify(err.response.data.detail) : err.response.data.detail)
                : (err.message || "Failed to create booking. Please checks logs.");
            alert(`Error: ${errorMsg}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Layout role="user">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 className="text-xl m-0">Book a Caretaker</h1>
                <button
                    type="button"
                    onClick={handleVoiceToggle}
                    disabled={isExtractingVoice}
                    className="btn"
                    style={{
                        background: isListening ? '#ef4444' : (isExtractingVoice ? '#fbbf24' : 'var(--primary-light)'),
                        color: isListening ? 'white' : (isExtractingVoice ? '#92400e' : 'var(--primary-color)'),
                        display: 'flex',
                        alignItems: 'center',
                        border: 'none',
                        gap: '8px',
                        padding: '10px 15px',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        cursor: isExtractingVoice ? 'not-allowed' : 'pointer'
                    }}>
                    <span style={{ fontSize: '1.2rem' }}>
                        {isExtractingVoice ? '⏳' : (isListening ? '🛑' : '🎤')}
                    </span>
                    {isExtractingVoice ? 'Extracting AI...' : (isListening ? 'Stop Listening' : 'Voice Booking')}
                </button>
            </div>

            <div className="dashboard-grid">
                <div className="card">
                    <h3 className="text-lg mb-4">1. Select Location</h3>
                    <p className="text-sm mb-2" style={{ color: '#666' }}>Tap on the map to set the specialized service location.</p>
                    <div style={{ height: '400px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
                        <MapComponent onLocationSelect={handleLocationSelect} />
                    </div>
                    {location ? (
                        <div style={{ background: '#f0f9ff', padding: '10px', borderRadius: '6px', border: '1px solid #bae6fd', color: '#0369a1' }}>
                            ✅ Selected Location: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                        </div>
                    ) : (
                        <div style={{ background: '#fffbeb', padding: '10px', borderRadius: '6px', border: '1px solid #fde68a', color: '#b45309' }}>
                            ⚠️ Please click on the map to select a location.
                        </div>
                    )}
                </div>

                <div className="card">
                    <h3 className="text-lg mb-4">2. Service Details</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Service Type</label>
                            <select name="service_type" value={formData.service_type} onChange={handleChange}>
                                <option value="caretaker">Standard Caretaker</option>
                                <option value="emergency_transport">Emergency Transport</option>
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div className="form-group">
                                <label>Date & Time</label>
                                <input type="datetime-local" name="scheduled_time" value={formData.scheduled_time} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Duration (Hours)</label>
                                <input type="number" name="duration_hours" value={formData.duration_hours} onChange={handleChange} min="1" required />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Address (Optional)</label>
                            <input name="address" value={formData.address} onChange={handleChange} placeholder="Or leave blank to use map location" />
                        </div>

                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '15px', marginBottom: '15px' }}>
                            <input
                                type="checkbox"
                                name="has_car"
                                checked={formData.has_car}
                                onChange={handleChange}
                                id="has_car"
                                style={{ width: 'auto', margin: 0 }}
                            />
                            <label htmlFor="has_car" style={{ margin: 0, fontWeight: '500' }}>
                                Do you have a personal car for transportation?
                            </label>
                        </div>

                        <div className="form-group">
                            <label>Select Target Hospital (Optional)</label>
                            <select name="target_hospital" value={formData.target_hospital} onChange={handleChange}>
                                <option value="">None / Not Applicable</option>
                                <option value="Amrita Hospital, Kochi">Amrita Hospital, Kochi</option>
                                <option value="Aster Medcity, Kochi">Aster Medcity, Kochi</option>
                                <option value="KIMSHEALTH, Trivandrum">KIMSHEALTH, Trivandrum</option>
                                <option value="Rajagiri Hospital, Aluva">Rajagiri Hospital, Aluva</option>
                                <option value="Lakeshore Hospital, Kochi">Lakeshore Hospital, Kochi</option>
                                <option value="Medical College Hospital, Trivandrum">Medical College Hospital, Trivandrum</option>
                                <option value="Medical College Hospital, Kozhikode">Medical College Hospital, Kozhikode</option>
                                <option value="Baby Memorial Hospital, Kozhikode">Baby Memorial Hospital, Kozhikode</option>
                            </select>
                        </div>


                        <div className="form-group">
                            <label>Special Notes</label>
                            <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Any specific requirements or medical conditions..." rows={3} />
                        </div>

                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#fee2e2', borderRadius: '6px', border: '1px solid #fecaca' }}>
                            <input
                                type="checkbox"
                                name="emergency_flag"
                                checked={formData.emergency_flag}
                                onChange={handleChange}
                                id="emergency_flag"
                                style={{ width: 'auto', margin: 0 }}
                            />
                            <label htmlFor="emergency_flag" style={{ margin: 0, color: '#b91c1c', fontWeight: 'bold' }}>
                                This is an Emergency Request
                            </label>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px', fontSize: '1.1rem' }} disabled={isLoading}>
                            {isLoading ? 'Processing...' : 'Find Caretaker Now'}
                        </button>
                    </form>
                </div>
            </div>
        </Layout>
    );
};

export default BookingPage;
