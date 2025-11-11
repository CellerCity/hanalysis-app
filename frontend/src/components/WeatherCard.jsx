import React, { useState, useEffect, useRef } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

// Weather Icons
const SunIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>;
const SunIconSmall = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>;
const CloudyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>;
const RainyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16" y1="13" x2="16" y2="21"></line><line x1="12" y1="13" x2="12" y2="21"></line><line x1="8" y1="13" x2="8" y2="21"></line><path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"></path></svg>;
const StormIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>;
const SnowIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"></path><line x1="8" y1="16" x2="8.01" y2="16"></line><line x1="8" y1="20" x2="8.01" y2="20"></line><line x1="12" y1="18" x2="12.01" y2="18"></line><line x1="12" y1="22" x2="12.01" y2="22"></line><line x1="16" y1="16" x2="16.01" y2="16"></line><line x1="16" y1="20" x2="16.01" y2="20"></line></svg>;
const FogIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2v2M6 5h3M3 9h3m-3 4h12M6 18h12M9 22v-2"></path></svg>;
const WindIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"></path></svg>;
const DropletIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>;
const DragIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>;
const ResizeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>;

const WeatherCard = ({ initialPosition = null }) => {
    const { user } = useAuth();
    const [weather, setWeather] = useState(null);
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [weatherPosition, setWeatherPosition] = useState(() => {
        if (initialPosition) return initialPosition;
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const cardWidth = screenWidth * 0.225; // 22.5% of screen width
        const cardHeight = screenHeight * 0.325; // 32.5% of screen height
        const rightMargin = screenWidth * 0.04; // 4% from right edge
        const topMargin = screenHeight * 0.125; // 12.5% from top
        
        return {
            x: screenWidth - cardWidth - rightMargin,
            y: topMargin
        };
    });
    const [cardSize, setCardSize] = useState(() => {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        return {
            width: screenWidth * 0.225, // 22.5% of screen width
            height: screenHeight * 0.38 // 38% of screen height (increased to prevent scrollbar)
        };
    });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const weatherCardRef = useRef(null);

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                let data;
                if (user) {
                    const response = await api.get('/analysis/full');
                    data = response.data;
                    setWeather(data.metrics?.weather);
                    setLocation(data.metrics?.location);
                } else {
                    const response = await api.get('/health-metrics?location=Kharagpur');
                    data = response.data;
                    setWeather(data?.weather);
                    setLocation(data?.location);
                }
            } catch (err) {
                console.error("Failed to fetch weather:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchWeather();
    }, [user]);

    // Handle window resize to keep card in bounds
    useEffect(() => {
        const handleWindowResize = () => {
            if (weatherCardRef.current) {
                const maxX = window.innerWidth - weatherCardRef.current.offsetWidth;
                const maxY = window.innerHeight - weatherCardRef.current.offsetHeight;
                setWeatherPosition(prev => ({
                    x: Math.max(0, Math.min(prev.x, maxX)),
                    y: Math.max(0, Math.min(prev.y, maxY))
                }));
            }
        };

        window.addEventListener('resize', handleWindowResize);
        return () => window.removeEventListener('resize', handleWindowResize);
    }, [cardSize]);

    const getWeatherIcon = (condition) => {
        if (!condition) return <SunIcon />;
        const lowerCondition = condition.toLowerCase();
        if (lowerCondition.includes('sun') || lowerCondition.includes('clear')) return <SunIcon />;
        if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) return <RainyIcon />;
        if (lowerCondition.includes('storm') || lowerCondition.includes('thunder')) return <StormIcon />;
        if (lowerCondition.includes('snow') || lowerCondition.includes('sleet')) return <SnowIcon />;
        if (lowerCondition.includes('fog') || lowerCondition.includes('mist')) return <FogIcon />;
        return <CloudyIcon />;
    };

    const getWeatherTheme = (condition, temp) => {
        if (!condition) {
            return {
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                text: '#8B4513',
                iconColor: '#FF8C00',
                cardBg: 'rgba(255, 255, 255, 0.95)',
                metricsBg: 'rgba(255, 255, 255, 0.98)',
                metricsText: '#1a202c'
            };
        }
        const lowerCondition = condition.toLowerCase();
        const tempC = temp || 25;
        
        if (lowerCondition.includes('sun') || lowerCondition.includes('clear')) {
            if (tempC > 30) {
                return {
                    background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
                    text: '#8B4513',
                    iconColor: '#FF4500',
                    cardBg: 'rgba(255, 255, 255, 0.95)',
                    metricsBg: 'rgba(255, 255, 255, 0.98)',
                    metricsText: '#1a202c'
                };
            }
            return {
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                text: '#8B4513',
                iconColor: '#FF8C00',
                cardBg: 'rgba(255, 255, 255, 0.95)',
                metricsBg: 'rgba(255, 255, 255, 0.98)',
                metricsText: '#1a202c'
            };
        }
        if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) {
            return {
                background: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
                text: '#FFFFFF',
                iconColor: '#E3F2FD',
                cardBg: 'rgba(255, 255, 255, 0.95)',
                metricsBg: 'rgba(255, 255, 255, 0.98)',
                metricsText: '#1a202c'
            };
        }
        if (lowerCondition.includes('storm') || lowerCondition.includes('thunder')) {
            return {
                background: 'linear-gradient(135deg, #6C5CE7 0%, #5A4FCF 100%)',
                text: '#FFFFFF',
                iconColor: '#E8E4F5',
                cardBg: 'rgba(255, 255, 255, 0.95)',
                metricsBg: 'rgba(255, 255, 255, 0.98)',
                metricsText: '#1a202c'
            };
        }
        if (lowerCondition.includes('snow') || lowerCondition.includes('sleet')) {
            return {
                background: 'linear-gradient(135deg, #E8F4F8 0%, #B8D4E3 100%)',
                text: '#1a202c',
                iconColor: '#2C3E50',
                cardBg: 'rgba(255, 255, 255, 0.95)',
                metricsBg: 'rgba(26, 32, 44, 0.05)',
                metricsText: '#1a202c'
            };
        }
        if (lowerCondition.includes('fog') || lowerCondition.includes('mist')) {
            return {
                background: 'linear-gradient(135deg, #95A5A6 0%, #7F8C8D 100%)',
                text: '#FFFFFF',
                iconColor: '#E8E8E8',
                cardBg: 'rgba(255, 255, 255, 0.95)',
                metricsBg: 'rgba(255, 255, 255, 0.98)',
                metricsText: '#1a202c'
            };
        }
        return {
            background: 'linear-gradient(135deg, #95A5A6 0%, #7F8C8D 100%)',
            text: '#FFFFFF',
            iconColor: '#E8E8E8',
            cardBg: 'rgba(255, 255, 255, 0.95)',
            metricsBg: 'rgba(255, 255, 255, 0.98)',
            metricsText: '#1a202c'
        };
    };

    const handleMouseDown = (e) => {
        if (e.target.closest('.resize-handle') || e.target.classList.contains('resize-handle')) {
            e.preventDefault();
            e.stopPropagation();
            setIsResizing(true);
            if (weatherCardRef.current) {
                const rect = weatherCardRef.current.getBoundingClientRect();
                setResizeStart({
                    x: e.clientX,
                    y: e.clientY,
                    width: rect.width,
                    height: rect.height
                });
            }
        } else if (e.target.closest('.drag-handle') || e.target.classList.contains('drag-handle')) {
            e.preventDefault();
            setIsDragging(true);
            setDragOffset({
                x: e.clientX - weatherPosition.x,
                y: e.clientY - weatherPosition.y
            });
        }
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isResizing && weatherCardRef.current) {
                const deltaX = e.clientX - resizeStart.x;
                const deltaY = e.clientY - resizeStart.y;
                const newWidth = Math.max(280, Math.min(800, resizeStart.width + deltaX));
                const newHeight = Math.max(350, Math.min(900, resizeStart.height + deltaY));
                setCardSize({ width: newWidth, height: newHeight });
                
                // Adjust position if card would go off-screen
                const newX = weatherPosition.x;
                const newY = weatherPosition.y;
                const maxX = window.innerWidth - newWidth;
                const maxY = window.innerHeight - newHeight;
                if (newX > maxX || newY > maxY) {
                    setWeatherPosition(prev => ({
                        x: Math.max(0, Math.min(prev.x, maxX)),
                        y: Math.max(0, Math.min(prev.y, maxY))
                    }));
                }
            } else if (isDragging && weatherCardRef.current && !isResizing) {
                const newX = e.clientX - dragOffset.x;
                const newY = e.clientY - dragOffset.y;
                const maxX = window.innerWidth - weatherCardRef.current.offsetWidth;
                const maxY = window.innerHeight - weatherCardRef.current.offsetHeight;
                setWeatherPosition({
                    x: Math.max(0, Math.min(newX, maxX)),
                    y: Math.max(0, Math.min(newY, maxY))
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
        };

        if (isDragging || isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, dragOffset, resizeStart, weatherPosition]);

    if (loading || !weather) return null;

    const weatherTheme = getWeatherTheme(weather.condition, weather.temperature_celsius);
    
    // Responsive layout based on card size
    const isNarrow = cardSize.width < 400;
    const isWide = cardSize.width > 500;
    const isTall = cardSize.height > 600;
    const isShort = cardSize.height < 450;
    
    // Determine grid columns based on width
    const getGridColumns = () => {
        if (isNarrow) return '1fr';
        if (isWide) return '1fr 1fr 1fr 1fr';
        return '1fr 1fr';
    };
    
    // Responsive font sizes
    const tempSize = isShort ? '2.5rem' : (isTall ? '4.5rem' : '3.5rem');
    const iconSize = isShort ? 48 : (isTall ? 80 : 64);
    const titleSize = isShort ? '1.25rem' : '1.5rem';
    const metricValueSize = isShort ? '0.95rem' : (isTall ? '1.25rem' : '1.1rem');
    const metricLabelSize = isShort ? '0.65rem' : '0.75rem';
    
    const metricStyles = {
        metricGrid: { 
            display: 'grid', 
            gridTemplateColumns: getGridColumns(),
            gap: isShort ? '0.75rem' : '1.25rem', 
            marginTop: 'auto' 
        },
        metricItem: { 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '0.75rem', 
            padding: isShort ? '0.75rem' : '1rem',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '12px',
            transition: 'all 0.2s ease',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
        },
        iconWrapper: {
            width: isShort ? '32px' : '40px',
            height: isShort ? '32px' : '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '10px',
            flexShrink: 0,
            backgroundColor: 'rgba(100, 116, 139, 0.1)',
            border: '1px solid rgba(100, 116, 139, 0.2)',
            color: '#475569'
        },
        metricLabel: {
            fontSize: metricLabelSize,
            color: '#64748b',
            fontWeight: '500',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.25rem'
        },
        metricValue: {
            fontSize: metricValueSize,
            fontWeight: '700'
        }
    };
    
    // Get animation class based on weather condition
    const getWeatherAnimation = (condition) => {
        if (!condition) return 'weather-sunny';
        const lowerCondition = condition.toLowerCase();
        if (lowerCondition.includes('sun') || lowerCondition.includes('clear')) return 'weather-sunny';
        if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) return 'weather-rainy';
        if (lowerCondition.includes('storm') || lowerCondition.includes('thunder')) return 'weather-stormy';
        if (lowerCondition.includes('snow') || lowerCondition.includes('sleet')) return 'weather-snowy';
        if (lowerCondition.includes('cloud')) return 'weather-cloudy';
        if (lowerCondition.includes('fog') || lowerCondition.includes('mist')) return 'weather-foggy';
        return 'weather-cloudy';
    };

    // Create responsive weather icon component with animation
    const ResponsiveWeatherIcon = () => {
        const IconComponent = getWeatherIcon(weather.condition);
        const animationClass = getWeatherAnimation(weather.condition);
        return (
            <div className={animationClass} style={{ display: 'inline-block' }}>
                {React.cloneElement(IconComponent, { width: iconSize, height: iconSize })}
            </div>
        );
    };

    return (
        <>
            <style>{`
                @keyframes sunRotate {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes sunPulse {
                    0%, 100% { 
                        opacity: 1; 
                        filter: drop-shadow(0 0 20px rgba(255, 215, 0, 1)) drop-shadow(0 0 40px rgba(255, 165, 0, 0.8));
                        transform: scale(1);
                    }
                    50% { 
                        opacity: 0.9; 
                        filter: drop-shadow(0 0 35px rgba(255, 215, 0, 1.2)) drop-shadow(0 0 50px rgba(255, 165, 0, 1));
                        transform: scale(1.15);
                    }
                }
                @keyframes sunRays {
                    0%, 100% { opacity: 0.7; transform: translate(-50%, -50%) scale(1); }
                    50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
                }
                @keyframes rainFall {
                    0% { transform: translateY(-20px) translateX(0px); opacity: 0; }
                    5% { opacity: 1; }
                    95% { opacity: 1; }
                    100% { transform: translateY(35px) translateX(8px); opacity: 0; }
                }
                @keyframes lightning {
                    0%, 80%, 100% { 
                        opacity: 1; 
                        filter: brightness(1) drop-shadow(0 0 8px rgba(255, 255, 255, 0.6));
                        transform: scale(1);
                    }
                    3%, 8% { 
                        opacity: 2; 
                        filter: brightness(4) drop-shadow(0 0 25px rgba(255, 255, 255, 1));
                        transform: scale(1.2);
                    }
                    12%, 18% { 
                        opacity: 1; 
                        filter: brightness(1) drop-shadow(0 0 8px rgba(255, 255, 255, 0.6));
                        transform: scale(1);
                    }
                }
                @keyframes stormShake {
                    0%, 100% { transform: translateX(0) translateY(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px) translateY(-2px); }
                    20%, 40%, 60%, 80% { transform: translateX(4px) translateY(2px); }
                }
                @keyframes snowFall {
                    0% { transform: translateY(-20px) translateX(0px) rotate(0deg); opacity: 0; }
                    5% { opacity: 1; }
                    95% { opacity: 1; }
                    100% { transform: translateY(35px) translateX(15px) rotate(360deg); opacity: 0; }
                }
                @keyframes cloudMove {
                    0%, 100% { transform: translateX(0px) translateY(0px); }
                    25% { transform: translateX(8px) translateY(-3px); }
                    50% { transform: translateX(12px) translateY(0px); }
                    75% { transform: translateX(8px) translateY(3px); }
                }
                @keyframes fogDrift {
                    0%, 100% { opacity: 0.5; transform: translateX(0px) scale(1); }
                    50% { opacity: 0.9; transform: translateX(8px) scale(1.15); }
                }
                @keyframes cloudFloat {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-6px); }
                }
                
                .weather-sunny {
                    position: relative;
                }
                .weather-sunny svg {
                    animation: sunRotate 15s linear infinite, sunPulse 2.5s ease-in-out infinite;
                }
                .weather-sunny::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(255, 215, 0, 0.5) 0%, rgba(255, 165, 0, 0.3) 40%, transparent 70%);
                    transform: translate(-50%, -50%);
                    animation: sunRays 2s ease-in-out infinite;
                    pointer-events: none;
                }
                
                .weather-rainy {
                    position: relative;
                    overflow: visible;
                }
                .weather-rainy svg {
                    animation: cloudFloat 2s ease-in-out infinite;
                }
                .weather-rainy::after {
                    content: '';
                    position: absolute;
                    top: 20%;
                    left: 30%;
                    width: 3px;
                    height: 25px;
                    background: linear-gradient(to bottom, transparent, rgba(74, 144, 226, 1), rgba(74, 144, 226, 0.8));
                    border-radius: 2px;
                    animation: rainFall 0.5s linear infinite;
                }
                .weather-rainy::before {
                    content: '';
                    position: absolute;
                    top: 20%;
                    left: 50%;
                    width: 3px;
                    height: 25px;
                    background: linear-gradient(to bottom, transparent, rgba(74, 144, 226, 1), rgba(74, 144, 226, 0.8));
                    border-radius: 2px;
                    animation: rainFall 0.5s linear infinite 0.25s;
                }
                
                .weather-stormy {
                    position: relative;
                }
                .weather-stormy svg {
                    animation: lightning 1.8s ease-in-out infinite, stormShake 0.3s ease-in-out infinite;
                }
                
                .weather-snowy {
                    position: relative;
                    overflow: visible;
                }
                .weather-snowy svg {
                    animation: cloudFloat 2.5s ease-in-out infinite;
                }
                .weather-snowy::after {
                    content: '❄';
                    position: absolute;
                    top: 25%;
                    left: 35%;
                    font-size: 18px;
                    animation: snowFall 1.8s linear infinite;
                    pointer-events: none;
                }
                .weather-snowy::before {
                    content: '❄';
                    position: absolute;
                    top: 25%;
                    left: 55%;
                    font-size: 16px;
                    animation: snowFall 1.8s linear infinite 0.4s;
                    pointer-events: none;
                }
                
                .weather-cloudy svg {
                    animation: cloudMove 3s ease-in-out infinite, cloudFloat 2.5s ease-in-out infinite;
                }
                
                .weather-foggy svg {
                    animation: fogDrift 4s ease-in-out infinite;
                    opacity: 0.7;
                }
            `}</style>
        <div 
            ref={weatherCardRef}
            className="card"
            style={{
                position: 'fixed',
                left: `${weatherPosition.x}px`,
                top: `${weatherPosition.y}px`,
                width: `${cardSize.width}px`,
                height: `${cardSize.height}px`,
                minWidth: '280px',
                maxWidth: '800px',
                minHeight: '350px',
                maxHeight: '900px',
                overflow: 'auto',
                zIndex: (isDragging || isResizing) ? 1000 : 100,
                cursor: isDragging ? 'grabbing' : (isResizing ? 'nwse-resize' : 'default'),
                transform: isDragging ? 'scale(1.02)' : 'scale(1)',
                transition: (isDragging || isResizing) ? 'none' : 'transform 0.2s ease, box-shadow 0.2s ease, width 0.2s ease, height 0.2s ease',
                background: weatherTheme.cardBg,
                borderRadius: '24px',
                padding: isShort ? '1.25rem' : (isTall ? '2.5rem' : '2rem'),
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                resize: 'none'
            }}
            onMouseDown={handleMouseDown}
        >
            <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto', gap: '1.5rem' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: isShort ? '0.8rem' : '0.9rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: '500' }}>
                            {location?.name || 'Unknown'}, {location?.region || ''}
                        </div>
                        <h2 style={{ fontSize: titleSize, fontWeight: '700', color: '#1a202c', margin: 0 }}>Current Weather</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <div className="drag-handle" style={{ cursor: 'grab', color: '#64748b', opacity: 0.7, padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.05)' }} title="Drag to move">
                            <DragIcon />
                        </div>
                    </div>
                </div>
                
                {/* Weather Info Box */}
                <div style={{ 
                    background: weatherTheme.background,
                    borderRadius: '20px',
                    padding: isShort ? '1.5rem' : (isTall ? '2.5rem' : '2rem'),
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: isWide ? 'space-between' : 'flex-start',
                    gap: isWide ? '2rem' : '1rem',
                    flexWrap: isNarrow ? 'wrap' : 'nowrap'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: isShort ? '0.75rem' : '1rem', flex: isWide ? '0 0 auto' : '1' }}>
                        <div style={{ color: weatherTheme.iconColor, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))', flexShrink: 0 }}>
                            <ResponsiveWeatherIcon />
                        </div>
                        <div>
                            <div style={{ fontSize: tempSize, fontWeight: '800', color: weatherTheme.text, lineHeight: '1', textShadow: weatherTheme.text === '#FFFFFF' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none' }}>
                                {weather.temperature_celsius}°C
                            </div>
                            <div style={{ fontSize: isShort ? '0.95rem' : '1.1rem', color: weatherTheme.text, opacity: 0.95, fontWeight: '500', textTransform: 'capitalize', textShadow: weatherTheme.text === '#FFFFFF' ? '0 1px 3px rgba(0,0,0,0.2)' : 'none' }}>
                                {weather.condition}
                            </div>
                        </div>
                    </div>
                </div>
                {/* Metrics Section */}
                <div style={{
                    background: weatherTheme.metricsBg,
                    borderRadius: '20px',
                    padding: isShort ? '1rem' : '1.5rem',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                }}>
                    <div style={metricStyles.metricGrid}>
                        <div className="metric-item" style={metricStyles.metricItem}>
                            <div style={metricStyles.iconWrapper}>
                                <DropletIcon />
                            </div>
                            <div>
                                <div style={metricStyles.metricLabel}>Humidity</div>
                                <div style={{...metricStyles.metricValue, color: weatherTheme.metricsText}}>{weather.humidity_percent}%</div>
                            </div>
                        </div>
                        <div className="metric-item" style={metricStyles.metricItem}>
                            <div style={metricStyles.iconWrapper}>
                                <WindIcon />
                            </div>
                            <div>
                                <div style={metricStyles.metricLabel}>Wind Speed</div>
                                <div style={{...metricStyles.metricValue, color: weatherTheme.metricsText}}>{weather.wind_kph} kph</div>
                            </div>
                        </div>
                        <div className="metric-item" style={metricStyles.metricItem}>
                            <div style={metricStyles.iconWrapper}>
                                <SunIconSmall />
                            </div>
                            <div>
                                <div style={metricStyles.metricLabel}>UV Index</div>
                                <div style={{...metricStyles.metricValue, color: weatherTheme.metricsText}}>{weather.uv_index}</div>
                            </div>
                        </div>
                        <div className="metric-item" style={metricStyles.metricItem}>
                            <div style={metricStyles.iconWrapper}>
                                <DropletIcon />
                            </div>
                            <div>
                                <div style={metricStyles.metricLabel}>Rainfall</div>
                                <div style={{...metricStyles.metricValue, color: weatherTheme.metricsText}}>{weather.rainfall_mm} mm</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div 
                className="resize-handle"
                style={{
                    position: 'absolute',
                    bottom: '4px',
                    right: '4px',
                    width: '28px',
                    height: '28px',
                    cursor: 'nwse-resize',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    zIndex: 2,
                    opacity: 0.7,
                    transition: 'all 0.2s ease',
                    border: '1px solid rgba(0, 0, 0, 0.15)',
                    color: '#64748b'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
                    e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0.7';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                    e.currentTarget.style.transform = 'scale(1)';
                }}
                title="Drag to resize"
            >
                <ResizeIcon />
            </div>
        </div>
        </>
    );
};

export default WeatherCard;

