const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const Child = require('../models/Child');

// @desc    Get appointments
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res) => {
    try {
        let query = {};

        if (req.user.role === 'parent') {
            query.parent = req.user._id;
        } else if (req.user.role === 'doctor') {
            query.doctor = req.user._id;
        }

        const appointments = await Appointment.find(query)
            .populate('child', 'name birthDate')
            .populate('parent', 'name phone email')
            .populate('doctor', 'name specialty')
            .populate('vaccines', 'name')
            .sort({ scheduledDate: -1 });

        res.json(appointments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
const getAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate('child', 'name birthDate gender')
            .populate('parent', 'name phone email')
            .populate('doctor', 'name specialty')
            .populate('vaccines', 'name description');

        if (!appointment) {
            return res.status(404).json({ message: 'Rendez-vous non trouvé' });
        }

        res.json(appointment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// @desc    Create appointment (Parent requests)
// @route   POST /api/appointments
// @access  Private (Parent)
const createAppointment = async (req, res) => {
    try {
        const { childId, scheduledDate, scheduledTime, type, vaccines, notes } = req.body;

        // Verify child belongs to parent
        const child = await Child.findById(childId);
        if (!child || child.parent.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        const appointment = await Appointment.create({
            child: childId,
            parent: req.user._id,
            scheduledDate,
            scheduledTime,
            type: type || 'vaccination',
            vaccines,
            notes,
            status: 'pending'
        });

        const populatedAppointment = await Appointment.findById(appointment._id)
            .populate('child', 'name')
            .populate('vaccines', 'name');

        res.status(201).json(populatedAppointment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// @desc    Update appointment status (Doctor accepts/rejects)
// @route   PUT /api/appointments/:id
// @access  Private (Doctor)
const updateAppointment = async (req, res) => {
    try {
        const { status, scheduledDate, scheduledTime, rejectionReason, notes } = req.body;

        const appointment = await Appointment.findById(req.params.id)
            .populate('child', 'name');

        if (!appointment) {
            return res.status(404).json({ message: 'Rendez-vous non trouvé' });
        }

        // Update fields
        if (status) appointment.status = status;
        if (scheduledDate) appointment.scheduledDate = scheduledDate;
        if (scheduledTime) appointment.scheduledTime = scheduledTime;
        if (rejectionReason) appointment.rejectionReason = rejectionReason;
        if (notes) appointment.notes = notes;

        if (req.user.role === 'doctor' && !appointment.doctor) {
            appointment.doctor = req.user._id;
        }

        await appointment.save();

        // Send notification to parent
        let notificationMessage = '';
        let notificationType = 'info';

        if (status === 'confirmed') {
            notificationMessage = `Votre rendez-vous pour ${appointment.child.name} le ${new Date(appointment.scheduledDate).toLocaleDateString('fr-FR')} à ${appointment.scheduledTime} a été confirmé.`;
            notificationType = 'confirmation';
        } else if (status === 'rejected') {
            notificationMessage = `Votre rendez-vous pour ${appointment.child.name} a été refusé. Raison: ${rejectionReason || 'Non spécifiée'}`;
            notificationType = 'alert';
        } else if (status === 'completed') {
            notificationMessage = `Le rendez-vous pour ${appointment.child.name} a été effectué avec succès.`;
            notificationType = 'confirmation';
        }

        if (notificationMessage) {
            await Notification.create({
                user: appointment.parent,
                type: notificationType,
                title: `Rendez-vous ${status === 'confirmed' ? 'confirmé' : status === 'rejected' ? 'refusé' : 'terminé'}`,
                message: notificationMessage,
                relatedChild: appointment.child._id,
                relatedAppointment: appointment._id
            });
        }

        const populatedAppointment = await Appointment.findById(appointment._id)
            .populate('child', 'name birthDate')
            .populate('parent', 'name phone')
            .populate('doctor', 'name specialty')
            .populate('vaccines', 'name');

        res.json(populatedAppointment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// @desc    Delete/Cancel appointment
// @route   DELETE /api/appointments/:id
// @access  Private
const deleteAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ message: 'Rendez-vous non trouvé' });
        }

        // Check authorization
        if (req.user.role === 'parent' && appointment.parent.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        appointment.status = 'cancelled';
        await appointment.save();

        res.json({ message: 'Rendez-vous annulé avec succès' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// @desc    Get pending appointments (for doctor)
// @route   GET /api/appointments/pending
// @access  Private (Doctor)
const getPendingAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find({ status: 'pending' })
            .populate('child', 'name birthDate gender')
            .populate('parent', 'name phone email')
            .populate('vaccines', 'name')
            .sort({ scheduledDate: 1 });

        res.json(appointments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// @desc    Get today's appointments
// @route   GET /api/appointments/today
// @access  Private (Doctor)
const getTodayAppointments = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const appointments = await Appointment.find({
            scheduledDate: { $gte: today, $lt: tomorrow },
            status: 'confirmed'
        })
            .populate('child', 'name birthDate gender')
            .populate('parent', 'name phone')
            .populate('vaccines', 'name')
            .sort({ scheduledTime: 1 });

        res.json(appointments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

module.exports = {
    getAppointments,
    getAppointment,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    getPendingAppointments,
    getTodayAppointments
};
