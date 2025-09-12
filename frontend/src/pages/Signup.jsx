import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx'; // Import useAuth

const Signup = ({ switchToLogin }) => { // Accept switchToLogin prop
    const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', age: '', location: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth(); // Get login function to automatically log in user after signup

    const { name, email, password, confirmPassword, age, location } = formData;
    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        if (password !== confirmPassword) { return setError('Passwords do not match'); }
        if (password.length < 6) { return setError('Password must be at least 6 characters'); }
        setLoading(true);
        setError('');
        try {
            const newUser = { name, email, password, age, location };
            const config = { headers: { 'Content-Type': 'application/json' } };
            const body = JSON.stringify(newUser);
            const response = await axios.post('http://localhost:5000/api/users/register', body, config);
            login(response.data); // On successful signup, log the user in immediately
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Something went wrong. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.formWrapper}>
                <h1 style={styles.title}>Create Your HANALYSIS Account</h1>
                <p style={styles.subtitle}>Get personalized health insights today.</p>
                {error && <div style={styles.errorBox}>{error}</div>}
                <form onSubmit={onSubmit}>
                    {/* --- Input fields (No changes) --- */}
                    <div style={styles.inputGroup}><label style={styles.label}>Name</label><input type="text" name="name" value={name} onChange={onChange} required style={styles.input} /></div>
                    <div style={styles.inputGroup}><label style={styles.label}>Email</label><input type="email" name="email" value={email} onChange={onChange} required style={styles.input} /></div>
                    <div style={styles.inputGroup}><label style={styles.label}>Password</label><input type="password" name="password" value={password} onChange={onChange} required style={styles.input} /></div>
                    <div style={styles.inputGroup}><label style={styles.label}>Confirm Password</label><input type="password" name="confirmPassword" value={confirmPassword} onChange={onChange} required style={styles.input} /></div>
                    <div style={styles.row}><div style={{...styles.inputGroup, flex: 1}}><label style={styles.label}>Age</label><input type="number" name="age" value={age} onChange={onChange} required style={styles.input} /></div><div style={{...styles.inputGroup, flex: 2, marginLeft: '1rem'}}><label style={styles.label}>Location (City)</label><input type="text" name="location" value={location} onChange={onChange} required style={styles.input} /></div></div>
                    <button type="submit" style={styles.button} disabled={loading}>{loading ? 'Signing Up...' : 'Sign Up'}</button>
                </form>
                {/* --- NEW: Link to switch to Login page --- */}
                <p style={styles.switchText}>
                    Already have an account?{' '}
                    <span onClick={switchToLogin} style={styles.switchLink}>Log In</span>
                </p>
            </div>
        </div>
    );
};

// Using the same styles as Login.jsx for consistency
const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'sans-serif' },
    formWrapper: { backgroundColor: '#fff', padding: '2.5rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '450px' },
    title: { fontSize: '1.75rem', fontWeight: '600', textAlign: 'center', marginBottom: '0.5rem', color: '#1a202c' },
    subtitle: { textAlign: 'center', color: '#718096', marginBottom: '2rem' },
    inputGroup: { marginBottom: '1.25rem' },
    label: { display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: '#4a5568' },
    input: { width: '100%', padding: '0.75rem', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '1rem', boxSizing: 'border-box' },
    row: { display: 'flex', justifyContent: 'space-between' },
    button: { width: '100%', padding: '0.8rem', border: 'none', borderRadius: '6px', backgroundColor: '#2d3748', color: '#fff', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', marginTop: '1rem' },
    errorBox: { backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', textAlign: 'center' },
    switchText: { textAlign: 'center', marginTop: '1.5rem', color: '#718096' },
    switchLink: { color: '#2d3748', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }
};

export default Signup;

