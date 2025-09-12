// Import necessary packages
const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios'); // Import axios

// Load environment variables from .env file
dotenv.config();

// Initialize the Express application
const app = express();

// Middleware to parse JSON bodies
// This allows our API to accept JSON data in requests
app.use(express.json());

// Define the port for the server to listen on
// It will try to get the port from the .env file, otherwise default to 5000
const PORT = process.env.PORT || 5000;

// === API ROUTES ===

// A simple root route to test if the server is running
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to the HANALYSIS API!' });
});


// API endpoint for health and weather metrics
app.get('/api/health-metrics', async (req, res) => {
    try {
        // 1. Get the location from query parameters, with a default
        const location = req.query.location || 'Kharagpur';
        const apiKey = process.env.WEATHER_API_KEY;

        if (!apiKey) {
            // This is a server-side issue, so we throw an error
            throw new Error('Weather API key is not defined in .env file');
        }

        // 2. Construct the API URL
        const weatherApiUrl = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${location}&aqi=yes`;
        
        // 3. Make the API call using axios
        const response = await axios.get(weatherApiUrl);
        const data = response.data;

        // 4. Structure the data for our frontend dashboard
        // This creates a clean, predictable object for our app to use.
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
                rainfall_mm: data.current.precip_mm, // Precipitation is rainfall
            },
            air_quality: {
                co: data.current.air_quality.co, // Carbon Monoxide
                o3: data.current.air_quality.o3, // Ozone
                no2: data.current.air_quality.no2, // Nitrogen Dioxide
                so2: data.current.air_quality.so2, // Sulphur Dioxide
                pm2_5: data.current.air_quality.pm2_5, // Particulate Matter 2.5
                pm10: data.current.air_quality.pm10, // Particulate Matter 10
                us_epa_index: data.current.air_quality['us-epa-index'], // US EPA Standard
            },
            last_updated: data.current.last_updated,
        };

        // 5. Send the structured data as a successful response
        res.status(200).json(healthMetrics);

    } catch (error) {
        // 6. Handle errors gracefully
        console.error("Error fetching weather data:", error.message);
        // Respond with a 500 Internal Server Error status and an error message
        res.status(500).json({ message: 'Failed to fetch health metrics data.' });
    }
});




// API endpoint for health news alerts with 3-tier graceful fallback
app.get('/api/health-alerts', async (req, res) => {
    try {
        const localQuery = req.query.location || 'Kharagpur';
        const regionalQuery = req.query.region || 'West Bengal';
        const nationalQuery = 'India'; // Added national fallback
        const apiKey = process.env.NEWS_API_KEY;

        if (!apiKey) {
            throw new Error('News API key is not defined in .env file');
        }

        const diseaseKeywords = ['dengue', 'malaria', 'chikungunya', 'flu', 'viral fever', 'respiratory illness', 'tuberculosis', 'cholera', 'typhoid'];
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 20); // Search last 20 days
        const fromDateString = fromDate.toISOString().slice(0, 10);

        // --- Function to perform the search ---
        const fetchNews = async (location) => {
            const query = `(${diseaseKeywords.join(' OR ')}) AND (${location})`;
            const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&searchIn=title,description&from=${fromDateString}&sortBy=publishedAt&language=en&apiKey=${apiKey}`;
            console.log(`Fetching news for: ${location}`);
            const response = await axios.get(url);
            return response.data.articles;
        };

        // --- Step 1: Try the local query first ---
        let articles = await fetchNews(localQuery);
        let searchLocation = localQuery;

        // --- Step 2: If no results, fallback to the regional query ---
        if (articles.length === 0) {
            console.log(`No results for ${localQuery}, falling back to ${regionalQuery}.`);
            articles = await fetchNews(regionalQuery);
            searchLocation = regionalQuery;
        }
        
        // --- Step 3: If still no results, fallback to the national query ---
        if (articles.length === 0) {
            console.log(`No results for ${regionalQuery}, falling back to ${nationalQuery}.`);
            articles = await fetchNews(nationalQuery);
            searchLocation = nationalQuery;
        }

        // --- Step 4: Analyze the results ---
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
