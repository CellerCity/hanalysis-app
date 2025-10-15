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

// --- NEW: A single, robust helper function for location detection ---
const updateUserLocation = async (req, user) => {
    const ip = req.ip || req.connection.remoteAddress;
    // Start with the last known good location as a default
    let determinedLocation = user.currentLocation || user.location; 

    try {
        const geoResponse = await axios.get(`http://ip-api.com/json/${ip}`);
        if (geoResponse.data && geoResponse.data.status === 'success' && geoResponse.data.city) {
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

    // Update the user document in the database if the location has changed
    if (user.currentLocation !== determinedLocation) {
        user.currentLocation = determinedLocation;
    }
    // Add to history if it's a new, unique location
    if (!user.locationHistory.includes(determinedLocation)) {
        user.locationHistory.push(determinedLocation);
    }
    
    // Save the changes to the user object in the database
    await user.save();
    
    // Return the final, reliable location
    return determinedLocation;
};


// @route   POST /api/users/register
// @desc    Register a new user, now using the unified location logic
router.post('/register', async (req, res) => {
    const { name, email, password, age, location, preExistingConditions, allergies } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const conditionsArray = preExistingConditions ? preExistingConditions.split(',').map(s => s.trim()).filter(Boolean) : [];
        const allergiesArray = allergies ? allergies.split(',').map(s => s.trim()).filter(Boolean) : [];

        // Create the user first with the location they entered
        user = new User({
            name, email, password, age,
            location, // Home location
            currentLocation: location, // Temporary current location
            locationHistory: [location],
            healthProfile: {
                preExistingConditions: conditionsArray,
                allergies: allergiesArray
            }
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        
        // --- THE FIX: Now, call the unified helper to get the REAL current location ---
        const finalCurrentLocation = await updateUserLocation(req, user);
        
        console.log('New user created and location verified:', user.email);

        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            location: finalCurrentLocation, // Send the reliable location
            token: generateToken(user), // The user object is already updated and saved
        });
    } catch (error) {
        console.error('Registration error:', error.message);
        res.status(500).send('Server error');
    }
});

// @route   POST /api/users/login
// @desc    Authenticate user, using the unified location logic
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // --- THE FIX: Call the unified helper function ---
        const finalCurrentLocation = await updateUserLocation(req, user);

        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            location: finalCurrentLocation, // Send the reliable location
            token: generateToken(user), // The user object is already updated and saved
        });
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;

