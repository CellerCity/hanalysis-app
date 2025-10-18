const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/authMiddleware');

// The base URL for our Flask microservice
const MICROSERVICE_URL = process.env.MICROSERVICE_URL || 'http://127.0.0.1:8000';

// @route   POST /api/chat
// @desc    Handle a user's chat message
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const user = req.user;
        const location = user.currentLocation || user.location;
        const { history } = req.body; // Get the conversation history from the frontend

        if (!history || !Array.isArray(history)) {
            return res.status(400).json({ message: 'Request body must include a "history" array.' });
        }

        // 1. --- Fetch Real-time Weather and AQI Data ---
        const weatherApiKey = process.env.WEATHER_API_KEY;
        const weatherUrl = `https://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=${location}&aqi=yes`;
        const weatherResponse = await axios.get(weatherUrl);
        const weatherData = weatherResponse.data;

        const structuredWeatherData = {
            location: weatherData.location,
            weather: {
                temperature_celsius: weatherData.current.temp_c,
                humidity_percent: weatherData.current.humidity,
            },
            air_quality: weatherData.current.air_quality,
        };

        // --- THE FIX: Defensively build the userProfile object ---
        // This ensures that even for a new user, healthProfile and its arrays always exist.
        const safeUserProfile = {
            age: user.age,
            location: user.location, // Home location
            healthProfile: {
                preExistingConditions: user.healthProfile?.preExistingConditions || [],
                allergies: user.healthProfile?.allergies || []
            }
        };

        // 2. --- Combine All Data for the Microservice ---
        const payload = {
            userProfile: safeUserProfile, // Use the safe object
            weather: structuredWeatherData,
            history: history
        };

        // 3. --- Call the Flask Microservice's Chat Endpoint ---
        const chatResponse = await axios.post(`${MICROSERVICE_URL}/api/chat`, payload);
        
        // 4. --- Send the AI's Reply Back to the Frontend ---
        res.json(chatResponse.data);

    } catch (error) {
        console.error("Chat orchestration failed:", error.message);
        if (error.response) {
            console.error("Error details:", error.response.data);
        }
        res.status(500).json({ message: "Failed to get a response from the AI assistant." });
    }
});

module.exports = router;

