const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/userModel');

// @route   GET /api/profile/me
// @desc    Get current user's profile
// @access  Private (notice the 'protect' middleware is used here)
router.get('/me', protect, async (req, res) => {
    // Because the `protect` middleware ran successfully,
    // we have the user object attached to the request at `req.user`.
    // We can simply send it back.
    res.json(req.user);
});

// @route   PUT /api/profile/me
// @desc    Update user's health profile
// @access  Private
router.put('/me', protect, async (req, res) => {
    const { preExistingConditions, allergies } = req.body;

    try {
        // Find the user by their ID (which we get from the token via the middleware)
        const user = await User.findById(req.user.id);

        if (user) {
            // Update the health profile fields
            user.healthProfile.preExistingConditions = preExistingConditions || user.healthProfile.preExistingConditions;
            user.healthProfile.allergies = allergies || user.healthProfile.allergies;

            const updatedUser = await user.save();
            res.json(updatedUser);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Profile update error:', error.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
