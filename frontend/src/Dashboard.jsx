import React, { useState, useEffect } from 'react';
import axios from 'axios';

// --- Helper Components for Icons ---
const SunIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>;
const WindIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"></path></svg>;
const DropletIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>;

// --- Risk Calculation Logic ---
const calculateRiskScore = (metrics) => {
    let score = 0;
    const recommendations = [];

    const { weather, air_quality } = metrics;

    // Rule 1: High Temperature (Heat stress risk)
    if (weather.temperature_celsius > 35) {
        score += 3;
        recommendations.push("High temperature: Stay hydrated and avoid prolonged sun exposure.");
    }

    // Rule 2: High Humidity (Comfort and respiratory stress)
    if (weather.humidity_percent > 85) {
        score += 2;
        recommendations.push("High humidity: Air may feel heavy. Good for hydration but can affect breathing for some.");
    }
    
    // Rule 3: High UV Index (Skin damage risk)
    if (weather.uv_index > 6) {
        score += 3;
        recommendations.push("High UV Index: Use sunscreen and wear protective clothing.");
    }

    // Rule 4: Poor Air Quality (Respiratory risk)
    if (air_quality.us_epa_index >= 3) {
        score += 4;
        recommendations.push("Poor Air Quality: Limit strenuous outdoor activities, especially if you have respiratory issues.");
    } else if (air_quality.us_epa_index === 2) {
        score += 1;
        recommendations.push("Moderate Air Quality: Sensitive individuals should consider reducing outdoor exertion.");
    }

    // Determine overall risk level
    let level;
    if (score <= 2) level = 'Low';
    else if (score <= 5) level = 'Moderate';
    else if (score <= 8) level = 'High';
    else level = 'Very High';
    
    if (recommendations.length === 0) {
        recommendations.push("Environmental conditions are currently favorable. Enjoy your day!");
    }

    return { score, level, recommendations };
};


const Dashboard = () => {
    const [metrics, setMetrics] = useState(null);
    const [riskAssessment, setRiskAssessment] = useState(null); // New state for risk score
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchHealthMetrics = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/health-metrics');
                setMetrics(response.data);
                
                // Calculate and set risk assessment after fetching data
                const assessment = calculateRiskScore(response.data);
                setRiskAssessment(assessment);

                setError('');
            } catch (err) {
                console.error("Error fetching health metrics:", err);
                setError('Failed to load data. Is the backend server running?');
            } finally {
                setLoading(false);
            }
        };

        fetchHealthMetrics();
    }, []);

    if (loading) return <div style={styles.centerMessage}>Loading Dashboard...</div>;
    if (error) return <div style={{...styles.centerMessage, color: '#ff4d4d'}}>{error}</div>;
    if (!metrics || !riskAssessment) return <div style={styles.centerMessage}>No data available.</div>;

    const { location, weather, air_quality } = metrics;
    const { score, level, recommendations } = riskAssessment;

    const getAqiColor = (aqi) => (aqi <= 2 ? '#4caf50' : aqi <= 4 ? '#ff9800' : '#f44336');
    const getRiskColor = (riskLevel) => {
        switch (riskLevel) {
            case 'Low': return '#4caf50';
            case 'Moderate': return '#ffc107';
            case 'High': return '#ff9800';
            case 'Very High': return '#f44336';
            default: return '#718096';
        }
    };

    return (
        <div style={styles.dashboard}>
            <header style={styles.header}>
                <h1 style={styles.title}>HANALYSIS Dashboard</h1>
                <div style={styles.location}>
                    <p>{location.name}, {location.region}</p>
                    <small>{new Date().toLocaleString()}</small>
                </div>
            </header>

            <main style={styles.main}>
                {/* --- NEW: Risk Assessment Card --- */}
                <div style={{ ...styles.card, ...styles.riskCard, borderColor: getRiskColor(level) }}>
                    <h2 style={styles.cardTitle}>Overall Health Risk</h2>
                    <div style={styles.riskDisplay}>
                        <div style={{...styles.riskScoreCircle, backgroundColor: getRiskColor(level)}}>
                            <span style={styles.riskScoreText}>{score}</span>
                        </div>
                        <span style={{...styles.riskLevel, color: getRiskColor(level)}}>{level}</span>
                    </div>
                    <div style={styles.recommendations}>
                        <h3 style={styles.recommendationsTitle}>Recommendations:</h3>
                        <ul style={styles.recommendationsList}>
                            {recommendations.map((rec, index) => <li key={index}>{rec}</li>)}
                        </ul>
                    </div>
                </div>

                {/* Weather Card */}
                <div style={styles.card}>
                    <h2 style={styles.cardTitle}>Current Weather</h2>
                    <div style={styles.weatherMain}>
                        <span style={styles.weatherTemp}>{weather.temperature_celsius}°C</span>
                        <span style={styles.weatherCondition}>{weather.condition}</span>
                    </div>
                    <div style={styles.metricGrid}>
                        <div style={styles.metricItem}><DropletIcon /> Humidity: {weather.humidity_percent}%</div>
                        <div style={styles.metricItem}><WindIcon /> Wind: {weather.wind_kph} kph</div>
                        <div style={styles.metricItem}><SunIcon /> UV Index: {weather.uv_index}</div>
                        <div style={styles.metricItem}><DropletIcon /> Rainfall: {weather.rainfall_mm} mm</div>
                    </div>
                </div>

                {/* Air Quality Card */}
                <div style={styles.card}>
                    <h2 style={styles.cardTitle}>Air Quality Index (AQI)</h2>
                    <div style={{ ...styles.aqiValue, color: getAqiColor(air_quality.us_epa_index) }}>
                        {air_quality.us_epa_index}
                        <span style={styles.aqiLabel}>US EPA Index</span>
                    </div>
                    <div style={styles.metricGrid}>
                        <div style={styles.metricItem}>PM2.5: {air_quality.pm2_5.toFixed(2)} µg/m³</div>
                        <div style={styles.metricItem}>PM10: {air_quality.pm10.toFixed(2)} µg/m³</div>
                        <div style={styles.metricItem}>O₃: {air_quality.o3.toFixed(2)} µg/m³</div>
                        <div style={styles.metricItem}>NO₂: {air_quality.no2.toFixed(2)} µg/m³</div>
                    </div>
                </div>
            </main>
        </div>
    );
};

// --- Basic Styling ---
const styles = {
    dashboard: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        backgroundColor: '#f0f2f5', minHeight: '100vh', padding: '2rem', color: '#333',
    },
    header: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem',
    },
    title: { fontSize: '2rem', fontWeight: '600', color: '#1a202c' },
    location: { textAlign: 'right' },
    main: {
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem',
    },
    card: {
        backgroundColor: '#fff', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        display: 'flex', flexDirection: 'column',
    },
    cardTitle: {
        fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem',
    },
    weatherMain: {
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem',
    },
    weatherTemp: { fontSize: '3.5rem', fontWeight: '700' },
    weatherCondition: { fontSize: '1.25rem', color: '#718096' },
    metricGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: 'auto' },
    metricItem: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#4a5568' },
    aqiValue: { fontSize: '3.5rem', fontWeight: '700', textAlign: 'center', marginBottom: '0.5rem' },
    aqiLabel: { display: 'block', fontSize: '1rem', fontWeight: '500', color: '#718096' },
    centerMessage: {
        display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.5rem', fontFamily: 'sans-serif',
    },
    // New styles for the Risk Card
    riskCard: {
        borderTop: '4px solid', // The color will be set dynamically
    },
    riskDisplay: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        marginBottom: '1.5rem',
    },
    riskScoreCircle: {
        width: '100px', height: '100px', borderRadius: '50%', display: 'flex',
        alignItems: 'center', justifyContent: 'center', color: '#fff',
    },
    riskScoreText: { fontSize: '3rem', fontWeight: 'bold' },
    riskLevel: { fontSize: '1.5rem', fontWeight: '600' },
    recommendations: {},
    recommendationsTitle: { fontSize: '1rem', fontWeight: '600', color: '#4a5568', marginBottom: '0.5rem' },
    recommendationsList: {
        margin: 0, paddingLeft: '1.2rem', fontSize: '0.9rem', color: '#4a5568',
    },
};

export default Dashboard;

