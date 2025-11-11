// src/components/ForecastCard.jsx

import React from 'react';

// --- (NEW) Add helper icons ---
const RainIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 13.5A4.5 4.5 0 0 0 7 13.5c0 1.5.8 2.8 2 3.5H7m11-3.5a4.5 4.5 0 0 0-9 0c0 1.5.8 2.8 2 3.5h7c1.2-.7 2-2 2-3.5Z"/>
        <path d="M16 14.5v3M8 14.5v3M12 16.5v3M12 13.5v-1.5a4.5 4.5 0 0 0-9 0"/>
    </svg>
);
const WindIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>
    </svg>
);
const UvIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.9 4.9 1.4 1.4"/><path d="m17.7 17.7 1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m4.9 19.1 1.4-1.4"/><path d="m17.7 6.3 1.4-1.4"/>
    </svg>
);
// --- End of new icons ---

// Define component styles
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
        marginBottom: '1rem',
        color: '#1e293b',
        letterSpacing: '-0.01em',
    },
    forecastContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '1rem',
    },
    dayItem: {
        flex: 1,
        padding: '1rem',
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        textAlign: 'center',
        border: '1px solid #e2e8f0',
        display: 'flex', // Make this a flex column
        flexDirection: 'column', // to space content
        justifyContent: 'space-between', //
    },
    dayDate: {
        fontWeight: 'bold',
        fontSize: '0.9rem',
        color: '#555',
    },
    dayTemp: {
        fontSize: '1.1rem',
        color: '#111',
        margin: '0.5rem 0',
    },
    dayCondition: {
        fontSize: '0.8rem',
        color: '#777',
        minHeight: '32px', // Give condition text space
    },
    dayIcon: {
        width: '50px',
        height: '50px',
        margin: '0.5rem auto', // Adjusted margin
    },
    // --- (NEW) Styles for the extra info ---
    extraInfo: {
        marginTop: '1rem',
        paddingTop: '0.75rem',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        fontSize: '0.85rem',
        color: '#475569',
    },
    infoItem: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.4rem',
    }
    // --- End of new styles ---
};

// Helper to format the date (e.g., "Mon", "Tue")
const formatDay = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
};

// The component
const ForecastCard = ({ forecast }) => {
    if (!forecast || forecast.length === 0) {
        return <p>Forecast data not available.</p>;
    }

    return (
        <div className="card" style={styles.card}>
            <h2 style={styles.cardTitle}>3-Day Forecast</h2>
            <div style={styles.forecastContainer}>
                {forecast.map(day => (
                    <div key={day.date} style={styles.dayItem}>
                        <div>
                            <div style={styles.dayDate}>{formatDay(day.date)}</div>
                            <img
                                src={day.icon}
                                alt={day.condition}
                                style={styles.dayIcon}
                            />
                            <div style={styles.dayTemp}>
                                <strong>{day.maxtemp_c.toFixed(0)}°</strong> / {day.mintemp_c.toFixed(0)}°
                            </div>
                            <div style={styles.dayCondition}>{day.condition}</div>
                        </div>

                        {/* --- (NEW) Add the extra info block --- */}
                        <div style={styles.extraInfo}>
                            <div style={styles.infoItem}>
                                <RainIcon />
                                <strong>{day.daily_chance_of_rain}%</strong>
                            </div>
                            <div style={styles.infoItem}>
                                <UvIcon />
                                <span>{day.uv} (UV)</span>
                            </div>
                            <div style={styles.infoItem}>
                                <WindIcon />
                                <span>{day.maxwind_kph.toFixed(0)} kph</span>
                            </div>
                        </div>
                        {/* --- End of new info block --- */}

                    </div>
                ))}
            </div>
        </div>
    );
};

export default ForecastCard;