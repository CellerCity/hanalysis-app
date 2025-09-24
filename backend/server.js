const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// --- API Routes ---
const userRoutes = require('./routes/userRoutes');
const profileRoutes = require('./routes/profileRoutes');
const analysisRoutes = require('./routes/analysisRoutes'); // Import the new analysis routes

app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/analysis', analysisRoutes); // Use the new analysis routes

// Root Route
app.get('/', (req, res) => {
    res.send('HANALYSIS API is running...');
});

// We are keeping this simple health-metrics route for the "Guest Mode" dashboard
const axios = require('axios');
app.get('/api/health-metrics', async (req, res) => {
    const receivedLocation = req.query.location;
    try {
        const finalLocation = receivedLocation && receivedLocation.trim() !== '' ? receivedLocation : 'Kharagpur';
        const apiKey = process.env.WEATHER_API_KEY;
        const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${finalLocation}&aqi=yes`;
        const weatherResponse = await axios.get(url);
        const data = weatherResponse.data;
        
        const healthMetrics = {
            location: { name: data.location.name, region: data.location.region, country: data.location.country, localtime: data.location.localtime },
            weather: { temperature_celsius: data.current.temp_c, condition: data.current.condition.text, humidity_percent: data.current.humidity, wind_kph: data.current.wind_kph, uv_index: data.current.uv, rainfall_mm: data.current.precip_mm },
            air_quality: data.current.air_quality,
            last_updated: data.current.last_updated,
        };
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

