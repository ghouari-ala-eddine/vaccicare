const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    isBooked: {
        type: Boolean,
        default: false
    },
    bookedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

const doctorScheduleSchema = new mongoose.Schema({
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    slots: [timeSlotSchema],
    isAvailable: {
        type: Boolean,
        default: true
    },
    notes: {
        type: String,
        maxlength: 500
    }
}, {
    timestamps: true
});

// Compound index to ensure one schedule per doctor per date
doctorScheduleSchema.index({ doctor: 1, date: 1 }, { unique: true });

// Static method to get available slots for a doctor on a date
doctorScheduleSchema.statics.getAvailableSlots = async function (doctorId, date) {
    const schedule = await this.findOne({
        doctor: doctorId,
        date: new Date(date).setHours(0, 0, 0, 0),
        isAvailable: true
    });

    if (!schedule) return [];

    return schedule.slots.filter(slot => !slot.isBooked);
};

module.exports = mongoose.model('DoctorSchedule', doctorScheduleSchema);
