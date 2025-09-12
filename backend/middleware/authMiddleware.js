const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// This middleware function acts as a gatekeeper for protected routes
const protect = async (req, res, next) => {
    let token;

    // Check if the request headers contain an "Authorization" token
    // The token is expected to be in the format: "Bearer <token>"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 1. Get token from header
            token = req.headers.authorization.split(' ')[1];

            // 2. Verify the token using our secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. Find the user associated with the token's ID
            // We attach the user object to the request (`req.user`) so that subsequent routes can access it
            // We exclude the password for security
            req.user = await User.findById(decoded.id).select('-password');
            
            // If user is found, proceed to the next step in the request-response cycle
            next();
        } catch (error) {
            console.error('Token verification failed:', error.message);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };
