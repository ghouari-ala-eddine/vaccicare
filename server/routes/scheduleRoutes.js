const express = require('express');
const router = express.Router();
const {
    getDoctorSchedule,
    getMySchedule,
    createOrUpdateSchedule,
    addSlots,
    deleteSchedule,
    getAvailableDoctors,
    bookSlot,
    cancelBooking
} = require('../controllers/scheduleController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Get available doctors with schedules (for parents)
router.get('/available', getAvailableDoctors);

// Get my schedule (for doctors)
router.get('/my-schedule', authorize('doctor'), getMySchedule);

// Get doctor's schedule
router.get('/doctor/:doctorId', getDoctorSchedule);

// Create or update schedule (doctors only)
router.post('/', authorize('doctor'), createOrUpdateSchedule);

// Add slots to a schedule
router.post('/:id/slots', authorize('doctor'), addSlots);

// Delete a schedule
router.delete('/:id', authorize('doctor', 'admin'), deleteSchedule);

// Book a slot (parents)
router.post('/:id/book/:slotId', bookSlot);

// Cancel a booking
router.delete('/:id/book/:slotId', cancelBooking);

module.exports = router;
