import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Profile from './pages/Profile.jsx';

const AppRouter = () => {
    const { user, loading } = useAuth();
    // --- THE FIX: The default page for EVERYONE is the dashboard ---
    const [currentPage, setCurrentPage] = useState('dashboard');

    const handleNavigation = (page) => {
        setCurrentPage(page);
    };

    // This effect handles navigation changes when the user's login state changes
    useEffect(() => {
        if (!loading) {
            if (user && (currentPage === 'login' || currentPage === 'signup')) {
                // If a user just logged in, send them to the dashboard
                setCurrentPage('dashboard');
            } else if (!user && currentPage === 'profile') {
                // If a logged-out user tries to access a protected page, send them to login
                setCurrentPage('login');
            }
        }
    }, [user, loading, currentPage]);

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>Loading HANALYSIS...</div>;
    }

    // --- Simplified Routing ---
    switch (currentPage) {
        case 'login':
            return <Login onNavigate={handleNavigation} />;
        case 'signup':
            return <Signup onNavigate={handleNavigation} />;
        case 'profile':
            return user ? <Profile onNavigate={handleNavigation} /> : <Login onNavigate={handleNavigation} />;
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

