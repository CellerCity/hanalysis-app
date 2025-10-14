const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/authMiddleware');
const TrendsCache = require('../models/trendsCacheModel');
const GuestAnalysisCache = require('../models/guestAnalysisCacheModel');

const MICROSERVICE_URL = 'http://127.0.0.1:8000';

router.get('/full', protect, async (req, res) => {
    try {
        const user = req.user;
        const location = user.currentLocation || user.location;
        
        const weatherApiKey = process.env.WEATHER_API_KEY;
        const weatherUrl = `https://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=${location}&aqi=yes`;
        const weatherResponse = await axios.get(weatherUrl);
        const weatherData = weatherResponse.data;

        const structuredWeatherData = { /* ... structure is the same ... */ 
            location: weatherData.location,
            weather: { temperature_celsius: weatherData.current.temp_c, humidity_percent: weatherData.current.humidity },
            air_quality: weatherData.current.air_quality,
        };
        
        let trendsData;
        const geoCode = weatherData.location.country === 'India' ? `IN-${weatherData.location.region.replace(/\s+/g, '').substring(0, 2).toUpperCase()}` : weatherData.location.country_iso2;
        
        const cache = await TrendsCache.findOne({ geo: geoCode });
        const oneDay = 24 * 60 * 60 * 1000;

        if (cache && (new Date() - cache.lastFetched) < oneDay) {
            trendsData = cache.data;
        } else {
            console.log(`[CACHE MISS] Fetching new trends for ${geoCode}`);
            try {
                const standardKeywords = ['fever', 'cough', 'flu', 'dengue', 'malaria'];
                const trendsResponse = await axios.get(`${MICROSERVICE_URL}/api/trends`, {
                    params: { keywords: standardKeywords.join(','), geo: geoCode }
                });
                
                // --- THE FIX: Only save to cache if the response is valid and not empty ---
                if (trendsResponse.data && Array.isArray(trendsResponse.data) && trendsResponse.data.length > 0) {
                    trendsData = trendsResponse.data;
                    await TrendsCache.findOneAndUpdate(
                        { geo: geoCode },
                        { data: trendsData, lastFetched: new Date() },
                        { upsert: true, new: true }
                    );
                } else {
                    // If the response is empty, use old data if we have it
                    console.log("Received empty trends data, using stale cache if available.");
                    trendsData = cache ? cache.data : [];
                }
            } catch (trendError) {
                console.error("Failed to fetch new trends, using stale cache if available.", trendError.message);
                // If the fetch fails, use the old data if we have it
                trendsData = cache ? cache.data : []; 
            }
        }
        
        const safeUserProfile = {
            age: user.age,
            location: user.location,
            healthProfile: {
                preExistingConditions: user.healthProfile?.preExistingConditions || [],
                allergies: user.healthProfile?.allergies || []
            }
        };

        const combinedData = { userProfile: safeUserProfile, weather: structuredWeatherData, trends: trendsData };
        const analysisResponse = await axios.post(`${MICROSERVICE_URL}/api/analyze`, combinedData);
        
        res.json(analysisResponse.data);

    } catch (error) {
        console.error("Full analysis orchestration failed:", error.message);
        res.status(500).json({ message: "Failed to generate full health analysis." });
    }
});

module.exports = router;

