import React, { useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

const ChatPage = () => {
    const [messages, setMessages] = useState([
        { sender: 'bot', text: 'Hello! I am your AI Health Assistant. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMsg = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await api.post('/ai/chat', { message: input });
            setMessages(prev => [...prev, { sender: 'bot', text: res.data.response }]);
        } catch (err) {
            setMessages(prev => [...prev, { sender: 'bot', text: "Sorry, I'm having trouble connecting right now." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout role="user">
            <h1 className="text-xl mb-6">AI Health Chat</h1>
            <div className="card" style={{ height: '70vh', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '20px', background: 'var(--primary-color)', color: 'white' }}>
                    <h3 style={{ margin: 0 }}>MediCare Assistant</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>Always here to help.</p>
                </div>

                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px',
                    backgroundColor: '#f8fafc'
                }}>
                    {messages.map((m, i) => (
                        <div key={i} style={{
                            alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                            background: m.sender === 'user' ? 'var(--primary-color)' : 'white',
                            color: m.sender === 'user' ? 'white' : 'var(--text-main)',
                            padding: '12px 18px',
                            borderRadius: '12px',
                            maxWidth: '75%',
                            boxShadow: 'var(--shadow-sm)',
                            borderBottomRightRadius: m.sender === 'user' ? '2px' : '12px',
                            borderTopLeftRadius: m.sender === 'bot' ? '2px' : '12px'
                        }}>
                            {m.text}
                        </div>
                    ))}
                    {loading && (
                        <div style={{ alignSelf: 'flex-start', color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic', marginLeft: '10px' }}>
                            Typing...
                        </div>
                    )}
                </div>

                <div style={{ padding: '20px', background: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px' }}>
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '24px',
                            border: '1px solid #e2e8f0',
                            outline: 'none',
                            paddingLeft: '20px'
                        }}
                        placeholder="Type a message..."
                    />
                    <button
                        className="btn btn-primary"
                        onClick={handleSend}
                        style={{
                            borderRadius: '50%',
                            width: '46px',
                            height: '46px',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        ➤
                    </button>
                    {/* Placeholder for Voice */}
                    <button
                        className="btn btn-secondary"
                        onClick={() => alert("Voice mode not implemented in this demo")}
                        style={{
                            borderRadius: '50%',
                            width: '46px',
                            height: '46px',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem'
                        }}
                    >
                        🎤
                    </button>
                </div>
            </div>
            <p style={{ marginTop: '10px', color: '#94a3b8', textAlign: 'center', fontSize: '0.8rem' }}>
                Disclaimer: This AI provides general guidance and is not a substitute for professional medical advice.
            </p>
        </Layout>
    );
};

export default ChatPage;
