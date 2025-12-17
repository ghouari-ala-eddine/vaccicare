const mongoose = require('mongoose');

const sideEffectSchema = new mongoose.Schema({
    child: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Child',
        required: true
    },
    vaccination: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VaccinationRecord',
        required: true
    },
    vaccine: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vaccine',
        required: true
    },
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    symptoms: [{
        type: String,
        enum: [
            'fever',           // Fièvre
            'swelling',        // Gonflement
            'redness',         // Rougeur
            'pain',            // Douleur
            'fatigue',         // Fatigue
            'headache',        // Maux de tête
            'nausea',          // Nausées
            'vomiting',        // Vomissements
            'rash',            // Éruption cutanée
            'allergic',        // Réaction allergique
            'other'            // Autre
        ]
    }],
    severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe'],
        default: 'mild'
    },
    description: {
        type: String,
        maxlength: 1000
    },
    onsetDate: {
        type: Date,
        required: true
    },
    duration: {
        type: String // e.g., "2 jours", "quelques heures"
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'resolved'],
        default: 'pending'
    },
    doctorNotes: {
        type: String
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SideEffect', sideEffectSchema);
