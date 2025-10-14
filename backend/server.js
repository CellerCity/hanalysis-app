const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');
const axios = require('axios');

// Import all our models and routes
const userRoutes = require('./routes/userRoutes');
const profileRoutes = require('./routes/profileRoutes');
const analysisRoutes = require('./routes/analysisRoutes');
const chatRoutes = require('./routes/chatRoutes');
const TrendsCache = require('./models/trendsCacheModel');
const GuestAnalysisCache = require('./models/guestAnalysisCacheModel'); // Import our new model

// Load environment variables and connect to DB
dotenv.config();
connectDB();

const app = express();
const MICROSERVICE_URL = 'http://127.0.0.1:8000';

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/chat', chatRoutes);

// Root Route
app.get('/', (req, res) => {
    res.send('HANALYSIS API is running...');
});


// --- UPGRADED /api/health-metrics FOR GUEST MODE ---
app.get('/api/health-metrics', async (req, res) => {
    const location = req.query.location || 'Kharagpur';

    try {
        // We also need the basic weather data for the cards, so we'll fetch it regardless
        const weatherApiKey = process.env.WEATHER_API_KEY;
        const weatherUrl = `https://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=${location}&aqi=yes`;
        const weatherResponse = await axios.get(weatherUrl);
        const weatherData = weatherResponse.data;
        const structuredWeatherData = {
            location: { name: weatherData.location.name, region: weatherData.location.region, country: weatherData.location.country, localtime: weatherData.location.localtime },
            weather: { temperature_celsius: weatherData.current.temp_c, condition: weatherData.current.condition.text, humidity_percent: weatherData.current.humidity, wind_kph: weatherData.current.wind_kph, uv_index: weatherData.current.uv, rainfall_mm: weatherData.current.precip_mm },
            air_quality: weatherData.current.air_quality,
        };

        // 1. --- Check for a fresh AI analysis cache for the location ---
        const cache = await GuestAnalysisCache.findOne({ location: location });
        const oneHour = 60 * 60 * 1000; // Cache for 1 hour

        if (cache && (new Date() - cache.lastFetched) < oneHour) {
            // 2. If fresh cache exists, return it along with live weather
            console.log(`[GUEST CACHE HIT] Using cached AI analysis for ${location}`);
            return res.json({ ...structuredWeatherData, analysis: cache.analysis });
        }

        // 3. --- If cache is old or missing, generate a new analysis ---
        console.log(`[GUEST CACHE MISS] Generating new AI analysis for ${location}`);
        
        // Fetch cached trends data
        const geoCode = weatherData.location.country === 'India' 
            ? `IN-${weatherData.location.region.replace(/\s+/g, '').substring(0, 2).toUpperCase()}` 
            : weatherData.location.country_iso2;
        const trendsCache = await TrendsCache.findOne({ geo: geoCode });
        const trendsData = trendsCache ? trendsCache.data : [];

        // Prepare a generic payload for the AI
        const combinedData = {
            userProfile: { age: 30, location: location, healthProfile: { preExistingConditions: [], allergies: [] } }, // Generic user
            weather: structuredWeatherData,
            trends: trendsData
        };

        // Call the Flask microservice
        const analysisResponse = await axios.post(`${MICROSERVICE_URL}/api/analyze`, combinedData);
        const newAnalysis = analysisResponse.data;

        // 4. Save the new analysis to the guest cache
        await GuestAnalysisCache.findOneAndUpdate(
            { location: location },
            { analysis: newAnalysis, lastFetched: new Date() },
            { upsert: true, new: true }
        );

        // 5. Return the new analysis along with live weather
        res.json({ ...structuredWeatherData, analysis: newAnalysis });

    } catch (error) {
        console.error("Error fetching guest health metrics:", error.message);
        res.status(500).json({ message: 'Failed to fetch data' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

