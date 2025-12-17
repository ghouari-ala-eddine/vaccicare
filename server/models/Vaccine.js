const mongoose = require('mongoose');

const vaccineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    // Recommended ages in months for each dose
    recommendedAges: [{
        type: Number,
        required: true
    }],
    totalDoses: {
        type: Number,
        required: true,
        default: 1
    },
    isMandatory: {
        type: Boolean,
        default: true
    },
    sideEffects: {
        type: String,
        trim: true
    },
    contraindications: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Vaccine', vaccineSchema);
