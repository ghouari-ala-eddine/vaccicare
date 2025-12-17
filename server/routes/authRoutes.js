const express = require('express');
const router = express.Router();
const {
    register,
    login,
    verify2FA,
    resend2FACode,
    toggle2FA,
    getMe,
    updateProfile,
    getDoctors,
    getAllUsers,
    updateUser,
    toggleUserActive
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/verify-2fa', verify2FA);
router.post('/resend-2fa', resend2FACode);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/toggle-2fa', protect, toggle2FA);
router.get('/doctors', protect, getDoctors);

// Admin routes - User Management
router.get('/users', protect, authorize('admin'), getAllUsers);
router.put('/users/:id', protect, authorize('admin'), updateUser);
router.put('/users/:id/toggle', protect, authorize('admin'), toggleUserActive);

module.exports = router;
