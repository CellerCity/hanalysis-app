import React, { useState, useEffect, useRef } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

// Weather Icons
const SunnyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </svg>
);

const CloudyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
    </svg>
);

const RainyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="16" y1="13" x2="16" y2="21"></line>
        <line x1="12" y1="13" x2="12" y2="21"></line>
        <line x1="8" y1="13" x2="8" y2="21"></line>
        <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"></path>
    </svg>
);

const StormIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
);

const SnowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"></path>
        <line x1="8" y1="16" x2="8.01" y2="16"></line>
        <line x1="8" y1="20" x2="8.01" y2="20"></line>
        <line x1="12" y1="18" x2="12.01" y2="18"></line>
        <line x1="12" y1="22" x2="12.01" y2="22"></line>
        <line x1="16" y1="16" x2="16.01" y2="16"></line>
        <line x1="16" y1="20" x2="16.01" y2="20"></line>
    </svg>
);

const FogIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 2v2M6 5h3M3 9h3m-3 4h12M6 18h12M9 22v-2"></path>
    </svg>
);

const WeatherWidget = () => {
    const { user } = useAuth();
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
    const [position, setPosition] = useState({ x: window.innerWidth - 100, y: 80 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const widgetRef = useRef(null);

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                let location;
                if (user) {
                    const { data } = await api.get('/analysis/full');
                    setWeather(data.metrics?.weather);
                } else {
                    const { data } = await api.get('/health-metrics?location=Kharagpur');
                    setWeather(data?.weather);
                }
            } catch (err) {
                console.error("Failed to fetch weather:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchWeather();
    }, [user]);

    const getWeatherIcon = (condition) => {
        if (!condition) return <SunnyIcon />;
        const lowerCondition = condition.toLowerCase();
        if (lowerCondition.includes('sun') || lowerCondition.includes('clear')) return <SunnyIcon />;
        if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) return <RainyIcon />;
        if (lowerCondition.includes('storm') || lowerCondition.includes('thunder')) return <StormIcon />;
        if (lowerCondition.includes('snow') || lowerCondition.includes('sleet')) return <SnowIcon />;
        if (lowerCondition.includes('fog') || lowerCondition.includes('mist')) return <FogIcon />;
        return <CloudyIcon />;
    };

    const getWeatherColor = (condition, temp) => {
        if (!condition) return { primary: '#FFB347', secondary: '#FF8C42' };
        const lowerCondition = condition.toLowerCase();
        const tempC = temp || 25;
        
        if (lowerCondition.includes('sun') || lowerCondition.includes('clear')) {
            return tempC > 30 ? { primary: '#FF6B35', secondary: '#F7931E' } : { primary: '#FFB347', secondary: '#FF8C42' };
        }
        if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) {
            return { primary: '#4A90E2', secondary: '#357ABD' };
        }
        if (lowerCondition.includes('storm') || lowerCondition.includes('thunder')) {
            return { primary: '#6C5CE7', secondary: '#5A4FCF' };
        }
        if (lowerCondition.includes('snow') || lowerCondition.includes('sleet')) {
            return { primary: '#E8F4F8', secondary: '#B8D4E3' };
        }
        if (lowerCondition.includes('fog') || lowerCondition.includes('mist')) {
            return { primary: '#95A5A6', secondary: '#7F8C8D' };
        }
        return { primary: '#95A5A6', secondary: '#7F8C8D' };
    };

    const handleMouseDown = (e) => {
        if (e.target.closest('.weather-drag-handle') || e.target.classList.contains('weather-drag-handle')) {
            e.preventDefault();
            setIsDragging(true);
            const rect = widgetRef.current.getBoundingClientRect();
            const currentX = position.x;
            const currentY = position.y;
            setDragOffset({
                x: e.clientX - currentX,
                y: e.clientY - currentY
            });
        }
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isDragging && widgetRef.current) {
                const newX = e.clientX - dragOffset.x;
                const newY = e.clientY - dragOffset.y;
                const maxX = window.innerWidth - widgetRef.current.offsetWidth;
                const maxY = window.innerHeight - widgetRef.current.offsetHeight;
                setPosition({
                    x: Math.max(0, Math.min(newX, maxX)),
                    y: Math.max(0, Math.min(newY, maxY))
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    if (loading || !weather) return null;

    const colors = getWeatherColor(weather.condition, weather.temperature_celsius);
    const WeatherIcon = () => getWeatherIcon(weather.condition);

    return (
        <>
            <style>{`
                .weather-widget {
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .weather-widget:hover {
                    transform: scale(1.05);
                }
                .weather-widget.dragging {
                    transform: scale(1.1);
                    cursor: grabbing !important;
                }
                .weather-drag-handle:hover {
                    opacity: 0.8;
                }
            `}</style>
            <div
                ref={widgetRef}
                className={`weather-widget ${isDragging ? 'dragging' : ''}`}
                style={{
                    position: 'fixed',
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    zIndex: isDragging ? 10000 : 9999,
                    cursor: isDragging ? 'grabbing' : 'pointer',
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                    borderRadius: isExpanded ? '20px' : '50px',
                    padding: isExpanded ? '1.5rem' : '0.75rem 1rem',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                    color: '#fff',
                    minWidth: isExpanded ? '280px' : 'auto',
                    transition: isDragging ? 'none' : 'all 0.3s ease',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255, 255, 255, 0.3)'
                }}
                onClick={() => !isDragging && setIsExpanded(!isExpanded)}
                onMouseDown={handleMouseDown}
            >
                {isExpanded ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <WeatherIcon />
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                                        {weather.temperature_celsius}°C
                                    </div>
                                    <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                                        {weather.condition}
                                    </div>
                                </div>
                            </div>
                            <div className="weather-drag-handle" style={{ cursor: 'grab', opacity: 0.7, padding: '0.25rem' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="9" cy="12" r="1"></circle>
                                    <circle cx="9" cy="5" r="1"></circle>
                                    <circle cx="9" cy="19" r="1"></circle>
                                    <circle cx="15" cy="12" r="1"></circle>
                                    <circle cx="15" cy="5" r="1"></circle>
                                    <circle cx="15" cy="19" r="1"></circle>
                                </svg>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                            <div>Humidity: {weather.humidity_percent}%</div>
                            <div>Wind: {weather.wind_kph} kph</div>
                            <div>UV: {weather.uv_index}</div>
                            <div>Rain: {weather.rainfall_mm}mm</div>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <WeatherIcon />
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>
                            {weather.temperature_celsius}°C
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default WeatherWidget;

