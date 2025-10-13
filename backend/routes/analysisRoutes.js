const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/authMiddleware');
const TrendsCache = require('../models/trendsCacheModel');

const MICROSERVICE_URL = 'http://127.0.0.1:8000';

router.get('/full', protect, async (req, res) => {
    try {
        const user = req.user;
        const location = user.currentLocation || user.location;
        
        const weatherApiKey = process.env.WEATHER_API_KEY;
        const weatherUrl = `https://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=${location}&aqi=yes`;
        const weatherResponse = await axios.get(weatherUrl);
        const weatherData = weatherResponse.data;

        const structuredWeatherData = {
            location: weatherData.location,
            weather: { temperature_celsius: weatherData.current.temp_c, humidity_percent: weatherData.current.humidity },
            air_quality: weatherData.current.air_quality,
        };

        let trendsData;
        const geoCode = weatherData.location.country === 'India' 
            ? `IN-${weatherData.location.region.replace(/\s+/g, '').substring(0, 2).toUpperCase()}` 
            : weatherData.location.country_iso2;
        
        const cache = await TrendsCache.findOne({ geo: geoCode });
        const oneDay = 24 * 60 * 60 * 1000;

        if (cache && (new Date() - cache.lastFetched) < oneDay) {
            console.log(`[CACHE HIT] Using cached trends for ${geoCode}`);
            trendsData = cache.data;
        } else {
            console.log(`[CACHE MISS] Fetching new trends for ${geoCode}`);
            try {
                const standardKeywords = ['fever', 'cough', 'flu', 'dengue', 'malaria'];
                let trendKeywords = [...standardKeywords];

                if (user.healthProfile && user.healthProfile.allergies && user.healthProfile.allergies.includes('Pollen')) {
                    trendKeywords.push('pollen count');
                }
                if (user.healthProfile && user.healthProfile.preExistingConditions && user.healthProfile.preExistingConditions.includes('Asthma')) {
                    trendKeywords.push('asthma attack');
                }

                const trendsResponse = await axios.get(`${MICROSERVICE_URL}/api/trends`, {
                    params: { keywords: trendKeywords.join(','), geo: geoCode }
                });
                trendsData = trendsResponse.data;
                
                await TrendsCache.findOneAndUpdate(
                    { geo: geoCode },
                    { data: trendsData, lastFetched: new Date() },
                    { upsert: true, new: true }
                );
            } catch (trendError) {
                console.error("Failed to fetch new trends, using stale cache if available.", trendError.message);
                trendsData = cache ? cache.data : []; 
            }
        }

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

        const combinedData = { 
            userProfile: safeUserProfile, 
            weather: structuredWeatherData, 
            trends: trendsData 
        };
        
        const analysisResponse = await axios.post(`${MICROSERVICE_URL}/api/analyze`, combinedData);
        
        res.json(analysisResponse.data);

    } catch (error) {
        console.error("Full analysis orchestration failed:", error.message);
        res.status(500).json({ message: "Failed to generate full health analysis." });
    }
});

module.exports = router;

