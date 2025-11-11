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
const GuestAnalysisCache = require('./models/guestAnalysisCacheModel');

// Load environment variables and connect to DB
dotenv.config();
connectDB();

const app = express();
const MICROSERVICE_URL = process.env.MICROSERVICE_URL || 'http://127.0.0.1:8000';

// --- THE FIX: Configure CORS for Production ---
// We create a list of allowed origins.
const allowedOrigins = [
  'http://localhost:5173', // For local development
  process.env.CORS_ORIGIN   // The production frontend URL from our environment variables
];

const corsOptions = {
  origin: (origin, callback) => {
    // If the incoming origin is in our list (or if there's no origin, e.g. a server-to-server request), allow it.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

app.use(cors(corsOptions)); // Use the configured options
app.use(express.json());

// API Routes (remain the same)
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/chat', chatRoutes);

// Root Route
app.get('/', (req, res) => {
    res.send('HANALYSIS API is running...');
});


// UPGRADED /api/health-metrics FOR GUEST MODE
app.get('/api/health-metrics', async (req, res) => {
    const location = req.query.location || 'Kharagpur';

    try {
        const weatherApiKey = process.env.WEATHER_API_KEY;
        const weatherUrl = `https://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=${location}&aqi=yes`;
        const weatherResponse = await axios.get(weatherUrl);
        const weatherData = weatherResponse.data;
        const structuredWeatherData = {
            location: { name: weatherData.location.name, region: weatherData.location.region, country: weatherData.location.country, localtime: weatherData.location.localtime },
            weather: { temperature_celsius: weatherData.current.temp_c, condition: weatherData.current.condition.text, humidity_percent: weatherData.current.humidity, wind_kph: weatherData.current.wind_kph, uv_index: weatherData.current.uv, rainfall_mm: weatherData.current.precip_mm },
            air_quality: {
                us_epa_index: weatherData.current.air_quality['us-epa-index'], // <-- The fix
                pm2_5: weatherData.current.air_quality.pm2_5,
                pm10: weatherData.current.air_quality.pm10,
                o3: weatherData.current.air_quality.o3,
                no2: weatherData.current.air_quality.no2
            }
        };

        const cache = await GuestAnalysisCache.findOne({ location: location });
        const oneHour = 60 * 60 * 1000;

        if (cache && (new Date() - cache.lastFetched) < oneHour) {
            console.log(`[GUEST CACHE HIT] Using cached AI analysis for ${location}`);
            return res.json({ ...structuredWeatherData, analysis: cache.analysis });
        }

        console.log(`[GUEST CACHE MISS] Generating new AI analysis for ${location}`);
        
        const geoCode = weatherData.location.country === 'India' 
            ? `IN-${weatherData.location.region.replace(/\s+/g, '').substring(0, 2).toUpperCase()}` 
            : weatherData.location.country_iso2;

        // --- THE FIX: Always use the reliable country code 'IN' ---
        // const geoCode = 'IN';
        // We no longer use the complex logic that generated 'IN-WE'
        
        const trendsCache = await TrendsCache.findOne({ geo: geoCode });
        const trendsData = trendsCache ? trendsCache.data : [];

        const combinedData = {
            userProfile: { age: 30, location: location, healthProfile: { preExistingConditions: [], allergies: [] } },
            weather: structuredWeatherData,
            trends: trendsData
        };

        const analysisResponse = await axios.post(`${MICROSERVICE_URL}/api/analyze`, combinedData);
        const newAnalysis = analysisResponse.data;

        await GuestAnalysisCache.findOneAndUpdate(
            { location: location },
            { analysis: newAnalysis, lastFetched: new Date() },
            { upsert: true, new: true }
        );

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

