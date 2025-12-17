const express = require('express');
const router = express.Router();
const {
    reportSideEffect,
    getSideEffectsByChild,
    getAllSideEffects,
    reviewSideEffect
} = require('../controllers/sideEffectController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
    .get(authorize('doctor', 'admin'), getAllSideEffects)
    .post(authorize('parent'), reportSideEffect);

router.get('/child/:childId', getSideEffectsByChild);
router.put('/:id', authorize('doctor', 'admin'), reviewSideEffect);

module.exports = router;
