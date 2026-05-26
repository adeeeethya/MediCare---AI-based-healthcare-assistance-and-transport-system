import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';

const VoiceChatPage = () => {
    const [isListening, setIsListening] = useState(false);
    const [messages, setMessages] = useState([
        { sender: 'ai', text: "Hello! I am your MediCare AI Assistant. How can I help you today?" }
    ]);
    const [isProcessing, setIsProcessing] = useState(false);

    const recognitionRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);
    const messagesEndRef = useRef(null);

    // Auto-scroll logic
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isProcessing]);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event) => {
                const currentTranscript = event.results[0][0].transcript;
                setIsListening(false);

                // Add user message to history
                setMessages(prev => [...prev, { sender: 'user', text: currentTranscript }]);
                handleAiInteraction(currentTranscript);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
                setIsProcessing(false);

                let errorMessage = "Sorry, voice recognition failed. ";
                if (event.error === 'not-allowed') {
                    errorMessage = "Microphone access is blocked! Please click the lock icon in your browser's address bar and allow microphone access.";
                } else if (event.error === 'network') {
                    errorMessage = "A network error occurred while trying to use speech recognition.";
                } else if (event.error === 'no-speech') {
                    errorMessage = "I couldn't hear any speech. Are you sure your microphone is working?";
                }
                setMessages(prev => [...prev, { sender: 'ai', text: errorMessage }]);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        } else {
            console.warn("Speech Recognition API not supported.");
        }

        return () => {
            if (synthRef.current.speaking) {
                synthRef.current.cancel();
            }
        };
    }, []);

    const speak = (text) => {
        if (synthRef.current) {
            synthRef.current.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            const voices = synthRef.current.getVoices();
            const preferredVoice = voices.find(v => v.lang.includes('en-US') && v.name.includes('Female')) || voices.find(v => v.lang.includes('en'));
            if (preferredVoice) utterance.voice = preferredVoice;
            synthRef.current.speak(utterance);
        }
    };

    const handleAiInteraction = async (message) => {
        setIsProcessing(true);
        try {
            const res = await api.post('/ai/chat', { message });
            const reply = res.data.response;
            setMessages(prev => [...prev, { sender: 'ai', text: reply }]);
            speak(reply);
        } catch (error) {
            console.error("AI Chat error:", error);
            const errMsg = "Sorry, I am having trouble connecting to the network right now.";
            setMessages(prev => [...prev, { sender: 'ai', text: errMsg }]);
            speak(errMsg);
        } finally {
            setIsProcessing(false);
        }
    };

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert("Speech recognition is not supported on this browser context. Please try Google Chrome or Edge.");
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            if (synthRef.current.speaking) {
                synthRef.current.cancel();
            }
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {
                console.error("Error starting recognition", e);
            }
        }
    };

    return (
        <Layout role="user">
            <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
                {/* Header section */}
                <div style={{ marginBottom: '20px' }}>
                    <h1 className="text-2xl m-0 flex items-center gap-2">
                        <span style={{ fontSize: '1.5em' }}>🎙️</span> Voice AI Assistant
                    </h1>
                    <p className="text-muted mt-1">Speak into your microphone and the AI will respond. Only users can see this page.</p>
                </div>

                {/* Chat History Section */}
                <div style={{
                    flex: 1,
                    background: 'white',
                    borderRadius: '16px',
                    boxShadow: 'var(--shadow-sm)',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    <div className="chat-history" style={{
                        flex: 1,
                        overflowY: 'auto',
                        paddingRight: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px'
                    }}>
                        {messages.map((msg, index) => (
                            <div key={index} style={{
                                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '80%',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '12px'
                            }}>
                                {msg.sender === 'ai' && (
                                    <div style={{
                                        minWidth: '36px',
                                        height: '36px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '1em'
                                    }}>🤖</div>
                                )}

                                <div style={{
                                    background: msg.sender === 'user' ? 'var(--primary-light)' : '#f8fafc',
                                    color: msg.sender === 'user' ? 'var(--primary-color)' : '#334155',
                                    border: msg.sender === 'user' ? '1px solid var(--primary-color)' : '1px solid #e2e8f0',
                                    padding: '12px 18px',
                                    borderRadius: '16px',
                                    borderBottomRightRadius: msg.sender === 'user' ? '4px' : '16px',
                                    borderBottomLeftRadius: msg.sender === 'ai' ? '4px' : '16px',
                                    fontSize: '1rem',
                                    lineHeight: '1.5'
                                }}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}

                        {isProcessing && (
                            <div style={{
                                alignSelf: 'flex-start',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '12px'
                            }}>
                                <div style={{
                                    minWidth: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '1em'
                                }}>🤖</div>
                                <div style={{
                                    background: '#f8fafc',
                                    padding: '12px 18px',
                                    borderRadius: '16px',
                                    borderBottomLeftRadius: '4px',
                                    border: '1px solid #e2e8f0',
                                    color: '#0284c7',
                                    fontStyle: 'italic'
                                }}>
                                    Thinking...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Microphone Controls */}
                    <div style={{
                        marginTop: '20px',
                        paddingTop: '20px',
                        borderTop: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'center'
                    }}>
                        <button
                            onClick={toggleListening}
                            style={{
                                background: isListening ? '#ef4444' : 'var(--primary-color)',
                                color: 'white',
                                border: 'none',
                                padding: '15px 30px',
                                borderRadius: '30px',
                                cursor: 'pointer',
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                transition: 'all 0.3s ease',
                                boxShadow: isListening ? '0 0 15px rgba(239, 68, 68, 0.4)' : '0 4px 10px rgba(59, 130, 246, 0.3)'
                            }}
                        >
                            <span style={{ fontSize: '1.4em' }}>{isListening ? '🛑' : '🎤'}</span>
                            {isListening ? 'Stop Recording' : 'Tap to Speak'}
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default VoiceChatPage;
