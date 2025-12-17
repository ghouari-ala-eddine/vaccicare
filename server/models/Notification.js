const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['reminder', 'delay', 'confirmation', 'cancellation', 'info', 'alert'],
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    relatedChild: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Child'
    },
    relatedAppointment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
    },
    relatedVaccine: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vaccine'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
