const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { send2FACode, send2FAEnabledNotification, generate2FACode } = require('../services/emailService');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
    try {
        const { name, email, password, role, phone, specialty } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            role: role || 'parent',
            phone,
            specialty: role === 'doctor' ? specialty : undefined
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id)
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        // Check password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(403).json({ message: 'Votre compte a été désactivé. Contactez l\'administrateur.' });
        }

        // Check if 2FA is enabled
        if (user.twoFactorEnabled) {
            // Generate and send 2FA code
            const code = generate2FACode();
            user.twoFactorCode = code;
            user.twoFactorExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
            await user.save({ validateBeforeSave: false });

            // Send code via email
            await send2FACode(user.email, code, user.name);

            return res.json({
                requires2FA: true,
                userId: user._id,
                email: user.email,
                message: 'Code de vérification envoyé par email'
            });
        }

        // No 2FA - return token directly
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            twoFactorEnabled: user.twoFactorEnabled,
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// @desc    Verify 2FA code
// @route   POST /api/auth/verify-2fa
// @access  Public
const verify2FA = async (req, res) => {
    try {
        const { userId, code } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Check if code matches and is not expired
        if (user.twoFactorCode !== code) {
            return res.status(401).json({ message: 'Code incorrect' });
        }

        if (user.twoFactorExpires < new Date()) {
            return res.status(401).json({ message: 'Code expiré. Veuillez vous reconnecter.' });
        }

        // Clear the 2FA code
        user.twoFactorCode = undefined;
        user.twoFactorExpires = undefined;
        await user.save({ validateBeforeSave: false });

        // Return token
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            twoFactorEnabled: user.twoFactorEnabled,
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// @desc    Resend 2FA code
// @route   POST /api/auth/resend-2fa
// @access  Public
const resend2FACode = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Generate new code
        const code = generate2FACode();
        user.twoFactorCode = code;
        user.twoFactorExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save({ validateBeforeSave: false });

        // Send code
        await send2FACode(user.email, code, user.name);

        res.json({ message: 'Nouveau code envoyé par email' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// @desc    Toggle 2FA
// @route   PUT /api/auth/toggle-2fa
// @access  Private
const toggle2FA = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        user.twoFactorEnabled = !user.twoFactorEnabled;
        await user.save({ validateBeforeSave: false });

        // Send notification if enabled
        if (user.twoFactorEnabled) {
            await send2FAEnabledNotification(user.email, user.name);
        }

        res.json({
            twoFactorEnabled: user.twoFactorEnabled,
            message: user.twoFactorEnabled
                ? 'Authentification à deux facteurs activée'
                : 'Authentification à deux facteurs désactivée'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.phone = req.body.phone || user.phone;
            user.address = req.body.address || user.address;

            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                phone: updatedUser.phone,
                address: updatedUser.address
            });
        } else {
            res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// @desc    Get all doctors
// @route   GET /api/auth/doctors
// @access  Private
const getDoctors = async (req, res) => {
    try {
        const doctors = await User.find({ role: 'doctor' })
            .select('name email phone specialty healthCenter')
            .sort({ name: 1 });
        res.json(doctors);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// @desc    Get all users (Admin)
// @route   GET /api/auth/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// @desc    Update user (Admin)
// @route   PUT /api/auth/users/:id
// @access  Private (Admin)
const updateUser = async (req, res) => {
    try {
        const { role, isActive } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Prevent admin from changing their own role
        if (user._id.toString() === req.user._id.toString() && role && role !== user.role) {
            return res.status(400).json({ message: 'Vous ne pouvez pas modifier votre propre rôle' });
        }

        if (role) user.role = role;
        if (typeof isActive === 'boolean') user.isActive = isActive;

        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// @desc    Toggle user active status (Admin)
// @route   PUT /api/auth/users/:id/toggle
// @access  Private (Admin)
const toggleUserActive = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Prevent admin from deactivating themselves
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Vous ne pouvez pas vous désactiver' });
        }

        user.isActive = !user.isActive;
        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            isActive: user.isActive,
            message: user.isActive ? 'Utilisateur activé' : 'Utilisateur désactivé'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

module.exports = {
    register,
    login,
    verify2FA,
    resend2FACode,
    toggle2FA,
    getMe,
    updateProfile,
    getDoctors,
    getAllUsers,
    updateUser,
    toggleUserActive
};

