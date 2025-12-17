const Vaccine = require('../models/Vaccine');

// @desc    Get all vaccines
// @route   GET /api/vaccines
// @access  Private
const getVaccines = async (req, res) => {
    try {
        const vaccines = await Vaccine.find({ isActive: true }).sort({ recommendedAges: 1 });
        res.json(vaccines);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// @desc    Get single vaccine
// @route   GET /api/vaccines/:id
// @access  Private
const getVaccine = async (req, res) => {
    try {
        const vaccine = await Vaccine.findById(req.params.id);
        if (!vaccine) {
            return res.status(404).json({ message: 'Vaccin non trouvé' });
        }
        res.json(vaccine);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// @desc    Create vaccine
// @route   POST /api/vaccines
// @access  Private (Admin)
const createVaccine = async (req, res) => {
    try {
        const vaccine = await Vaccine.create(req.body);
        res.status(201).json(vaccine);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// @desc    Update vaccine
// @route   PUT /api/vaccines/:id
// @access  Private (Admin)
const updateVaccine = async (req, res) => {
    try {
        const vaccine = await Vaccine.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!vaccine) {
            return res.status(404).json({ message: 'Vaccin non trouvé' });
        }

        res.json(vaccine);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// @desc    Delete vaccine
// @route   DELETE /api/vaccines/:id
// @access  Private (Admin)
const deleteVaccine = async (req, res) => {
    try {
        const vaccine = await Vaccine.findById(req.params.id);

        if (!vaccine) {
            return res.status(404).json({ message: 'Vaccin non trouvé' });
        }

        vaccine.isActive = false;
        await vaccine.save();

        res.json({ message: 'Vaccin désactivé avec succès' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// @desc    Seed initial vaccines (Algerian calendar)
// @route   POST /api/vaccines/seed
// @access  Private (Admin)
const seedVaccines = async (req, res) => {
    try {
        const nationalVaccines = [
            {
                name: 'BCG',
                description: 'Vaccin contre la tuberculose',
                recommendedAges: [0],
                totalDoses: 1,
                isMandatory: true
            },
            {
                name: 'Hépatite B',
                description: 'Vaccin contre l\'hépatite B',
                recommendedAges: [0, 1, 6],
                totalDoses: 3,
                isMandatory: true
            },
            {
                name: 'DTP-Hib-HepB (Pentavalent)',
                description: 'Diphtérie, Tétanos, Coqueluche, Haemophilus influenzae b, Hépatite B',
                recommendedAges: [2, 3, 4],
                totalDoses: 3,
                isMandatory: true
            },
            {
                name: 'Polio (VPO)',
                description: 'Vaccin oral contre la poliomyélite',
                recommendedAges: [2, 3, 4, 16],
                totalDoses: 4,
                isMandatory: true
            },
            {
                name: 'Pneumocoque',
                description: 'Vaccin contre les infections à pneumocoque',
                recommendedAges: [2, 4, 12],
                totalDoses: 3,
                isMandatory: true
            },
            {
                name: 'Rougeole-Rubéole (RR)',
                description: 'Vaccin contre la rougeole et la rubéole',
                recommendedAges: [9, 18],
                totalDoses: 2,
                isMandatory: true
            },
            {
                name: 'DTP (Rappel)',
                description: 'Rappel Diphtérie, Tétanos, Coqueluche',
                recommendedAges: [18, 72],
                totalDoses: 2,
                isMandatory: true
            }
        ];

        await Vaccine.deleteMany({});
        await Vaccine.insertMany(nationalVaccines);

        res.json({ message: 'Calendrier vaccinal national initialisé avec succès', count: nationalVaccines.length });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

module.exports = { getVaccines, getVaccine, createVaccine, updateVaccine, deleteVaccine, seedVaccines };
