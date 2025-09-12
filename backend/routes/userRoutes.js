const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios'); // We need axios for the IP API call

// --- Helper function to generate a JWT ---
// This now uses the most current location for the token payload
const generateToken = (user) => {
    const locationForToken = user.currentLocation || user.location;
    return jwt.sign(
        { 
            id: user._id,
            name: user.name,
            email: user.email,
            location: locationForToken 
        },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
};

// @route   POST /api/users/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
    const { name, email, password, age, location } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }
        
        // user = new User({ name, email, password, age, location, currentLocation: location });
        user = new User({
        name,
        email,
        password,
        age,
        location,
        currentLocation: location,
        locationHistory: [location] // Initialize history with signup location
        });
        
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        console.log('New user created:', user.email);
        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            location: user.currentLocation,
            token: generateToken(user),
        });
    } catch (error) {
        console.error('Registration error:', error.message);
        res.status(500).send('Server error');
    }
});

// @route   POST /api/users/login
// @desc    Authenticate user, update location, & get token
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Check for user and explicitly select the password
        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        let determinedLocation;

        // --- IP Geolocation Logic ---
        const ip = req.ip || req.connection.remoteAddress;
        console.log(`[DEBUG] Attempting geolocation for IP: ${ip}`);

        try {
            const geoResponse = await axios.get(`http://ip-api.com/json/${ip}`);
            console.log('[DEBUG] Geolocation API Response:', JSON.stringify(geoResponse.data, null, 2));

            if (geoResponse.data && geoResponse.data.status === 'success' && geoResponse.data.city) {
                determinedLocation = geoResponse.data.city;
                console.log(`[DEBUG] Live location detected: ${determinedLocation}`);
            } else {
                // This block will be hit for ::1 with status: "fail"
                throw new Error(`Geolocation API failed with status: ${geoResponse.data.status || 'unknown'}`);
            }
        } catch (geoError) {
            console.log(`[INFO] Geolocation failed: ${geoError.message}. Checking for development fallback.`);
            // If live detection fails, check for the dev fallback.
            if (process.env.DEV_DEFAULT_LOCATION) {
                determinedLocation = process.env.DEV_DEFAULT_LOCATION;
                console.log(`[DEBUG] Using development fallback location: ${determinedLocation}`);
            } else {
                // If no dev fallback, use the last known location from the DB.
                determinedLocation = user.currentLocation || user.location;
                console.log(`[DEBUG] Using last known database location: ${determinedLocation}`);
            }
        }

        // --- Database Update Logic ---
        // Now, update the user's record with the determined location, whatever its source was.
        if (user.currentLocation !== determinedLocation) {
            console.log(`[DEBUG] New location detected. Old: ${user.currentLocation}, New: ${determinedLocation}. Updating database.`);
            user.currentLocation = determinedLocation;
            if (!user.locationHistory.includes(determinedLocation)) {
                user.locationHistory.push(determinedLocation);
            }
            await user.save();
            console.log(`[SUCCESS] User ${user.email} location updated to ${determinedLocation}`);
        } else {
            console.log(`[DEBUG] Location has not changed. Current location is still ${determinedLocation}.`);
        }

        // --- Respond with token and data ---
        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            location: determinedLocation, // Send the most up-to-date location
            token: generateToken(user), // generateToken will now use the newly saved user.currentLocation
        });

    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;

