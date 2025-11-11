import React, { useState, useEffect, useRef } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import WeatherCard from '../components/WeatherCard';

const Chat = ({ onNavigate }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([
        { role: 'model', content: `Hi ${user?.name || 'there'}! I'm HANALYSIS, your personal health assistant. How can I help you today?` }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Effect to scroll to the bottom of the chat on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', content: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            // Send the entire history to the backend
            const { data } = await api.post('/chat', { history: newMessages });
            const modelMessage = { role: 'model', content: data.reply };
            setMessages([...newMessages, modelMessage]);
        } catch (error) {
            console.error("Failed to get chat response:", error);
            const errorMessage = { role: 'model', content: 'Sorry, I ran into an error. Please try again.' };
            setMessages([...newMessages, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <WeatherCard />
            <div style={styles.container}>
                <header style={styles.header}>
                    <div>
                        <h1 style={styles.title}>AI Health Assistant</h1>
                        <p style={styles.subtitle}>Ask me anything about your health</p>
                    </div>
                    <button onClick={() => onNavigate('dashboard')} style={styles.navButton}>
                        &larr; Back to Dashboard
                    </button>
                </header>
                <div style={styles.chatWindow}>
                    <div style={styles.messageList}>
                        {messages.map((msg, index) => (
                            <div key={index} style={msg.role === 'user' ? styles.userMessage : styles.modelMessage}>
                                {msg.content}
                            </div>
                        ))}
                        {isLoading && (
                            <div style={styles.modelMessage}>
                                <div style={styles.aiThinkingContainer}>
                                    <div style={styles.aiAvatar}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                                            <path d="M2 17l10 5 10-5"></path>
                                            <path d="M2 12l10 5 10-5"></path>
                                        </svg>
                                    </div>
                                    <div style={styles.typingDots}>
                                        <span className="typing-dot" style={{...styles.dot, animationDelay: '0s'}}></span>
                                        <span className="typing-dot" style={{...styles.dot, animationDelay: '0.2s'}}></span>
                                        <span className="typing-dot" style={{...styles.dot, animationDelay: '0.4s'}}></span>
                                    </div>
                                    <div style={styles.thinkingText}>AI is thinking...</div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <form onSubmit={handleSendMessage} style={styles.inputForm}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask a health question..."
                            style={styles.input}
                            disabled={isLoading}
                        />
                        <button type="submit" style={styles.sendButton} disabled={isLoading}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

// --- STYLES ---
const styles = {
    container: { 
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh', 
        height: '100vh',
        display: 'flex', 
        flexDirection: 'column', 
        color: '#333',
        position: 'relative',
        overflow: 'hidden'
    },
    header: { 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '1.5rem 2rem', 
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '0 0 16px 16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(10px)',
        marginBottom: '1rem'
    },
    title: { 
        fontSize: '2rem', 
        fontWeight: '700', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        margin: 0,
        letterSpacing: '-0.02em'
    },
    subtitle: {
        fontSize: '0.9rem',
        color: '#64748b',
        margin: '0.25rem 0 0 0',
        fontWeight: '500'
    },
    navButton: { 
        padding: '0.75rem 1.5rem', 
        fontSize: '0.95rem', 
        fontWeight: '600', 
        color: '#475569', 
        backgroundColor: '#fff', 
        border: '2px solid #e2e8f0', 
        borderRadius: '10px', 
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
    },
    chatWindow: { 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        padding: '1rem 2rem 1rem 2rem', 
        overflowY: 'hidden',
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto'
    },
    messageList: { 
        flex: 1, 
        overflowY: 'auto', 
        padding: '1rem', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1.25rem',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255, 255, 255, 0.3) transparent'
    },
    userMessage: { 
        alignSelf: 'flex-end', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff', 
        padding: '1rem 1.25rem', 
        borderRadius: '20px 20px 4px 20px', 
        maxWidth: '75%',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
        fontSize: '0.95rem',
        lineHeight: '1.5'
    },
    modelMessage: { 
        alignSelf: 'flex-start', 
        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
        color: '#1e293b', 
        padding: '1rem 1.25rem', 
        borderRadius: '20px 20px 20px 4px', 
        maxWidth: '75%', 
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        fontSize: '0.95rem',
        lineHeight: '1.5',
        backdropFilter: 'blur(10px)'
    },
    aiThinkingContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
    },
    aiAvatar: {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        flexShrink: 0,
        animation: 'pulse 2s ease-in-out infinite'
    },
    typingDots: {
        display: 'flex',
        gap: '0.4rem',
        alignItems: 'center'
    },
    dot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: '#667eea',
        animation: 'typingDot 1.4s ease-in-out infinite'
    },
    thinkingText: {
        fontSize: '0.85rem',
        color: '#64748b',
        fontStyle: 'italic',
        marginLeft: '0.5rem'
    },
    inputForm: { 
        display: 'flex', 
        padding: '1.5rem', 
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        gap: '0.75rem'
    },
    input: { 
        flex: 1, 
        padding: '0.875rem 1.25rem', 
        border: '2px solid #e2e8f0', 
        borderRadius: '20px', 
        fontSize: '1rem',
        backgroundColor: '#fff',
        transition: 'all 0.3s ease',
        outline: 'none'
    },
    sendButton: { 
        padding: '0.875rem 1.25rem', 
        border: 'none', 
        borderRadius: '20px', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff', 
        fontSize: '1rem', 
        fontWeight: '600', 
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
        transition: 'all 0.3s ease'
    },
};

// Inject dynamic CSS animations
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = `
        @keyframes typingDot {
            0%, 60%, 100% { 
                transform: translateY(0);
                opacity: 0.7;
            }
            30% { 
                transform: translateY(-10px);
                opacity: 1;
            }
        }
        @keyframes pulse {
            0%, 100% { 
                transform: scale(1);
                opacity: 1;
            }
            50% { 
                transform: scale(1.1);
                opacity: 0.8;
            }
        }
        .typing-dot:nth-child(1) { animation-delay: 0s; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
    `;
    if (!document.head.querySelector('style[data-chat-animations]')) {
        styleSheet.setAttribute('data-chat-animations', 'true');
        document.head.appendChild(styleSheet);
    }
}


export default Chat;
