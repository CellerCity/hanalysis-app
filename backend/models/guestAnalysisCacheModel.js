const mongoose = require('mongoose');

const guestAnalysisCacheSchema = new mongoose.Schema({
    // A unique key for the location, e.g., "Kharagpur"
    location: {
        type: String,
        required: true,
        unique: true,
        index: true, // Create an index for faster lookups
    },
    // The full JSON analysis object from the LLM
    analysis: {
        riskScore: { type: Number, required: true },
        riskLevel: { type: String, required: true },
        summary: { type: String, required: true },
        recommendations: { type: [String], required: true },
    },
    // The timestamp when this data was last fetched
    lastFetched: {
        type: Date,
        default: Date.now,
    },
});

const GuestAnalysisCache = mongoose.model('GuestAnalysisCache', guestAnalysisCacheSchema);

module.exports = GuestAnalysisCache;
