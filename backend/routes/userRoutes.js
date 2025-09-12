const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const generateToken = (user) => { /* ... no changes needed here ... */
    const locationForToken = user.currentLocation || user.location;
    return jwt.sign(
        { id: user._id, name: user.name, email: user.email, location: locationForToken },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
};

// @route   POST /api/users/register
// @desc    Register a new user, now with health profile data
router.post('/register', async (req, res) => {
    // Destructure all possible fields from the request body
    const { name, email, password, age, location, preExistingConditions, allergies } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // --- NEW LOGIC TO PARSE HEALTH DATA ---
        // Convert comma-separated strings into arrays of trimmed, non-empty strings
        const conditionsArray = preExistingConditions ? preExistingConditions.split(',').map(s => s.trim()).filter(Boolean) : [];
        const allergiesArray = allergies ? allergies.split(',').map(s => s.trim()).filter(Boolean) : [];

        user = new User({
            name,
            email,
            password,
            age,
            location,
            currentLocation: location,
            locationHistory: [location],
            healthProfile: {
                preExistingConditions: conditionsArray,
                allergies: allergiesArray
            }
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        
        console.log('New user created with health profile:', user.email);

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
router.post('/login', async (req, res) => { /* ... no changes needed here ... */
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const ip = req.ip || req.connection.remoteAddress;
        let currentLocation = user.location;
        try {
            const geoResponse = await axios.get(`http://ip-api.com/json/${ip}`);
            if (geoResponse.data && geoResponse.data.status === 'success' && geoResponse.data.city) {
                const detectedCity = geoResponse.data.city;
                currentLocation = detectedCity;
                if (user.currentLocation !== detectedCity) {
                    user.currentLocation = detectedCity;
                    if (!user.locationHistory.includes(detectedCity)) {
                        user.locationHistory.push(detectedCity);
                    }
                    await user.save();
                }
            } else {
                // If geolocation fails in production, use last known location. In dev, use default.
                currentLocation = process.env.NODE_ENV === 'production' ? user.currentLocation : (process.env.DEV_DEFAULT_LOCATION || user.currentLocation);
                if(user.currentLocation !== currentLocation){
                    user.currentLocation = currentLocation;
                    if(!user.locationHistory.includes(currentLocation)){
                        user.locationHistory.push(currentLocation);
                    }
                    await user.save();
                }
            }
        } catch (geoError) {
            console.error("Could not fetch geolocation, using fallback.", geoError.message);
             currentLocation = process.env.NODE_ENV === 'production' ? user.currentLocation : (process.env.DEV_DEFAULT_LOCATION || user.currentLocation);
            if(user.currentLocation !== currentLocation){
                    user.currentLocation = currentLocation;
                    if(!user.locationHistory.includes(currentLocation)){
                        user.locationHistory.push(currentLocation);
                    }
                    await user.save();
                }
        }
        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            location: currentLocation,
            token: generateToken(user),
        });
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;

