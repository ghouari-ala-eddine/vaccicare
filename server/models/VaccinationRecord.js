const mongoose = require('mongoose');

const vaccinationRecordSchema = new mongoose.Schema({
    child: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Child',
        required: true
    },
    vaccine: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vaccine',
        required: true
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    doseNumber: {
        type: Number,
        required: true,
        default: 1
    },
    scheduledDate: {
        type: Date,
        required: true
    },
    administeredDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'delayed', 'missed', 'cancelled'],
        default: 'scheduled'
    },
    notes: {
        type: String,
        trim: true
    },
    batchNumber: {
        type: String,
        trim: true
    },
    healthCenter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HealthCenter'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('VaccinationRecord', vaccinationRecordSchema);
