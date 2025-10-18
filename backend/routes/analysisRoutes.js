const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/authMiddleware');
const TrendsCache = require('../models/trendsCacheModel');
const GuestAnalysisCache = require('../models/guestAnalysisCacheModel');

const MICROSERVICE_URL = process.env.MICROSERVICE_URL || 'http://127.0.0.1:8000';

router.get('/full', protect, async (req, res) => {
    try {
        const user = req.user;
        let location = user.currentLocation || user.location;
        let structuredWeatherData = null;
        let geoCode = null;

        // --- THE FIX: This block robustly handles WeatherAPI failures ---
        await axios.get(`https://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${location}&aqi=yes`)
            .then(weatherResponse => {
                // This runs ONLY on a successful response
                const weatherData = weatherResponse.data;
                structuredWeatherData = {
                    location: weatherData.location,
                    weather: { temperature_celsius: weatherData.current.temp_c, humidity_percent: weatherData.current.humidity, condition: weatherData.current.condition.text, wind_kph: weatherData.current.wind_kph, uv_index: weatherData.current.uv, rainfall_mm: weatherData.current.precip_mm },
                    air_quality: weatherData.current.air_quality,
                };
                geoCode = weatherData.location.country === 'India' 
                    ? `IN-${weatherData.location.region.replace(/\s+/g, '').substring(0, 2).toUpperCase()}` 
                    : weatherData.location.country_iso2;
            })
            .catch(weatherError => {
                // This runs ONLY on a failed response, preventing a crash
                console.error(`!!! Weather API failed for location "${location}". Proceeding without environmental data.`);
                console.error(`Weather API Error: ${weatherError.response?.data?.error?.message || weatherError.message}`);
                structuredWeatherData = { location: { name: location, region: '' }, weather: {}, air_quality: {} };
                geoCode = 'IN'; // Fallback to a generic geoCode
            });
        
        // --- The rest of the logic can now proceed safely ---

        let trendsData = [];
        if (geoCode) {
            const trendsCache = await TrendsCache.findOne({ geo: geoCode });
            const oneDay = 24 * 60 * 60 * 1000;
            if (trendsCache && (new Date() - trendsCache.lastFetched) < oneDay) {
                trendsData = trendsCache.data;
            } else {
                try {
                    const standardKeywords = ['fever', 'cough', 'flu', 'dengue', 'malaria'];
                    const trendsResponse = await axios.get(`${MICROSERVICE_URL}/api/trends`, { params: { keywords: standardKeywords.join(','), geo: geoCode } });
                    if (trendsResponse.data && Array.isArray(trendsResponse.data) && trendsResponse.data.length > 0) {
                        trendsData = trendsResponse.data;
                        await TrendsCache.findOneAndUpdate({ geo: geoCode }, { data: trendsData, lastFetched: new Date() }, { upsert: true });
                    } else {
                        trendsData = trendsCache ? trendsCache.data : [];
                    }
                } catch (trendError) {
                    trendsData = trendsCache ? trendsCache.data : [];
                }
            }
        }
        
        let baselineAnalysis;
        const guestCache = await GuestAnalysisCache.findOne({ location: location });
        const oneHour = 60 * 60 * 1000;
        if (guestCache && (new Date() - guestCache.lastFetched) < oneHour) {
            baselineAnalysis = guestCache.analysis;
        } else {
            const guestPayload = { userProfile: { age: 30, location: location, healthProfile: {}}, weather: structuredWeatherData, trends: trendsData };
            const guestAnalysisResponse = await axios.post(`${MICROSERVICE_URL}/api/analyze`, guestPayload);
            baselineAnalysis = guestAnalysisResponse.data;
            await GuestAnalysisCache.findOneAndUpdate({ location: location }, { analysis: baselineAnalysis, lastFetched: new Date() }, { upsert: true });
        }

        const safeUserProfile = {
            age: user.age,
            location: user.location,
            healthProfile: {
                preExistingConditions: user.healthProfile?.preExistingConditions || [],
                allergies: user.healthProfile?.allergies || []
            }
        };
        const combinedData = { 
            baselineAnalysis: baselineAnalysis,
            userProfile: safeUserProfile, 
            weather: structuredWeatherData, 
            trends: trendsData 
        };
        const analysisResponse = await axios.post(`${MICROSERVICE_URL}/api/analyze`, combinedData);
        
        res.json({
            analysis: analysisResponse.data,
            metrics: structuredWeatherData
        });

    } catch (error) {
        console.error("Full analysis orchestration failed:", error.message);
        res.status(500).json({ message: "Failed to generate full health analysis." });
    }
});

module.exports = router;

