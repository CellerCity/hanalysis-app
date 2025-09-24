import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const Login = ({ onNavigate }) => {
    const { login } = useAuth();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const { email, password } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setError('');
        try {
            await login(email, password);
            // After login, the useEffect in App.jsx will handle navigation automatically.
        } catch (err) {
            setError(err.message || 'Failed to login');
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.formCard}>
                <h1 style={styles.title}>Welcome Back</h1>
                <form onSubmit={onSubmit}>
                    {error && <p style={styles.errorMessage}>{error}</p>}
                    <div style={styles.formGroup}>
                        <input type="email" placeholder="Email Address" name="email" value={email} onChange={onChange} required style={styles.input} />
                    </div>
                    <div style={styles.formGroup}>
                        <input type="password" placeholder="Password" name="password" value={password} onChange={onChange} required style={styles.input} />
                    </div>
                    <button type="submit" style={styles.button}>Login</button>
                </form>
                <p style={styles.subText}>
                    Don't have an account?{' '}
                    <span onClick={() => onNavigate('signup')} style={styles.link}>
                        Sign Up
                    </span>
                </p>
            </div>
        </div>
    );
};

// --- STYLES ---
const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5' },
    formCard: { backgroundColor: '#fff', padding: '2.5rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '450px' },
    title: { textAlign: 'center', fontSize: '1.75rem', fontWeight: '600', color: '#1a202c', marginBottom: '1.5rem' },
    formGroup: { marginBottom: '1rem' },
    input: { width: '100%', padding: '0.75rem 1rem', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '1rem' },
    button: { width: '100%', padding: '0.75rem', border: 'none', borderRadius: '6px', backgroundColor: '#2d3748', color: '#fff', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' },
    subText: { textAlign: 'center', marginTop: '1rem', color: '#718096' },
    link: { color: '#2b6cb0', fontWeight: '500', cursor: 'pointer' },
    errorMessage: { color: '#e53e3e', backgroundColor: '#fed7d7', padding: '0.75rem', borderRadius: '6px', textAlign: 'center', marginBottom: '1rem' }
};

export default Login;