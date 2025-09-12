import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Profile from './pages/Profile.jsx';

const AppRouter = () => {
    const { user, loading } = useAuth();
    // Default to the login page if not authenticated
    const [currentPage, setCurrentPage] = useState(user ? 'dashboard' : 'login');

    const handleNavigation = (page) => {
        setCurrentPage(page);
    };

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>Authenticating...</div>;
    }

    if (user) {
        switch (currentPage) {
            case 'profile':
                return <Profile onNavigate={handleNavigation} />;
            case 'dashboard':
            default:
                return <Dashboard onNavigate={handleNavigation} />;
        }
    }

    // If no user is logged in, handle navigation between login and signup
    switch (currentPage) {
        case 'signup':
            return <Signup onNavigate={handleNavigation} />;
        case 'login':
        default:
            return <Login onNavigate={handleNavigation} />;
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

