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
        required: [true, 'Le message ne peut pas être vide'],
        trim: true,
        maxlength: [2000, 'Le message ne peut pas dépasser 2000 caractères']
    },
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    messageType: {
        type: String,
        enum: ['text', 'system'],
        default: 'text'
    }
}, {
    timestamps: true
});

// Index for efficient querying
messageSchema.index({ conversation: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
