const mongoose = require('mongoose');
const User = require('../models/User');

// This function ensures the default admin exists
const setupDefaultAdmin = async () => {
    try {
        // Admin email - this account will always be admin
        const adminEmail = 'alimnimedical@gmail.com';

        // Find the user and make sure they're admin
        const user = await User.findOne({ email: adminEmail });

        if (user) {
            if (user.role !== 'admin') {
                user.role = 'admin';
                await user.save({ validateBeforeSave: false });
                console.log('✅ Admin role set for:', adminEmail);
            } else {
                console.log('✅ Admin already configured:', adminEmail);
            }
        } else {
            console.log('⚠️ Admin user not found. Please register first:', adminEmail);
        }
    } catch (error) {
        console.error('Error setting up admin:', error.message);
    }
};

module.exports = setupDefaultAdmin;
