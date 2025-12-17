const DoctorNote = require('../models/DoctorNote');
const Child = require('../models/Child');

// @desc    Get all notes for a child (doctor only sees their own notes)
// @route   GET /api/notes/child/:childId
// @access  Private (Doctor/Admin)
const getNotesByChild = async (req, res) => {
    try {
        const { childId } = req.params;

        // Verify child exists
        const child = await Child.findById(childId);
        if (!child) {
            return res.status(404).json({ message: 'Enfant non trouvé' });
        }

        // Build query - doctors see only their notes, admins see all
        const query = { child: childId };
        if (req.user.role === 'doctor') {
            query.doctor = req.user._id;
        }

        const notes = await DoctorNote.find(query)
            .populate('doctor', 'name')
            .sort({ createdAt: -1 });

        res.json(notes);
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// @desc    Create a new note
// @route   POST /api/notes
// @access  Private (Doctor only)
const createNote = async (req, res) => {
    try {
        const { childId, content, category } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ message: 'Le contenu de la note est requis' });
        }

        // Verify child exists
        const child = await Child.findById(childId);
        if (!child) {
            return res.status(404).json({ message: 'Enfant non trouvé' });
        }

        const note = await DoctorNote.create({
            child: childId,
            doctor: req.user._id,
            content: content.trim(),
            category: category || 'general',
            isPrivate: true
        });

        const populatedNote = await DoctorNote.findById(note._id)
            .populate('doctor', 'name');

        res.status(201).json(populatedNote);
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({ message: error.message || 'Erreur serveur' });
    }
};

// @desc    Update a note
// @route   PUT /api/notes/:id
// @access  Private (Doctor - own notes only)
const updateNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, category } = req.body;

        const note = await DoctorNote.findById(id);
        if (!note) {
            return res.status(404).json({ message: 'Note non trouvée' });
        }

        // Only the doctor who created the note can update it
        if (note.doctor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Non autorisé à modifier cette note' });
        }

        if (content) note.content = content.trim();
        if (category) note.category = category;

        await note.save();

        const populatedNote = await DoctorNote.findById(note._id)
            .populate('doctor', 'name');

        res.json(populatedNote);
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({ message: error.message || 'Erreur serveur' });
    }
};

// @desc    Delete a note
// @route   DELETE /api/notes/:id
// @access  Private (Doctor - own notes only, or Admin)
const deleteNote = async (req, res) => {
    try {
        const { id } = req.params;

        const note = await DoctorNote.findById(id);
        if (!note) {
            return res.status(404).json({ message: 'Note non trouvée' });
        }

        // Only the doctor who created the note or admin can delete it
        if (req.user.role !== 'admin' && note.doctor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Non autorisé à supprimer cette note' });
        }

        await DoctorNote.findByIdAndDelete(id);

        res.json({ message: 'Note supprimée avec succès' });
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = {
    getNotesByChild,
    createNote,
    updateNote,
    deleteNote
};
