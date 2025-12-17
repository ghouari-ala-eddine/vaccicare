const express = require('express');
const router = express.Router();
const {
    getNotesByChild,
    createNote,
    updateNote,
    deleteNote
} = require('../controllers/noteController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected and for doctors/admins only
router.use(protect);
router.use(authorize('doctor', 'admin'));

// Get notes for a child
router.get('/child/:childId', getNotesByChild);

// Create a new note
router.post('/', createNote);

// Update a note
router.put('/:id', updateNote);

// Delete a note
router.delete('/:id', deleteNote);

module.exports = router;
