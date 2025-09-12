const mongoose = require('mongoose');

const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a name'],
        },
        email: {
            type: String,
            required: [true, 'Please add an email'],
            unique: true, // Each email must be unique
            match: [ // Regex to ensure it's a valid email format
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'Please add a valid email',
            ],
        },
        password: {
            type: String,
            required: [true, 'Please add a password'],
            minlength: 6, // Passwords should be at least 6 characters
            select: false, // Prevents the password from being returned in queries by default
        },
        age: {
            type: Number,
            required: [true, 'Please add your age'],
        },
        // The user's primary/home location from signup
        location: {
            type: String,
            required: [true, 'Please add your primary location'],
        },
        // The last location detected during a login session
        currentLocation: {
            type: String,
        },
        // A list of unique places the user has logged in from
        locationHistory: {
            type: [String],
            default: [],
        },
        // Optional health profile data that the user can update
        healthProfile: {
            preExistingConditions: {
                type: [String],
                default: [],
            },
            allergies: {
                type: [String],
                default: [],
            },
        },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
);

const User = mongoose.model('User', userSchema);

module.exports = User;

