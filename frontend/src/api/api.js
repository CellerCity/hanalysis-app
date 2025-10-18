import axios from 'axios';

// --- THE FIX: Use an environment variable for the base URL ---
// When we run `npm run dev`, Vite leaves this blank, so it falls back to localhost.
// When we deploy, Vite will use the VITE_API_URL we set on Render.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor (remains the same)
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

// Response Interceptor (remains the same)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            window.location.reload(); 
        }
        return Promise.reject(error);
    }
);

export default api;

