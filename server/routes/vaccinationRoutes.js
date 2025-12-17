const express = require('express');
const router = express.Router();
const {
    getVaccinationsByChild,
    updateVaccinationStatus,
    getUpcomingVaccinations,
    getDelayedVaccinations,
    getVaccinationStats
} = require('../controllers/vaccinationController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/child/:childId', getVaccinationsByChild);
router.get('/upcoming', authorize('doctor', 'admin'), getUpcomingVaccinations);
router.get('/delayed', authorize('doctor', 'admin'), getDelayedVaccinations);
router.get('/stats', getVaccinationStats); // Allow all authenticated users
router.put('/:id', authorize('doctor', 'admin'), updateVaccinationStatus);

module.exports = router;
