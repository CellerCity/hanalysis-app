// Import necessary packages
const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');
const cors = require('cors');
const connectDB = require('./config/db');

// Import route files
const userRoutes = require('./routes/userRoutes'); // Import our new user routes

// Load environment variables from .env file
dotenv.config();

// --- Connect to Database ---
connectDB();

// Initialize the Express application
const app = express();

// --- Middleware Setup ---
app.use(cors()); 
app.use(express.json());

// Define the port for the server to listen on
const PORT = process.env.PORT || 5000;

// --- Mount Routers ---
// Tell the app to use our userRoutes file for any URL that starts with /api/users
app.use('/api/users', userRoutes);

// === EXISTING API ROUTES ===
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to the HANALYSIS API!' });
});

app.get('/api/health-metrics', async (req, res) => {
    try {
        const location = req.query.location || 'Kharagpur';
        const apiKey = process.env.WEATHER_API_KEY;

        if (!apiKey) {
            throw new Error('Weather API key is not defined in .env file');
        }

        const weatherApiUrl = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${location}&aqi=yes`;
        
        const response = await axios.get(weatherApiUrl);
        const data = response.data;

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
        res.status(200).json(healthMetrics);

    } catch (error) {
        console.error("Error fetching weather data:", error.message);
        res.status(500).json({ message: 'Failed to fetch health metrics data.' });
    }
});

app.get('/api/health-alerts', async (req, res) => {
    try {
        const localQuery = req.query.location || 'Kharagpur';
        const regionalQuery = req.query.region || 'West Bengal';
        const nationalQuery = 'India';
        const apiKey = process.env.NEWS_API_KEY;

        if (!apiKey) {
            throw new Error('News API key is not defined in .env file');
        }

        const diseaseKeywords = ['dengue', 'malaria', 'chikungunya', 'flu', 'viral fever', 'respiratory illness', 'tuberculosis', 'cholera', 'typhoid'];
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 20);
        const fromDateString = fromDate.toISOString().slice(0, 10);

        const fetchNews = async (location) => {
            const query = `(${diseaseKeywords.join(' OR ')}) AND (${location})`;
            const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&searchIn=title,description&from=${fromDateString}&sortBy=publishedAt&language=en&apiKey=${apiKey}`;
            console.log(`Fetching news for: ${location}`);
            const response = await axios.get(url);
            return response.data.articles;
        };

        let articles = await fetchNews(localQuery);
        let searchLocation = localQuery;

        if (articles.length === 0) {
            articles = await fetchNews(regionalQuery);
            searchLocation = regionalQuery;
        }
        
        if (articles.length === 0) {
            articles = await fetchNews(nationalQuery);
            searchLocation = nationalQuery;
        }

        const diseaseCounts = {};
        diseaseKeywords.forEach(key => diseaseCounts[key] = 0);

        articles.forEach(article => {
            const title = article.title.toLowerCase();
            diseaseKeywords.forEach(keyword => {
                if (title.includes(keyword)) {
                    diseaseCounts[keyword]++;
                }
            });
        });

        const activeAlerts = Object.entries(diseaseCounts)
            .filter(([, count]) => count > 0)
            .map(([disease, count]) => ({ disease, mention_count: count }));

        res.status(200).json({
            search_location_used: searchLocation,
            search_period_days: 20,
            total_articles_scanned: articles.length,
            active_alerts: activeAlerts,
        });

    } catch (error) {
        console.error("Error fetching health alerts:", error.message);
        res.status(500).json({ message: 'Failed to fetch health alerts data.' });
    }
});


// Start the server and listen for incoming requests
app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

