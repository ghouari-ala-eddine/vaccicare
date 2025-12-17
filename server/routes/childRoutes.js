const express = require('express');
const router = express.Router();
const {
    getChildren,
    getChild,
    createChild,
    updateChild,
    deleteChild
} = require('../controllers/childController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
    .get(getChildren)
    .post(authorize('parent'), createChild);

router.route('/:id')
    .get(getChild)
    .put(authorize('parent', 'doctor', 'admin'), updateChild)
    .delete(authorize('parent', 'admin'), deleteChild);

module.exports = router;
