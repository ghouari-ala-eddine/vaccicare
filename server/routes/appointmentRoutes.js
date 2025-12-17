const express = require('express');
const router = express.Router();
const {
    getAppointments,
    getAppointment,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    getPendingAppointments,
    getTodayAppointments
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
    .get(getAppointments)
    .post(authorize('parent'), createAppointment);

router.get('/pending', authorize('doctor', 'admin'), getPendingAppointments);
router.get('/today', authorize('doctor', 'admin'), getTodayAppointments);

router.route('/:id')
    .get(getAppointment)
    .put(authorize('doctor', 'admin', 'parent'), updateAppointment)
    .delete(deleteAppointment);

module.exports = router;
