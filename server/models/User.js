const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        enum: ['parent', 'doctor', 'admin'],
        default: 'parent'
    },
    // Doctor specific fields
    specialty: {
        type: String,
        trim: true
    },
    healthCenter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HealthCenter'
    },
    // Profile
    address: {
        type: String,
        trim: true
    },
    avatar: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Two-Factor Authentication
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorCode: {
        type: String
    },
    twoFactorExpires: {
        type: Date
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match password method
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
