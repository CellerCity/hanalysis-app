import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';

// This component handles the routing logic based on authentication state
const AppRouter = () => {
    const { user, loading } = useAuth();
    const [page, setPage] = React.useState('login');

    // Effect to handle page navigation when auth state changes
    React.useEffect(() => {
        if (!loading) { // Only navigate once auth state is confirmed
            if (user) {
                setPage('dashboard');
            } else {
                setPage('login'); // Default to login if no user
            }
        }
    }, [user, loading]);

    // Show a loading screen while we verify the user's token
    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>Authenticating...</div>;
    }

    // Render page based on state
    if (page === 'dashboard') {
        return <Dashboard />;
    }
    if (page === 'signup') {
        return <Signup switchToLogin={() => setPage('login')} />;
    }
    return <Login switchToSignup={() => setPage('signup')} />;
};

// The main App component's only job is to provide the AuthContext
// This ensures any child component (like Dashboard) can use the useAuth() hook.
function App() {
    return (
        <AuthProvider>
            <AppRouter />
        </AuthProvider>
    );
}

export default App;

