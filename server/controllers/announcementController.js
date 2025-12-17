const Announcement = require('../models/Announcement');

// @desc    Get all active announcements (for all users)
// @route   GET /api/announcements
// @access  Private
const getActiveAnnouncements = async (req, res) => {
    try {
        const userRole = req.user.role;

        // Build query based on user role
        const query = {
            isActive: true,
            $or: [
                { expiresAt: null },
                { expiresAt: { $gt: new Date() } }
            ]
        };

        // Filter by target audience
        if (userRole === 'parent') {
            query.targetAudience = { $in: ['all', 'parents'] };
        } else if (userRole === 'doctor') {
            query.targetAudience = { $in: ['all', 'doctors'] };
        }
        // Admin sees all

        const announcements = await Announcement.find(query)
            .populate('author', 'name')
            .sort({ isPinned: -1, priority: -1, createdAt: -1 });

        res.json(announcements);
    } catch (error) {
        console.error('Error fetching announcements:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// @desc    Get all announcements (admin only)
// @route   GET /api/announcements/all
// @access  Admin
const getAllAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find()
            .populate('author', 'name')
            .sort({ createdAt: -1 });

        res.json(announcements);
    } catch (error) {
        console.error('Error fetching all announcements:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// @desc    Create a new announcement
// @route   POST /api/announcements
// @access  Admin
const createAnnouncement = async (req, res) => {
    try {
        const { title, message, type, priority, targetAudience, expiresAt, isPinned } = req.body;

        const announcement = await Announcement.create({
            title,
            message,
            type: type || 'info',
            priority: priority || 'medium',
            targetAudience: targetAudience || 'all',
            expiresAt: expiresAt || null,
            isPinned: isPinned || false,
            author: req.user._id
        });

        const populatedAnnouncement = await Announcement.findById(announcement._id)
            .populate('author', 'name');

        res.status(201).json(populatedAnnouncement);
    } catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({ message: error.message || 'Erreur serveur' });
    }
};

// @desc    Update an announcement
// @route   PUT /api/announcements/:id
// @access  Admin
const updateAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const announcement = await Announcement.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        ).populate('author', 'name');

        if (!announcement) {
            return res.status(404).json({ message: 'Annonce non trouvée' });
        }

        res.json(announcement);
    } catch (error) {
        console.error('Error updating announcement:', error);
        res.status(500).json({ message: error.message || 'Erreur serveur' });
    }
};

// @desc    Delete an announcement
// @route   DELETE /api/announcements/:id
// @access  Admin
const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;

        const announcement = await Announcement.findByIdAndDelete(id);

        if (!announcement) {
            return res.status(404).json({ message: 'Annonce non trouvée' });
        }

        res.json({ message: 'Annonce supprimée avec succès' });
    } catch (error) {
        console.error('Error deleting announcement:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// @desc    Toggle announcement active status
// @route   PATCH /api/announcements/:id/toggle
// @access  Admin
const toggleAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;

        const announcement = await Announcement.findById(id);

        if (!announcement) {
            return res.status(404).json({ message: 'Annonce non trouvée' });
        }

        announcement.isActive = !announcement.isActive;
        await announcement.save();

        res.json(announcement);
    } catch (error) {
        console.error('Error toggling announcement:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = {
    getActiveAnnouncements,
    getAllAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    toggleAnnouncement
};
