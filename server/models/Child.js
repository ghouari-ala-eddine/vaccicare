const mongoose = require('mongoose');

const childSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    birthDate: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        enum: ['male', 'female'],
        required: true
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    bloodType: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', '']
    },
    allergies: {
        type: String,
        trim: true
    },
    notes: {
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

// Virtual for age in months
childSchema.virtual('ageInMonths').get(function () {
    const today = new Date();
    const birth = new Date(this.birthDate);
    const months = (today.getFullYear() - birth.getFullYear()) * 12;
    return months + today.getMonth() - birth.getMonth();
});

module.exports = mongoose.model('Child', childSchema);
