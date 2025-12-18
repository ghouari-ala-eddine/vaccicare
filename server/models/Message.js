const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        trim: true,
        maxlength: [2000, 'Le message ne peut pas dépasser 2000 caractères']
    },
    // Voice note fields
    audioData: {
        type: String  // Base64 encoded audio
    },
    audioDuration: {
        type: Number  // Duration in seconds
    },
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    messageType: {
        type: String,
        enum: ['text', 'audio', 'system'],
        default: 'text'
    }
}, {
    timestamps: true
});

// Validation - require content for text, audioData for audio
messageSchema.pre('validate', function (next) {
    if (this.messageType === 'text' && (!this.content || !this.content.trim())) {
        this.invalidate('content', 'Le message ne peut pas être vide');
    }
    if (this.messageType === 'audio' && !this.audioData) {
        this.invalidate('audioData', 'Audio data is required for voice messages');
    }
    next();
});

// Index for efficient querying
messageSchema.index({ conversation: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);

