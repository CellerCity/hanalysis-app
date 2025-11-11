const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Helper function to generate a JWT
const generateToken = (user) => {
    const locationForToken = user.currentLocation || user.location;
    return jwt.sign(
        { id: user._id, name: user.name, email: user.email, location: locationForToken },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
};

// --- A single, robust helper function for location detection ---
const updateUserLocation = async (req, user) => {
    const ip = req.ip || req.connection.remoteAddress;
    let determinedLocation = user.currentLocation || user.location; 
    
    // --- THE FIX: Create a 100% reliable path for localhost development ---
    if (ip === '::1' || ip === '127.0.0.1') {
        console.log(`[LOCATION] Localhost environment detected. Using fallback location.`);
        determinedLocation = process.env.DEV_DEFAULT_LOCATION || user.location || 'Kharagpur';
    }
    else{       
        // --- THE FIX: Use the new, more reliable ipgeolocation.io API ---
        const apiKey = process.env.IPGEOLOCATION_API_KEY;
        if (apiKey) {
            try {
                const geoResponse = await axios.get(`https://api.ipgeolocation.io/ipgeo?apiKey=${apiKey}&ip=${ip}`);
                if (geoResponse.data && geoResponse.data.city) {
                    const detectedCity = geoResponse.data.city;
                    console.log(`[LOCATION] IP Geolocation success. Detected location: ${detectedCity}`);
                    determinedLocation = detectedCity;
                } else {
                    console.log(`[LOCATION] IP Geolocation failed. Using fallback.`);
                    determinedLocation = process.env.DEV_DEFAULT_LOCATION || determinedLocation;
                }
            } catch (geoError) {
                console.error(`[LOCATION] IP Geolocation error. Using fallback.`, geoError.message);
                determinedLocation = process.env.DEV_DEFAULT_LOCATION || determinedLocation;
            }
        } else {
            console.error("[LOCATION] IPGEOLOCATION_API_KEY not found. Using fallback.");
            determinedLocation = process.env.DEV_DEFAULT_LOCATION || determinedLocation;
        }
    }

    // Update the user document in the database if the location has changed
    if (user.currentLocation !== determinedLocation) {
        user.currentLocation = determinedLocation;
    }
    if (!user.locationHistory.includes(determinedLocation)) {
        user.locationHistory.push(determinedLocation);
    }
    
    await user.save();
    return determinedLocation;
};


// @route   POST /api/users/register
router.post('/register', async (req, res) => {
    const { name, email, password, age, location, preExistingConditions, allergies } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const conditionsArray = preExistingConditions ? preExistingConditions.split(',').map(s => s.trim()).filter(Boolean) : [];
        const allergiesArray = allergies ? allergies.split(',').map(s => s.trim()).filter(Boolean) : [];

        user = new User({
            name, email, password, age,
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
        
        const finalCurrentLocation = await updateUserLocation(req, user);
        
        console.log('New user created and location verified:', user.email);

        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            location: finalCurrentLocation,
            token: generateToken(user),
        });
    } catch (error) {
        console.error('Registration error:', error.message);
        res.status(500).send('Server error');
    }
});

// @route   POST /api/users/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        const finalCurrentLocation = await updateUserLocation(req, user);

        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            location: finalCurrentLocation,
            token: generateToken(user),
        });
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;

