const mongoose = require('mongoose');

const doctorNoteSchema = new mongoose.Schema({
    child: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Child',
        required: true
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: [true, 'Le contenu de la note est requis'],
        trim: true,
        maxlength: [5000, 'La note ne peut pas dépasser 5000 caractères']
    },
    category: {
        type: String,
        enum: ['general', 'vaccination', 'allergy', 'treatment', 'followup', 'other'],
        default: 'general'
    },
    isPrivate: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for efficient querying
doctorNoteSchema.index({ child: 1, doctor: 1, createdAt: -1 });

module.exports = mongoose.model('DoctorNote', doctorNoteSchema);
