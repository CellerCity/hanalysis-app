import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';

const Login = ({ switchToSignup }) => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth(); // Get the login function from our context

    const { email, password } = formData;
    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const config = { headers: { 'Content-Type': 'application/json' } };
            const body = JSON.stringify({ email, password });
            const response = await axios.post('http://localhost:5000/api/users/login', body, config);
            login(response.data); // On successful login, update our global state
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.formWrapper}>
                <h1 style={styles.title}>Welcome Back</h1>
                <p style={styles.subtitle}>Log in to access your dashboard.</p>
                {error && <div style={styles.errorBox}>{error}</div>}
                <form onSubmit={onSubmit}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Email</label>
                        <input type="email" name="email" value={email} onChange={onChange} required style={styles.input} />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Password</label>
                        <input type="password" name="password" value={password} onChange={onChange} required style={styles.input} />
                    </div>
                    <button type="submit" style={styles.button} disabled={loading}>
                        {loading ? 'Logging In...' : 'Log In'}
                    </button>
                </form>
                <p style={styles.switchText}>
                    Don't have an account?{' '}
                    <span onClick={switchToSignup} style={styles.switchLink}>Sign Up</span>
                </p>
            </div>
        </div>
    );
};

// Using the same styles as Signup.jsx for consistency
const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'sans-serif' },
    formWrapper: { backgroundColor: '#fff', padding: '2.5rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '450px' },
    title: { fontSize: '1.75rem', fontWeight: '600', textAlign: 'center', marginBottom: '0.5rem', color: '#1a202c' },
    subtitle: { textAlign: 'center', color: '#718096', marginBottom: '2rem' },
    inputGroup: { marginBottom: '1.25rem' },
    label: { display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: '#4a5568' },
    input: { width: '100%', padding: '0.75rem', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '1rem', boxSizing: 'border-box' },
    button: { width: '100%', padding: '0.8rem', border: 'none', borderRadius: '6px', backgroundColor: '#2d3748', color: '#fff', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', marginTop: '1rem' },
    errorBox: { backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', textAlign: 'center' },
    switchText: { textAlign: 'center', marginTop: '1.5rem', color: '#718096' },
    switchLink: { color: '#2d3748', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }
};

export default Login;

