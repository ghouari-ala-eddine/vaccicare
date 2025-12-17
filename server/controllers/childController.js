const Child = require('../models/Child');
const VaccinationRecord = require('../models/VaccinationRecord');
const Vaccine = require('../models/Vaccine');

// @desc    Get all children for parent
// @route   GET /api/children
// @access  Private (Parent)
const getChildren = async (req, res) => {
    try {
        let query = {};

        if (req.user.role === 'parent') {
            query.parent = req.user._id;
        }

        const children = await Child.find(query)
            .populate('parent', 'name email')
            .sort({ createdAt: -1 });

        res.json(children);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// @desc    Get single child
// @route   GET /api/children/:id
// @access  Private
const getChild = async (req, res) => {
    try {
        const child = await Child.findById(req.params.id).populate('parent', 'name email phone');

        if (!child) {
            return res.status(404).json({ message: 'Enfant non trouvé' });
        }

        // Check ownership for parents
        if (req.user.role === 'parent' && child.parent._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        // Get vaccination records
        const vaccinations = await VaccinationRecord.find({ child: child._id })
            .populate('vaccine', 'name totalDoses')
            .populate('doctor', 'name')
            .sort({ scheduledDate: 1 });

        res.json({ child, vaccinations });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// @desc    Create child
// @route   POST /api/children
// @access  Private (Parent)
const createChild = async (req, res) => {
    try {
        const { name, birthDate, gender, bloodType, allergies, notes } = req.body;

        const child = await Child.create({
            name,
            birthDate,
            gender,
            bloodType,
            allergies,
            notes,
            parent: req.user._id
        });

        // Auto-generate vaccination schedule based on national calendar
        const vaccines = await Vaccine.find({});
        console.log(`Found ${vaccines.length} vaccines in database`);
        const birthDateObj = new Date(birthDate);
        let vaccinationsCreated = 0;

        for (const vaccine of vaccines) {
            for (let i = 0; i < vaccine.recommendedAges.length; i++) {
                const scheduledDate = new Date(birthDateObj);
                scheduledDate.setMonth(scheduledDate.getMonth() + vaccine.recommendedAges[i]);

                await VaccinationRecord.create({
                    child: child._id,
                    vaccine: vaccine._id,
                    doseNumber: i + 1,
                    scheduledDate,
                    status: scheduledDate < new Date() ? 'delayed' : 'scheduled'
                });
                vaccinationsCreated++;
            }
        }

        console.log(`Created ${vaccinationsCreated} vaccination records for child ${child.name}`);

        // Get the created vaccinations to return with child
        const vaccinations = await VaccinationRecord.find({ child: child._id })
            .populate('vaccine', 'name totalDoses')
            .sort({ scheduledDate: 1 });

        res.status(201).json({ child, vaccinations, vaccinationsCreated });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// @desc    Update child
// @route   PUT /api/children/:id
// @access  Private (Parent)
const updateChild = async (req, res) => {
    try {
        let child = await Child.findById(req.params.id);

        if (!child) {
            return res.status(404).json({ message: 'Enfant non trouvé' });
        }

        // Check ownership
        if (req.user.role === 'parent' && child.parent.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        child = await Child.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.json(child);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// @desc    Delete child
// @route   DELETE /api/children/:id
// @access  Private (Parent)
const deleteChild = async (req, res) => {
    try {
        const child = await Child.findById(req.params.id);

        if (!child) {
            return res.status(404).json({ message: 'Enfant non trouvé' });
        }

        // Check ownership
        if (req.user.role === 'parent' && child.parent.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        await VaccinationRecord.deleteMany({ child: child._id });
        await child.deleteOne();

        res.json({ message: 'Enfant supprimé avec succès' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

module.exports = { getChildren, getChild, createChild, updateChild, deleteChild };
