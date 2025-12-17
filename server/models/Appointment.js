const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    child: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Child',
        required: true
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    scheduledDate: {
        type: Date,
        required: true
    },
    scheduledTime: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed', 'rejected'],
        default: 'pending'
    },
    type: {
        type: String,
        enum: ['vaccination', 'checkup', 'consultation'],
        default: 'vaccination'
    },
    vaccines: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vaccine'
    }],
    notes: {
        type: String,
        trim: true
    },
    healthCenter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HealthCenter'
    },
    rejectionReason: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Appointment', appointmentSchema);
