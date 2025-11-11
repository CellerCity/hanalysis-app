// src/components/AqiCard.jsx

import React from 'react';

// Helper function moved from Dashboard
const getAqiColor = (aqi) => {
    if (!aqi) return '#718096'; // Default color
    if (aqi <= 2) return '#4caf50'; // Good
    if (aqi <= 4) return '#ff9800'; // Moderate
    return '#f44336'; // Unhealthy
};

// Styles moved from Dashboard
const styles = {
    card: {
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        padding: '2rem',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        border: '1px solid rgba(255, 255, 255, 0.2)',
    },
    cardTitle: {
        fontSize: '1.5rem',
        fontWeight: '700',
        marginBottom: '1rem', // Added margin
        color: '#1e293b',
        letterSpacing: '-0.01em',
    },
    aqiValue: {
        fontSize: '4rem',
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: '0.5rem',
        lineHeight: '1'
    },
    aqiLabel: {
        display: 'block',
        fontSize: '0.9rem',
        fontWeight: '600',
        color: '#64748b',
        marginTop: '0.5rem',
        textTransform: 'uppercase',
        letterSpacing: '0.1em'
    },
    metricGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1.25rem',
        marginTop: 'auto'
    },
    metricItem: {
        display: 'flex',
        flexDirection: 'column', // Changed for label/value stack
        gap: '0.25rem', // Small gap between label and value
        padding: '1rem',
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        transition: 'all 0.2s ease'
    },
    metricLabel: {
        fontSize: '0.75rem',
        color: '#64748b',
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '0.25rem'
    },
    metricValue: {
        fontSize: '1.1rem',
        color: '#1e293b',
        fontWeight: '700'
    },
    noDataText: {
        textAlign: 'center',
        color: '#94a3b8',
        marginTop: '2rem',
        fontSize: '0.95rem'
    }
};

const AqiCard = ({ air_quality }) => {
    return (
        <div className="card" style={styles.card}>
            <h2 style={styles.cardTitle}>Air Quality Index (AQI)</h2>
            {air_quality?.us_epa_index ? (
                <>
                    <div style={{ ...styles.aqiValue, color: getAqiColor(air_quality.us_epa_index) }}>
                        {air_quality.us_epa_index}
                        <span style={styles.aqiLabel}>US EPA Index</span>
                    </div>
                    <div style={styles.metricGrid}>
                        <div className="metric-item" style={styles.metricItem}>
                            <div style={styles.metricLabel}>PM2.5</div>
                            <div style={styles.metricValue}>{air_quality.pm2_5.toFixed(2)} µg/m³</div>
                        </div>
                        <div className="metric-item" style={styles.metricItem}>
                            <div style={styles.metricLabel}>PM10</div>
                            <div style={styles.metricValue}>{air_quality.pm10.toFixed(2)} µg/m³</div>
                        </div>
                        <div className="metric-item" style={styles.metricItem}>
                            <div style={styles.metricLabel}>O₃</div>
                            <div style={styles.metricValue}>{air_quality.o3.toFixed(2)} µg/m³</div>
                        </div>
                        <div className="metric-item" style={styles.metricItem}>
                            <div style={styles.metricLabel}>NO₂</div>
                            <div style={styles.metricValue}>{air_quality.no2.toFixed(2)} µg/m³</div>
                        </div>
                    </div>
                </>
            ) : (
                <p style={styles.noDataText}>AQI data not available for this location.</p>
            )}
        </div>
    );
};

export default AqiCard;