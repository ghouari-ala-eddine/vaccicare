const express = require('express');
const router = express.Router();
const {
    getActiveAnnouncements,
    getAllAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    toggleAnnouncement
} = require('../controllers/announcementController');
const { protect, authorize } = require('../middleware/auth');

// Protected routes (all authenticated users)
router.get('/', protect, getActiveAnnouncements);

// Admin only routes
router.get('/all', protect, authorize('admin'), getAllAnnouncements);
router.post('/', protect, authorize('admin'), createAnnouncement);
router.put('/:id', protect, authorize('admin'), updateAnnouncement);
router.delete('/:id', protect, authorize('admin'), deleteAnnouncement);
router.patch('/:id/toggle', protect, authorize('admin'), toggleAnnouncement);

module.exports = router;
