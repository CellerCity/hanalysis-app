const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db'); // Our DB connection logic
const cors = require('cors');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // To accept JSON data in the body

// --- API Routes ---
const userRoutes = require('./routes/userRoutes');
const profileRoutes = require('./routes/profileRoutes'); // Import profile routes

app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes); // Use profile routes

// Root Route
app.get('/', (req, res) => {
    res.send('HANALYSIS API is running...');
});

// Health Metrics Route (Existing)
const axios = require('axios');
app.get('/api/health-metrics', async (req, res) => {
    const location = req.query.location || 'Kharagpur';
    try {
        const apiKey = process.env.WEATHER_API_KEY;
        if (!apiKey) {
            throw new Error('Weather API key is not defined');
        }
        const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${location}&aqi=yes`;
        const weatherResponse = await axios.get(url);
        const data = weatherResponse.data;
        
        // Structure the response cleanly
        const healthMetrics = {
            location: {
                name: data.location.name,
                region: data.location.region,
                country: data.location.country,
                localtime: data.location.localtime,
            },
            weather: {
                temperature_celsius: data.current.temp_c,
                condition: data.current.condition.text,
                humidity_percent: data.current.humidity,
                wind_kph: data.current.wind_kph,
                uv_index: data.current.uv,
                rainfall_mm: data.current.precip_mm,
            },
            air_quality: {
                co: data.current.air_quality.co,
                o3: data.current.air_quality.o3,
                no2: data.current.air_quality.no2,
                so2: data.current.air_quality.so2,
                pm2_5: data.current.air_quality.pm2_5,
                pm10: data.current.air_quality.pm10,
                us_epa_index: data.current.air_quality['us-epa-index'],
            },
            last_updated: data.current.last_updated,
        };
        // console.log(healthMetrics);
        res.json(healthMetrics);
    } catch (error) {
        console.error("Error fetching health metrics:", error.message);
        res.status(500).json({ message: 'Failed to fetch weather data' });
    }
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

    