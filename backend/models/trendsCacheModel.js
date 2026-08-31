const mongoose = require('mongoose');

const trendsCacheSchema = new mongoose.Schema({
    // A unique key, e.g., "IN-WE" for IIT KGP region
    // The `unique: true` option automatically creates an index for us.
    geo: {
        type: String,
        required: true,
        unique: true,
    },
    // The actual trends data we get from the microservice
    data: {
        type: Array,
        required: true,
    },
    // The timestamp when this data was last fetched
    lastFetched: {
        type: Date,
        default: Date.now,
    },
});

// `unique: true` on geo already creates the index, so no explicit index is declared.

const TrendsCache = mongoose.model('TrendsCache', trendsCacheSchema);

module.exports = TrendsCache;
