const express = require('express');
const router = express.Router();
const {
    getVaccines,
    getVaccine,
    createVaccine,
    updateVaccine,
    deleteVaccine,
    seedVaccines
} = require('../controllers/vaccineController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
    .get(getVaccines)
    .post(authorize('admin'), createVaccine);

router.post('/seed', authorize('admin'), seedVaccines);

router.route('/:id')
    .get(getVaccine)
    .put(authorize('admin'), updateVaccine)
    .delete(authorize('admin'), deleteVaccine);

module.exports = router;
