const mongoose = require('mongoose');

// This is the blueprint for how user data will be stored in MongoDB
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true, // Each email must be unique in the database
        match: [ // Regex to ensure it's a valid email format
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email',
        ],
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6, // Passwords should be at least 6 characters
        select: false, // This will prevent the password from being returned in queries by default
    },
    age: {
        type: Number,
        required: [true, 'Please add your age'],
    },
    location: {
        type: String,
        required: [true, 'Please add your location'],
    },
    // Optional health profile data
    healthProfile: {
        preExistingConditions: {
            type: [String], // An array of strings
            default: [],
        },
        allergies: {
            type: [String],
            default: [],
        },
    },
}, {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
});

// The model is what we use to interact with the 'users' collection in the database
module.exports = mongoose.model('User', userSchema);
