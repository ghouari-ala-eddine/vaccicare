const express = require('express');
const router = express.Router();
const {
    getLabResultsByChild,
    getLabResult,
    uploadLabResult,
    updateLabResult,
    deleteLabResult
} = require('../controllers/labResultController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Get lab results for a child
router.get('/child/:childId', getLabResultsByChild);

// Get single lab result
router.get('/:id', getLabResult);

// Upload a new lab result (parents can upload for their children, doctors/admins for all)
router.post('/', uploadLabResult);

// Update lab result (review - doctors/admins only)
router.put('/:id', authorize('doctor', 'admin'), updateLabResult);

// Delete a lab result
router.delete('/:id', deleteLabResult);

module.exports = router;
