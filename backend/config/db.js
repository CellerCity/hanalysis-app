// This file handles the connection logic to our MongoDB database

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const connectDB = async () => {
    try {
        // Attempt to connect to the database using the URI from our .env file
        const conn = await mongoose.connect(process.env.MONGODB_URI);

        // If the connection is successful, log a confirmation message
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        // If there's an error, log the error message and exit the process
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1); // Exit with a failure code
    }
};

module.exports = connectDB;
