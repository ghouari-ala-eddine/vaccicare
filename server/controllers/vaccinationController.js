const VaccinationRecord = require('../models/VaccinationRecord');
const Notification = require('../models/Notification');
const Child = require('../models/Child');

// @desc    Get vaccination records for a child
// @route   GET /api/vaccinations/child/:childId
// @access  Private
const getVaccinationsByChild = async (req, res) => {
    try {
        const records = await VaccinationRecord.find({ child: req.params.childId })
            .populate('vaccine', 'name description totalDoses')
            .populate('doctor', 'name')
            .sort({ scheduledDate: 1 });

        res.json(records);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// @desc    Update vaccination status (administer vaccine)
// @route   PUT /api/vaccinations/:id
// @access  Private (Doctor)
const updateVaccinationStatus = async (req, res) => {
    try {
        const { status, administeredDate, notes, batchNumber } = req.body;

        const record = await VaccinationRecord.findById(req.params.id)
            .populate('child')
            .populate('vaccine');

        if (!record) {
            return res.status(404).json({ message: 'Enregistrement non trouvé' });
        }

        record.status = status;
        record.doctor = req.user._id;

        if (status === 'completed') {
            record.administeredDate = administeredDate || new Date();
        }

        if (notes) record.notes = notes;
        if (batchNumber) record.batchNumber = batchNumber;

        await record.save();

        // Create notification for parent
        const child = await Child.findById(record.child._id);
        if (child) {
            await Notification.create({
                user: child.parent,
                type: 'confirmation',
                title: 'Vaccination effectuée',
                message: `${record.vaccine.name} (Dose ${record.doseNumber}) a été administré à ${child.name}`,
                relatedChild: child._id,
                relatedVaccine: record.vaccine._id
            });
        }

        res.json(record);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// @desc    Get upcoming vaccinations (for doctor dashboard)
// @route   GET /api/vaccinations/upcoming
// @access  Private (Doctor)
const getUpcomingVaccinations = async (req, res) => {
    try {
        const today = new Date();
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        const records = await VaccinationRecord.find({
            status: 'scheduled',
            scheduledDate: { $gte: today, $lte: nextMonth }
        })
            .populate('child', 'name birthDate parent')
            .populate('vaccine', 'name')
            .populate({
                path: 'child',
                populate: { path: 'parent', select: 'name phone' }
            })
            .sort({ scheduledDate: 1 })
            .limit(50);

        res.json(records);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// @desc    Get delayed vaccinations
// @route   GET /api/vaccinations/delayed
// @access  Private (Doctor/Admin)
const getDelayedVaccinations = async (req, res) => {
    try {
        const today = new Date();

        const records = await VaccinationRecord.find({
            status: { $in: ['scheduled', 'delayed'] },
            scheduledDate: { $lt: today }
        })
            .populate('child', 'name birthDate')
            .populate('vaccine', 'name')
            .populate({
                path: 'child',
                populate: { path: 'parent', select: 'name phone email' }
            })
            .sort({ scheduledDate: 1 });

        // Update status to delayed
        await VaccinationRecord.updateMany(
            { _id: { $in: records.map(r => r._id) }, status: 'scheduled' },
            { status: 'delayed' }
        );

        res.json(records);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// @desc    Get vaccination statistics
// @route   GET /api/vaccinations/stats
// @access  Private (All authenticated users)
const getVaccinationStats = async (req, res) => {
    try {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        // For parents, only get stats for their own children
        let childFilter = {};
        if (req.user.role === 'parent') {
            const parentChildren = await Child.find({ parent: req.user._id }).select('_id');
            const childIds = parentChildren.map(c => c._id);
            childFilter = { child: { $in: childIds } };
        }

        const totalChildren = req.user.role === 'parent'
            ? await Child.countDocuments({ parent: req.user._id, isActive: true })
            : await Child.countDocuments({ isActive: true });

        const completedThisMonth = await VaccinationRecord.countDocuments({
            ...childFilter,
            status: 'completed',
            administeredDate: { $gte: startOfMonth, $lte: endOfMonth }
        });

        const delayed = await VaccinationRecord.countDocuments({
            ...childFilter,
            status: 'delayed'
        });

        const scheduled = await VaccinationRecord.countDocuments({
            ...childFilter,
            status: 'scheduled'
        });

        const completed = await VaccinationRecord.countDocuments({
            ...childFilter,
            status: 'completed'
        });

        res.json({
            totalChildren,
            completedThisMonth,
            delayed,
            scheduled,
            completed,
            completionRate: completed > 0 ? Math.round((completed / (completed + scheduled + delayed)) * 100) : 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

module.exports = {
    getVaccinationsByChild,
    updateVaccinationStatus,
    getUpcomingVaccinations,
    getDelayedVaccinations,
    getVaccinationStats
};
