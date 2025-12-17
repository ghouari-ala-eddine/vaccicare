const LabResult = require('../models/LabResult');
const Child = require('../models/Child');
const fs = require('fs');
const path = require('path');

// @desc    Get all lab results for a child
// @route   GET /api/lab-results/child/:childId
// @access  Private
const getLabResultsByChild = async (req, res) => {
    try {
        const { childId } = req.params;

        // Verify child exists
        const child = await Child.findById(childId);
        if (!child) {
            return res.status(404).json({ message: 'Enfant non trouvé' });
        }

        // Parents can only see their own children's results
        if (req.user.role === 'parent' && child.parent.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        const labResults = await LabResult.find({ child: childId })
            .populate('uploadedBy', 'name role')
            .populate('reviewedBy', 'name')
            .sort({ testDate: -1 });

        // Don't send file data in list view to save bandwidth
        const resultsWithoutFileData = labResults.map(result => {
            const obj = result.toObject();
            delete obj.fileData;
            return obj;
        });

        res.json(resultsWithoutFileData);
    } catch (error) {
        console.error('Error fetching lab results:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// @desc    Get single lab result with file data
// @route   GET /api/lab-results/:id
// @access  Private
const getLabResult = async (req, res) => {
    try {
        const { id } = req.params;

        const labResult = await LabResult.findById(id)
            .populate('uploadedBy', 'name role')
            .populate('reviewedBy', 'name')
            .populate('child', 'firstName lastName');

        if (!labResult) {
            return res.status(404).json({ message: 'Résultat non trouvé' });
        }

        // Check access
        const child = await Child.findById(labResult.child);
        if (req.user.role === 'parent' && child.parent.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        res.json(labResult);
    } catch (error) {
        console.error('Error fetching lab result:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// @desc    Upload a new lab result
// @route   POST /api/lab-results
// @access  Private (Doctor/Admin or Parent for their own children)
const uploadLabResult = async (req, res) => {
    try {
        const { childId, title, description, testType, testDate, fileData, fileName, fileType, fileSize } = req.body;

        if (!childId || !title || !testDate || !fileData) {
            return res.status(400).json({ message: 'Données requises manquantes' });
        }

        // Verify child exists
        const child = await Child.findById(childId);
        if (!child) {
            return res.status(404).json({ message: 'Enfant non trouvé' });
        }

        // Parents can only upload for their own children
        if (req.user.role === 'parent' && child.parent.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        const labResult = await LabResult.create({
            child: childId,
            uploadedBy: req.user._id,
            title,
            description,
            testType: testType || 'other',
            testDate: new Date(testDate),
            fileName,
            fileType,
            fileSize,
            filePath: `uploads/${childId}/${fileName}`,
            fileData,
            status: 'pending'
        });

        const populatedResult = await LabResult.findById(labResult._id)
            .populate('uploadedBy', 'name role');

        res.status(201).json(populatedResult);
    } catch (error) {
        console.error('Error uploading lab result:', error);
        res.status(500).json({ message: error.message || 'Erreur serveur' });
    }
};

// @desc    Update lab result (review by doctor)
// @route   PUT /api/lab-results/:id
// @access  Private (Doctor/Admin only)
const updateLabResult = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, doctorComments } = req.body;

        const labResult = await LabResult.findById(id);
        if (!labResult) {
            return res.status(404).json({ message: 'Résultat non trouvé' });
        }

        // Only doctors and admins can review
        if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Seuls les médecins peuvent examiner les résultats' });
        }

        if (status) labResult.status = status;
        if (doctorComments !== undefined) labResult.doctorComments = doctorComments;

        if (status && status !== 'pending') {
            labResult.reviewedBy = req.user._id;
            labResult.reviewedAt = new Date();
        }

        await labResult.save();

        const populatedResult = await LabResult.findById(labResult._id)
            .populate('uploadedBy', 'name role')
            .populate('reviewedBy', 'name');

        res.json(populatedResult);
    } catch (error) {
        console.error('Error updating lab result:', error);
        res.status(500).json({ message: error.message || 'Erreur serveur' });
    }
};

// @desc    Delete a lab result
// @route   DELETE /api/lab-results/:id
// @access  Private (Uploader or Admin)
const deleteLabResult = async (req, res) => {
    try {
        const { id } = req.params;

        const labResult = await LabResult.findById(id);
        if (!labResult) {
            return res.status(404).json({ message: 'Résultat non trouvé' });
        }

        // Only the uploader or admin can delete
        if (req.user.role !== 'admin' && labResult.uploadedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Non autorisé à supprimer ce résultat' });
        }

        await LabResult.findByIdAndDelete(id);

        res.json({ message: 'Résultat supprimé avec succès' });
    } catch (error) {
        console.error('Error deleting lab result:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = {
    getLabResultsByChild,
    getLabResult,
    uploadLabResult,
    updateLabResult,
    deleteLabResult
};
