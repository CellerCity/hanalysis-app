import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Profile from './pages/Profile.jsx';
import Chat from './pages/Chat.jsx';

const AppRouter = () => {
    const { user, loading } = useAuth();
    const [currentPage, setCurrentPage] = useState('dashboard');

    const handleNavigation = (page) => {
        setCurrentPage(page);
    };

    useEffect(() => {
        if (!loading) {
            if (user && (currentPage === 'login' || currentPage === 'signup')) {
                setCurrentPage('dashboard');
            } else if (!user && (currentPage === 'profile' || currentPage === 'chat')) {
                setCurrentPage('login');
            }
        }
    }, [user, loading, currentPage]);

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

    // Main routing logic
    switch (currentPage) {
        case 'login':
            return <Login onNavigate={handleNavigation} />;
        case 'signup':
            return <Signup onNavigate={handleNavigation} />;
        case 'profile':
            return user ? <Profile onNavigate={handleNavigation} /> : <Login onNavigate={handleNavigation} />;
        case 'chat':
            return user ? <Chat onNavigate={handleNavigation} /> : <Login onNavigate={handleNavigation} />;
        case 'dashboard':
        default:
            return <Dashboard onNavigate={handleNavigation} />;
    }
};

const App = () => {
    return (
        <AuthProvider>
            <AppRouter />
        </AuthProvider>
    );
};

export default App;

