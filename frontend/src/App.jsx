import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Profile from './pages/Profile.jsx';
import Chat from './pages/Chat.jsx'; // Import the new Chat page

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
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>Loading HANALYSIS...</div>;
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

