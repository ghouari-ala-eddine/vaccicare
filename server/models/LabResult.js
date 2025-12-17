const mongoose = require('mongoose');

const labResultSchema = new mongoose.Schema({
    child: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Child',
        required: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Le titre est requis'],
        trim: true,
        maxlength: [200, 'Le titre ne peut pas dépasser 200 caractères']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères']
    },
    testType: {
        type: String,
        enum: ['blood', 'urine', 'xray', 'scan', 'allergy', 'genetic', 'other'],
        default: 'other'
    },
    testDate: {
        type: Date,
        required: [true, 'La date du test est requise']
    },
    fileName: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    // Base64 encoded file data for small files (PDFs, images)
    fileData: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'normal', 'abnormal'],
        default: 'pending'
    },
    doctorComments: {
        type: String,
        trim: true
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for efficient querying
labResultSchema.index({ child: 1, testDate: -1 });

module.exports = mongoose.model('LabResult', labResultSchema);
