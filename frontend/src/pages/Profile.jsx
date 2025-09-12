import React, { useState, useEffect } from 'react';
import api from '../api/api'; // Import our new centralized api client
import { useAuth } from '../context/AuthContext.jsx';

const Profile = ({ onNavigate }) => {
    // We still use useAuth for user details, but not for the token directly in the API call
    const { user } = useAuth(); 
    const [profileData, setProfileData] = useState(null);
    const [editableData, setEditableData] = useState({
        preExistingConditions: '',
        allergies: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Now we use our 'api' instance. The token is added automatically
                // by the interceptor. No need for manual config objects.
                const { data } = await api.get('/profile/me');
                setProfileData(data);
                setEditableData({
                    preExistingConditions: data.healthProfile.preExistingConditions.join(', '),
                    allergies: data.healthProfile.allergies.join(', ')
                });
            } catch (err) {
                setError('Failed to fetch profile data. Your session may have expired.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []); // We can remove token from dependency array as the interceptor handles it

    const handleInputChange = (e) => {
        setEditableData({ ...editableData, [e.target.name]: e.target.value });
    };

    const handleSaveChanges = async (e) => {
        e.preventDefault();
        setSuccessMessage('');
        setError('');

        try {
             const payload = {
                preExistingConditions: editableData.preExistingConditions.split(',').map(s => s.trim()).filter(Boolean),
                allergies: editableData.allergies.split(',').map(s => s.trim()).filter(Boolean)
            };
            
            // Use the 'api' instance here as well for the PUT request
            const { data } = await api.put('/profile/me', payload);
            
            setProfileData(data);
            setSuccessMessage('Profile updated successfully!');

        } catch (err) {
            setError('Failed to update profile.');
            console.error(err);
        }
    };

    if (loading) return <div style={styles.centerMessage}>Loading Profile...</div>;
    if (error) return <div style={{ ...styles.centerMessage, color: '#ff4d4d' }}>{error}</div>;

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>My Profile</h1>
                <button onClick={() => onNavigate('dashboard')} style={styles.navButton}>
                    &larr; Back to Dashboard
                </button>
            </header>
            
            <div style={styles.card}>
                <h2 style={styles.cardTitle}>Personal Information</h2>
                <div style={styles.infoGrid}>
                    <p><strong>Name:</strong> {profileData?.name || user?.name}</p>
                    <p><strong>Email:</strong> {profileData?.email || user?.email}</p>
                    <p><strong>Age:</strong> {profileData?.age}</p>
                    <p><strong>Home Location:</strong> {profileData?.location}</p>
                </div>
            </div>

            <div style={styles.card}>
                <h2 style={styles.cardTitle}>Update Health Profile</h2>
                <p style={styles.instructions}>Enter conditions or allergies separated by a comma (e.g., Asthma, Hypertension).</p>
                <form onSubmit={handleSaveChanges}>
                    <div style={styles.formGroup}>
                        <label style={styles.label} htmlFor="preExistingConditions">Pre-existing Conditions</label>
                        <input
                            type="text"
                            id="preExistingConditions"
                            name="preExistingConditions"
                            value={editableData.preExistingConditions}
                            onChange={handleInputChange}
                            style={styles.input}
                        />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label} htmlFor="allergies">Allergies</label>
                        <input
                            type="text"
                            id="allergies"
                            name="allergies"
                            value={editableData.allergies}
                            onChange={handleInputChange}
                            style={styles.input}
                        />
                    </div>
                    <button type="submit" style={styles.saveButton}>Save Changes</button>
                    {successMessage && <p style={styles.successMessage}>{successMessage}</p>}
                </form>
            </div>
        </div>
    );
};

// --- STYLES ---
const styles = {
    container: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', backgroundColor: '#f0f2f5', minHeight: '100vh', padding: '2rem', color: '#333' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
    title: { fontSize: '2rem', fontWeight: '600', color: '#1a202c', margin: 0 },
    navButton: { padding: '0.5rem 1rem', fontSize: '0.9rem', color: '#2d3748', backgroundColor: 'transparent', border: '1px solid #cbd5e0', borderRadius: '6px', cursor: 'pointer' },
    card: { backgroundColor: '#fff', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', marginBottom: '2rem' },
    cardTitle: { fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' },
    infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
    instructions: { color: '#718096', fontSize: '0.9rem', marginBottom: '1rem' },
    formGroup: { marginBottom: '1rem' },
    label: { display: 'block', fontWeight: '500', marginBottom: '0.5rem' },
    input: { width: '100%', padding: '0.75rem', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '1rem' },
    saveButton: { padding: '0.75rem 1.5rem', fontSize: '1rem', fontWeight: '600', color: '#fff', backgroundColor: '#2d3748', border: 'none', borderRadius: '6px', cursor: 'pointer' },
    centerMessage: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.5rem', fontFamily: 'sans-serif' },
    successMessage: { color: '#2f855a', marginTop: '1rem', textAlign: 'center' }
};

export default Profile;

