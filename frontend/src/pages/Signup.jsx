import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import WeatherCard from '../components/WeatherCard';

const Signup = ({ onNavigate }) => {
    const { handleAuthentication } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        age: '',
        location: '',
        preExistingConditions: '',
        allergies: ''
    });
    const [error, setError] = useState('');

    const { name, email, password, confirmPassword, age, location, preExistingConditions, allergies } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) { return setError('Passwords do not match'); }
        if (password.length < 6) { return setError('Password must be at least 6 characters'); }
        try {
            const newUser = { name, email, password, age, location, preExistingConditions, allergies };
            const { data } = await api.post('/users/register', newUser);
            
            handleAuthentication(data.token);

        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
            console.error(err);
        }
    };

    return (
        <>
            <WeatherCard />
            <div style={styles.container}>
                <div style={styles.header}>
                    <button 
                        onClick={() => onNavigate('dashboard')} 
                        style={styles.dashboardButton}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                        }}
                    >
                        Go to Dashboard
                    </button>
                </div>
                <div style={styles.formCard}>
                <h1 style={styles.title}>Create Your Account</h1>
                <form onSubmit={onSubmit}>
                    {error && <p style={styles.errorMessage}>{error}</p>}
                    <div style={styles.formGroup}><input type="text" placeholder="Name" name="name" value={name} onChange={onChange} required style={styles.input} /></div>
                    <div style={styles.formGroup}><input type="email" placeholder="Email Address" name="email" value={email} onChange={onChange} required style={styles.input} /></div>
                    <div style={styles.formGroup}><input type="password" placeholder="Password" name="password" value={password} onChange={onChange} required style={styles.input} /></div>
                    <div style={styles.formGroup}><input type="password" placeholder="Confirm Password" name="confirmPassword" value={confirmPassword} onChange={onChange} required style={styles.input} /></div>
                    <div style={styles.formGroup}><input type="number" placeholder="Age" name="age" value={age} onChange={onChange} required style={styles.input} /></div>
                    <div style={styles.formGroup}><input type="text" placeholder="Your City (e.g., Kharagpur)" name="location" value={location} onChange={onChange} required style={styles.input} /></div>
                    <p style={styles.instructions}>Optional: For personalized alerts, enter items separated by a comma.</p>
                    <div style={styles.formGroup}><input type="text" placeholder="Allergies (e.g., Pollen, Dust)" name="allergies" value={allergies} onChange={onChange} style={styles.input} /></div>
                    <div style={styles.formGroup}><input type="text" placeholder="Pre-existing Conditions (e.g., Asthma)" name="preExistingConditions" value={preExistingConditions} onChange={onChange} style={styles.input} /></div>
                    <button type="submit" style={styles.button}>Sign Up</button>
                </form>
                <p style={styles.subText}>
                    Already have an account? <span onClick={() => onNavigate('login')} style={styles.link}>Login</span>
                </p>
            </div>
        </div>
        </>
    );
};

// --- STYLES ---
const styles = {
    container: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '2rem', position: 'relative' },
    header: { position: 'absolute', top: '2rem', left: '2rem', zIndex: 10 },
    dashboardButton: { padding: '0.75rem 1.5rem', fontSize: '0.95rem', fontWeight: '600', color: '#fff', backgroundColor: 'rgba(255, 255, 255, 0.2)', border: '2px solid rgba(255, 255, 255, 0.3)', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', backdropFilter: 'blur(10px)' },
    formCard: { backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '2.5rem', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)', width: '100%', maxWidth: '450px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.3)' },
    title: { textAlign: 'center', fontSize: '2rem', fontWeight: '700', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '1.5rem' },
    formGroup: { marginBottom: '1rem' },
    input: { width: '100%', padding: '0.75rem 1rem', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '1rem' },
    button: { width: '100%', padding: '0.875rem', border: 'none', borderRadius: '10px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)', transition: 'all 0.3s ease' },
    subText: { textAlign: 'center', marginTop: '1rem', color: '#718096' },
    link: { color: '#2b6cb0', fontWeight: '500', cursor: 'pointer' },
    errorMessage: { color: '#e53e3e', backgroundColor: '#fed7d7', padding: '0.75rem', borderRadius: '6px', textAlign: 'center', marginBottom: '1rem' },
    instructions: { color: '#718096', fontSize: '0.8rem', textAlign: 'center', marginBottom: '1rem' }
};

export default Signup;

