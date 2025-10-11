import React, { useState, useEffect, useRef } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

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
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>AI Health Assistant</h1>
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
                            <span style={styles.typingIndicator}></span>
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
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- STYLES ---
const styles = {
    container: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', backgroundColor: '#f0f2f5', height: '100vh', display: 'flex', flexDirection: 'column', color: '#333' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff' },
    title: { fontSize: '1.5rem', fontWeight: '600', color: '#1a202c', margin: 0 },
    navButton: { padding: '0.5rem 1rem', fontSize: '0.9rem', color: '#2d3748', backgroundColor: 'transparent', border: '1px solid #cbd5e0', borderRadius: '6px', cursor: 'pointer' },
    chatWindow: { flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem', overflowY: 'hidden' },
    messageList: { flex: 1, overflowY: 'auto', padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
    userMessage: { alignSelf: 'flex-end', backgroundColor: '#2d3748', color: '#fff', padding: '0.75rem 1rem', borderRadius: '18px 18px 4px 18px', maxWidth: '80%' },
    modelMessage: { alignSelf: 'flex-start', backgroundColor: '#fff', color: '#333', padding: '0.75rem 1rem', borderRadius: '18px 18px 18px 4px', maxWidth: '80%', border: '1px solid #e2e8f0' },
    inputForm: { display: 'flex', padding: '1rem', borderTop: '1px solid #e2e8f0', backgroundColor: '#fff' },
    input: { flex: 1, padding: '0.75rem 1rem', border: '1px solid #cbd5e0', borderRadius: '20px', fontSize: '1rem', marginRight: '1rem' },
    sendButton: { padding: '0.75rem 1.5rem', border: 'none', borderRadius: '20px', backgroundColor: '#2d3748', color: '#fff', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' },
    typingIndicator: { display: 'inline-block', width: '24px', height: '6px', borderRadius: '3px', background: 'currentColor', opacity: 0.2, animation: 'typing 1s infinite', animationDelay: '0s' },
};
// Simple keyframes need to be injected for the typing indicator
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `@keyframes typing { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.8; } }`;
document.head.appendChild(styleSheet);


export default Chat;
