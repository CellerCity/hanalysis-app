import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import WeatherCard from '../components/WeatherCard';
import ForecastCard from '../components/ForecastCard';
import AqiCard from '../components/AqiCard';

// Helper Components - Weather Icons
const SunIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>;
const SunIconSmall = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>;
const CloudyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>;
const RainyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16" y1="13" x2="16" y2="21"></line><line x1="12" y1="13" x2="12" y2="21"></line><line x1="8" y1="13" x2="8" y2="21"></line><path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"></path></svg>;
const StormIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>;
const SnowIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"></path><line x1="8" y1="16" x2="8.01" y2="16"></line><line x1="8" y1="20" x2="8.01" y2="20"></line><line x1="12" y1="18" x2="12.01" y2="18"></line><line x1="12" y1="22" x2="12.01" y2="22"></line><line x1="16" y1="16" x2="16.01" y2="16"></line><line x1="16" y1="20" x2="16.01" y2="20"></line></svg>;
const FogIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2v2M6 5h3M3 9h3m-3 4h12M6 18h12M9 22v-2"></path></svg>;
const WindIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"></path></svg>;
const DropletIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>;
const DragIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>;

const Dashboard = ({ onNavigate }) => {
    const { user, logout } = useAuth();
    const [metrics, setMetrics] = useState(null);
    const [riskAssessment, setRiskAssessment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError('');
            try {
                if (user) {
                    const { data } = await api.get('/analysis/full');
                    setRiskAssessment(data.analysis);
                    setMetrics(data.metrics);
                } else {
                    const { data } = await api.get('/health-metrics');
                    setMetrics(data);
                    setRiskAssessment(data.analysis);
                }
            } catch (err) {
                console.error("Dashboard fetch error:", err);
                setError('Failed to load dashboard data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);


    if (loading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff'
            }}>
                <style>{`
                    @keyframes pulse {
                        0%, 100% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.7; transform: scale(1.1); }
                    }
                    @keyframes float {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(-20px); }
                    }
                    .health-icon {
                        animation: float 3s ease-in-out infinite;
                    }
                    .health-icon:nth-child(2) {
                        animation-delay: 0.5s;
                    }
                    .health-icon:nth-child(3) {
                        animation-delay: 1s;
                    }
                `}</style>
                <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
                    <div className="health-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }}>
                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"></path>
                        </svg>
                    </div>
                    <div className="health-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }}>
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M12 6v6l4 2"></path>
                        </svg>
                    </div>
                    <div className="health-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }}>
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                        </svg>
                    </div>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600', animation: 'pulse 2s ease-in-out infinite' }}>
                    Analyzing your health data...
                </div>
            </div>
        );
    }
    if (error) return <div style={{...styles.centerMessage, color: '#ff4d4d'}}>{error}</div>;
    if (!metrics?.location || !metrics?.weather || !metrics?.air_quality || !metrics?.forecast || !riskAssessment?.recommendations) {
         return <div style={styles.centerMessage}>Could not load complete data for your location. Please try again later.</div>;
    }

    const { location, air_quality, weather, forecast } = metrics;
    const { riskScore, riskLevel, summary, recommendations } = riskAssessment;

    const getRiskColor = (level) => {
        switch (level) {
            case 'Low': return '#4caf50';
            case 'Moderate': return '#ffc107';
            case 'High': return '#ff9800';
            case 'Very High': return '#f44336';
            default: return '#718096';
        }
    };

    const getRiskTheme = (level) => {
        switch (level) {
            case 'Low':
                return {
                    primary: '#10b981',
                    secondary: '#059669',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
                    border: '#10b981',
                    text: '#065f46',
                    iconBg: 'rgba(16, 185, 129, 0.2)'
                };
            case 'Moderate':
                return {
                    primary: '#f59e0b',
                    secondary: '#d97706',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)',
                    border: '#f59e0b',
                    text: '#92400e',
                    iconBg: 'rgba(245, 158, 11, 0.2)'
                };
            case 'High':
                return {
                    primary: '#f97316',
                    secondary: '#ea580c',
                    background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%)',
                    border: '#f97316',
                    text: '#9a3412',
                    iconBg: 'rgba(249, 115, 22, 0.2)'
                };
            case 'Very High':
                return {
                    primary: '#ef4444',
                    secondary: '#dc2626',
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
                    border: '#ef4444',
                    text: '#991b1b',
                    iconBg: 'rgba(239, 68, 68, 0.2)'
                };
            default:
                return {
                    primary: '#718096',
                    secondary: '#4a5568',
                    background: 'linear-gradient(135deg, rgba(113, 128, 150, 0.1) 0%, rgba(74, 85, 104, 0.05) 100%)',
                    border: '#718096',
                    text: '#2d3748',
                    iconBg: 'rgba(113, 128, 150, 0.2)'
                };
        }
    };

    const riskTheme = getRiskTheme(riskLevel);
    
    // Robustly render recommendations
    const renderRecommendation = (rec, index) => {
        if (typeof rec === 'string') {
            return <li key={index}>{rec}</li>;
        }
        if (typeof rec === 'object' && rec !== null) {
            const recommendationText = rec.recommendation || rec.detail || rec.measure || rec.content || JSON.stringify(rec);
            return <li key={index}>{recommendationText}</li>;
        }
        return null;
    };

    return (
        <>
            <style>{`
                button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15) !important;
                }
                .nav-button:hover {
                    border-color: #667eea !important;
                    color: #667eea !important;
                }
                .auth-button:hover {
                    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6) !important;
                }
                .drag-handle:hover {
                    background-color: #f1f5f9;
                    color: #667eea;
                }
                .drag-handle:active {
                    cursor: grabbing !important;
                }
                .metric-item:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                    background-color: #f1f5f9;
                }
                .card:hover {
                    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.08) !important;
                }
            `}</style>
            <div style={styles.dashboard}>
                <header style={styles.header}>
                <div>
                    <h1 style={styles.title}>Welcome, {user?.name || 'Guest'}!</h1>
                    <div style={styles.location}><p>{location.name}, {location.region}</p></div>
                </div>
                <div style={styles.headerActions}>
                    {user ? (
                        <>
                            <button onClick={() => onNavigate('chat')} className="nav-button" style={styles.navButton}>Ask AI</button>
                            <button onClick={() => onNavigate('profile')} className="nav-button" style={styles.navButton}>My Profile</button>
                            <button onClick={logout} className="auth-button" style={styles.authButton}>Logout</button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => onNavigate('login')} className="nav-button" style={styles.navButton}>Login</button>
                            <button onClick={() => onNavigate('signup')} className="auth-button" style={styles.authButton}>Sign Up</button>
                        </>
                    )}
                </div>
            </header>
            <main style={styles.main}>
                <div 
                    className="card" 
                    style={{ 
                        ...styles.card, 
                        ...styles.riskCard, 
                        borderTopColor: riskTheme.border,
                        borderTopWidth: '6px',
                        borderTopStyle: 'solid',
                        background: `linear-gradient(135deg, ${riskTheme.primary}15 0%, ${riskTheme.secondary}08 100%), #ffffff`,
                        gridColumn: '1 / -1'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            backgroundColor: riskTheme.iconBg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: riskTheme.primary
                        }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"></path>
                            </svg>
                        </div>
                        <h2 style={{...styles.cardTitle, color: riskTheme.text, marginBottom: 0}}>Overall Health Risk</h2>
                    </div>
                    {riskScore && <div style={styles.riskDisplay}>
                        <div style={{
                            ...styles.riskScoreCircle, 
                            background: `linear-gradient(135deg, ${riskTheme.primary} 0%, ${riskTheme.secondary} 100%)`,
                            boxShadow: `0 8px 24px ${riskTheme.primary}40`
                        }}>
                            <span style={styles.riskScoreText}>{riskScore}</span>
                        </div>
                        <span style={{
                            ...styles.riskLevel, 
                            color: riskTheme.primary,
                            background: riskTheme.iconBg,
                            padding: '0.5rem 1.5rem',
                            borderRadius: '20px',
                            fontWeight: '700'
                        }}>{riskLevel}</span>
                    </div>}
                     <p style={{...styles.summaryText, color: riskTheme.text}}>{summary}</p>
                    <div style={{
                        ...styles.recommendations,
                        backgroundColor: 'rgba(255, 255, 255, 0.6)',
                        borderColor: riskTheme.border + '40'
                    }}>
                        <h3 style={{...styles.recommendationsTitle, color: riskTheme.text}}>Recommendations:</h3>
                        <ul style={{...styles.recommendationsList, color: riskTheme.text}}>
                            {recommendations.map(renderRecommendation)}
                        </ul>
                    </div>
                </div>
                <div style={styles.subGrid}>
                    <AqiCard air_quality={air_quality} />
                    <ForecastCard forecast={forecast} />
                    <WeatherCard weather={weather} />
                </div>
            </main>
        </div>
        </>
    );
};
const styles = {
    dashboard: { 
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh', 
        padding: '2rem', 
        color: '#1a202c',
        position: 'relative',
        overflow: 'auto'
    },
    header: { 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2.5rem',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '1.5rem 2rem',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(10px)'
    },
    title: { 
        fontSize: '2.25rem', 
        fontWeight: '700', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        margin: 0,
        letterSpacing: '-0.02em'
    },
    location: { 
        textAlign: 'left', 
        color: '#64748b',
        fontSize: '0.95rem',
        marginTop: '0.25rem',
        fontWeight: '500'
    },
    headerActions: { 
        display: 'flex', 
        gap: '0.75rem' 
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
    authButton: { 
        padding: '0.75rem 1.5rem', 
        fontSize: '0.95rem', 
        fontWeight: '600', 
        color: '#fff', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none', 
        borderRadius: '10px', 
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
    },
    main: { 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '2rem',
        maxWidth: '1400px',
        margin: '0 auto'
    },
    subGrid: { 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
        gap: '2rem' 
    },
    noDataText: { 
        textAlign: 'center', 
        color: '#94a3b8', 
        marginTop: '2rem',
        fontSize: '0.95rem'
    },
    card: { 
        backgroundColor: '#ffffff', 
        borderRadius: '20px', 
        padding: '2rem', 
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05)', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(10px)'
    },
    weatherCard: {
        minWidth: '320px',
        maxWidth: '420px'
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
    },
    cardTitle: { 
        fontSize: '1.5rem', 
        fontWeight: '700', 
        marginBottom: 0,
        color: '#1e293b',
        letterSpacing: '-0.01em'
    },
    dragHandle: {
        cursor: 'grab',
        color: '#94a3b8',
        padding: '0.5rem',
        borderRadius: '8px',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    weatherMain: { 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '0.5rem', 
        marginBottom: '2rem',
        padding: '1.5rem',
        background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
        borderRadius: '16px'
    },
    weatherTemp: { 
        fontSize: '4rem', 
        fontWeight: '800',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        lineHeight: '1'
    },
    weatherCondition: { 
        fontSize: '1.1rem', 
        color: '#64748b',
        fontWeight: '500',
        textTransform: 'capitalize'
    },
    metricGrid: { 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '1.25rem', 
        marginTop: 'auto' 
    },
    metricItem: { 
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: '0.75rem', 
        padding: '1rem',
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        transition: 'all 0.2s ease'
    },
    iconWrapper: {
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        borderRadius: '10px',
        color: '#667eea',
        flexShrink: 0
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
    centerMessage: { 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        fontSize: '1.5rem', 
        fontFamily: 'sans-serif',
        color: '#fff',
        fontWeight: '500'
    },
    riskCard: { 
        borderTop: '4px solid',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.98) 100%)',
        backdropFilter: 'blur(20px)'
    },
    riskDisplay: { 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '0.75rem', 
        marginBottom: '2rem' 
    },
    riskScoreCircle: { 
        width: '120px', 
        height: '120px', 
        borderRadius: '50%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        color: '#fff',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
    },
    riskScoreText: { 
        fontSize: '3.5rem', 
        fontWeight: '800' 
    },
    riskLevel: { 
        fontSize: '1.75rem', 
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
    },
    summaryText: { 
        fontStyle: 'normal', 
        color: '#475569', 
        textAlign: 'center', 
        marginBottom: '1.5rem', 
        borderTop: '2px solid #e2e8f0', 
        paddingTop: '1.5rem',
        fontSize: '1.05rem',
        lineHeight: '1.6',
        fontWeight: '500'
    },
    recommendations: {
        backgroundColor: '#f8fafc',
        padding: '1.5rem',
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
    },
    recommendationsTitle: { 
        fontSize: '1.1rem', 
        fontWeight: '700', 
        color: '#1e293b', 
        marginBottom: '1rem',
        letterSpacing: '-0.01em'
    },
    recommendationsList: { 
        margin: 0, 
        paddingLeft: '1.5rem', 
        fontSize: '0.95rem', 
        color: '#475569',
        lineHeight: '1.8',
        listStyleType: 'disc'
    }
};

export default Dashboard;

