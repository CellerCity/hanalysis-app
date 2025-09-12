import React, { createContext, useState, useContext, useEffect } from 'react';

// --- IMPORTANT SETUP STEP ---
// This file uses a package to decode the user's login token.
// Please install it by running this command in your FRONTEND terminal:
//
// npm install jwt-decode
//
// After installing, your app should work correctly.
// --------------------------

import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const isExpired = decoded.exp * 1000 < Date.now();
                if (isExpired) {
                    logout();
                } else {
                    setUser({ name: decoded.name, location: decoded.location });
                }
            } catch (error) {
                console.error("Invalid token:", error);
                logout(); // Clear invalid token
            }
        }
        setLoading(false); // Finished loading auth state
    }, []);

    const login = (userData) => {
        localStorage.setItem('token', userData.token);
        setUser({ name: userData.name, location: userData.location });
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    // The value provided to consuming components
    const value = { user, login, logout, loading };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use the auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === null) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

