const SideEffect = require('../models/SideEffect');
const Child = require('../models/Child');
const Notification = require('../models/Notification');

// @desc    Report side effect
// @route   POST /api/side-effects
// @access  Private (Parent)
const reportSideEffect = async (req, res) => {
    try {
        const { childId, vaccinationId, vaccineId, symptoms, severity, description, onsetDate, duration } = req.body;

        // Verify parent owns the child
        const child = await Child.findById(childId);
        if (!child) {
            return res.status(404).json({ message: 'Enfant non trouvé' });
        }

        if (req.user.role === 'parent' && child.parent.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        const sideEffect = await SideEffect.create({
            child: childId,
            vaccination: vaccinationId,
            vaccine: vaccineId,
            reportedBy: req.user._id,
            symptoms,
            severity,
            description,
            onsetDate,
            duration
        });

        // Notify all doctors about new side effect report
        const User = require('../models/User');
        const doctors = await User.find({ role: 'doctor', isActive: true });

        for (const doctor of doctors) {
            await Notification.create({
                user: doctor._id,
                type: 'alert',
                title: 'Nouveau signalement d\'effet secondaire',
                message: `Un effet secondaire a été signalé pour ${child.name}`,
                relatedChild: childId
            });
        }

        res.status(201).json(sideEffect);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// @desc    Get side effects for a child
// @route   GET /api/side-effects/child/:childId
// @access  Private
const getSideEffectsByChild = async (req, res) => {
    try {
        const sideEffects = await SideEffect.find({ child: req.params.childId })
            .populate('vaccine', 'name')
            .populate('reportedBy', 'name')
            .populate('reviewedBy', 'name')
            .sort({ createdAt: -1 });

        res.json(sideEffects);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// @desc    Get all side effects (for doctors/admins)
// @route   GET /api/side-effects
// @access  Private (Doctor/Admin)
const getAllSideEffects = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = status ? { status } : {};

        const sideEffects = await SideEffect.find(filter)
            .populate('child', 'name birthDate')
            .populate('vaccine', 'name')
            .populate('reportedBy', 'name')
            .populate({
                path: 'child',
                populate: { path: 'parent', select: 'name phone email' }
            })
            .sort({ createdAt: -1 });

        res.json(sideEffects);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// @desc    Review/update side effect
// @route   PUT /api/side-effects/:id
// @access  Private (Doctor/Admin)
const reviewSideEffect = async (req, res) => {
    try {
        const { status, doctorNotes } = req.body;

        const sideEffect = await SideEffect.findById(req.params.id);
        if (!sideEffect) {
            return res.status(404).json({ message: 'Signalement non trouvé' });
        }

        sideEffect.status = status || sideEffect.status;
        sideEffect.doctorNotes = doctorNotes || sideEffect.doctorNotes;

        if (status === 'reviewed' || status === 'resolved') {
            sideEffect.reviewedBy = req.user._id;
            sideEffect.reviewedAt = new Date();
        }

        await sideEffect.save();

        // Notify parent about review
        const child = await Child.findById(sideEffect.child);
        if (child) {
            await Notification.create({
                user: child.parent,
                type: 'confirmation',
                title: 'Signalement examiné',
                message: `Votre signalement d'effet secondaire pour ${child.name} a été examiné par un médecin`,
                relatedChild: child._id
            });
        }

        res.json(sideEffect);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

module.exports = {
    reportSideEffect,
    getSideEffectsByChild,
    getAllSideEffects,
    reviewSideEffect
};
