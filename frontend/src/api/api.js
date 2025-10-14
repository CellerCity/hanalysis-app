import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attaches the token to every outgoing request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);


// --- THE FIX: Add a Response Interceptor to handle expired tokens ---
// This function will run on every response coming FROM the backend
api.interceptors.response.use(
    (response) => {
        // If the response is successful, just return it
        return response;
    },
    (error) => {
        // Check if the error is a 401 Unauthorized error
        if (error.response && error.response.status === 401) {
            console.log("Session expired or invalid. Logging out.");
            // Remove the invalid token
            localStorage.removeItem('token');
            // Force a reload of the page. Our AuthContext will then
            // see that there is no token and show the login screen.
            window.location.reload(); 
        }
        // For all other errors, just pass them along
        return Promise.reject(error);
    }
);


export default api;

