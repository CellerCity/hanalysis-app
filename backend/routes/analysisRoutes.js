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

        // --- ENHANCED CACHING LOGIC ---
        let trendsData;
        // Generate a geo code. Example: "IN-WB" for West Bengal.
        const geoCode = weatherData.location.country === 'India' 
            ? `IN-${weatherData.location.region.replace(/\s+/g, '').substring(0, 2).toUpperCase()}` 
            : weatherData.location.country_iso2;
        
        const cache = await TrendsCache.findOne({ geo: geoCode });
        const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

        if (cache && (new Date() - cache.lastFetched) < oneDay) {
            console.log(`[CACHE HIT] Using cached trends for ${geoCode}`);
            trendsData = cache.data;
        } else {
            console.log(`[CACHE MISS] Fetching new trends for ${geoCode}`);
            try {
                // --- THE FIX: Always use a standard set of keywords for caching ---
                // This maximizes cache hits and minimizes requests to Google.
                const standardTrendKeywords = ['fever', 'cough', 'flu', 'dengue', 'malaria'];

                const trendsResponse = await axios.get(`${MICROSERVICE_URL}/api/trends`, {
                    params: { keywords: standardTrendKeywords.join(','), geo: geoCode }
                });
                trendsData = trendsResponse.data;
                
                // Save the new generic data to the cache
                await TrendsCache.findOneAndUpdate(
                    { geo: geoCode },
                    { data: trendsData, lastFetched: new Date() },
                    { upsert: true, new: true }
                );
            } catch (trendError) {
                console.error("Failed to fetch new trends, using stale cache if available.", trendError.message);
                // If the fetch fails, use the old data if we have it, otherwise proceed with none.
                trendsData = cache ? cache.data : []; 
            }
        }
        // --- END OF CACHING LOGIC ---

        const combinedData = { userProfile: user, weather: structuredWeatherData, trends: trendsData };
        const analysisResponse = await axios.post(`${MICROSERVICE_URL}/api/analyze`, combinedData);
        
        res.json(analysisResponse.data);

    } catch (error) {
        console.error("Full analysis orchestration failed:", error.message);
        res.status(500).json({ message: "Failed to generate full health analysis." });
    }
});

module.exports = router;

