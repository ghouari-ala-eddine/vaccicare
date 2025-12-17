const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Le titre est requis'],
        trim: true,
        maxlength: [200, 'Le titre ne peut pas dépasser 200 caractères']
    },
    message: {
        type: String,
        required: [true, 'Le message est requis'],
        trim: true,
        maxlength: [2000, 'Le message ne peut pas dépasser 2000 caractères']
    },
    type: {
        type: String,
        enum: ['info', 'warning', 'alert', 'success'],
        default: 'info'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    targetAudience: {
        type: String,
        enum: ['all', 'parents', 'doctors'],
        default: 'all'
    },
    expiresAt: {
        type: Date,
        default: null
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Index for efficient querying of active announcements
announcementSchema.index({ isActive: 1, expiresAt: 1, createdAt: -1 });

// Virtual to check if announcement is expired
announcementSchema.virtual('isExpired').get(function () {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
});

// Ensure virtuals are included when converting to JSON
announcementSchema.set('toJSON', { virtuals: true });
announcementSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Announcement', announcementSchema);
