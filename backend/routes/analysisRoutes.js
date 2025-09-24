const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/authMiddleware');

// The base URL for our Flask microservice
const MICROSERVICE_URL = 'http://127.0.0.1:8000';

// @route   GET /api/analysis/full
// @desc    Get a full, personalized health analysis for the logged-in user
// @access  Private
router.get('/full', protect, async (req, res) => {
    try {
        const user = req.user;
        const location = user.currentLocation || user.location;
        
        // 1. --- Fetch Weather and AQI Data ---
        // This logic is similar to our old /health-metrics route
        const weatherApiKey = process.env.WEATHER_API_KEY;
        const weatherUrl = `https://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=${location}&aqi=yes`;
        const weatherResponse = await axios.get(weatherUrl);
        const weatherData = weatherResponse.data;

        const structuredWeatherData = {
            location: {
                name: weatherData.location.name,
                region: weatherData.location.region,
                country: weatherData.location.country,
                localtime: weatherData.location.localtime,
            },
            weather: {
                temperature_celsius: weatherData.current.temp_c,
                condition: weatherData.current.condition.text,
                humidity_percent: weatherData.current.humidity,
                wind_kph: weatherData.current.wind_kph,
                uv_index: weatherData.current.uv,
                rainfall_mm: weatherData.current.precip_mm,
            },
            air_quality: {
                co: weatherData.current.air_quality.co,
                o3: weatherData.current.air_quality.o3,
                no2: weatherData.current.air_quality.no2,
                so2: weatherData.current.air_quality.so2,
                pm2_5: weatherData.current.air_quality.pm2_5,
                pm10: weatherData.current.air_quality.pm10,
                us_epa_index: weatherData.current.air_quality['us-epa-index'],
            }
        };

        // 2. --- Fetch Google Trends Data ---
        // Define keywords that might be relevant to the user's profile
        const trendKeywords = ['flu', 'cold', 'fever']; // Default keywords
        if (user.healthProfile.allergies.includes('Pollen')) trendKeywords.push('pollen count');
        if (user.healthProfile.preExistingConditions.includes('Asthma')) trendKeywords.push('asthma attack');

        const trendsResponse = await axios.get(`${MICROSERVICE_URL}/api/trends`, {
            params: {
                keywords: trendKeywords.join(','),
                geo: weatherData.location.country_iso2 // Use country code from weather API
            }
        });
        const trendsData = trendsResponse.data;

        // 3. --- Combine All Data ---
        const combinedData = {
            userProfile: user,
            weather: structuredWeatherData,
            trends: trendsData
        };

        // 4. --- Call the Flask Microservice for AI Analysis ---
        const analysisResponse = await axios.post(`${MICROSERVICE_URL}/api/analyze`, combinedData);
        
        // 5. --- Send the Final AI Analysis to the Frontend ---
        res.json(analysisResponse.data);

    } catch (error) {
        console.error("Full analysis orchestration failed:", error.message);
        if (error.response) {
            console.error("Error details:", error.response.data);
        }
        res.status(500).json({ message: "Failed to generate full health analysis." });
    }
});

module.exports = router;
