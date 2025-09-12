import axios from 'axios';

// Create a new instance of axios with a custom configuration
const api = axios.create({
    baseURL: 'http://localhost:5000/api', // The base URL for all our API calls
    headers: {
        'Content-Type': 'application/json',
    },
});

/*
  This is an interceptor. It's a function that runs BEFORE every single request
  that is sent using this 'api' instance. This is the perfect place to
  dynamically add the authentication token to our headers.
*/
api.interceptors.request.use(
    (config) => {
        // Get the token from localStorage on every request
        const token = localStorage.getItem('token');
        if (token) {
            // If the token exists, add it to the Authorization header
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config; // Continue with the request
    },
    (error) => {
        // If there's an error during the request setup, reject the promise
        return Promise.reject(error);
    }
);

export default api;
