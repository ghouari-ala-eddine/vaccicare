const DoctorSchedule = require('../models/DoctorSchedule');
const User = require('../models/User');

// @desc    Get doctor's schedule for a date range
// @route   GET /api/schedules/doctor/:doctorId
// @access  Private
const getDoctorSchedule = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { startDate, endDate } = req.query;

        const query = { doctor: doctorId };

        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        } else if (startDate) {
            query.date = { $gte: new Date(startDate) };
        }

        const schedules = await DoctorSchedule.find(query)
            .populate('doctor', 'name')
            .populate('slots.bookedBy', 'name')
            .sort({ date: 1 });

        res.json(schedules);
    } catch (error) {
        console.error('Error fetching schedule:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// @desc    Get my schedule (for doctors)
// @route   GET /api/schedules/my-schedule
// @access  Private (Doctor)
const getMySchedule = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const query = {
            doctor: req.user._id,
            date: { $gte: today }
        };

        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const schedules = await DoctorSchedule.find(query)
            .populate('slots.bookedBy', 'name phone')
            .sort({ date: 1 });

        res.json(schedules);
    } catch (error) {
        console.error('Error fetching my schedule:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// @desc    Create or update schedule for a date
// @route   POST /api/schedules
// @access  Private (Doctor)
const createOrUpdateSchedule = async (req, res) => {
    try {
        const { date, slots, isAvailable, notes } = req.body;

        if (!date) {
            return res.status(400).json({ message: 'La date est requise' });
        }

        const scheduleDate = new Date(date);
        scheduleDate.setHours(0, 0, 0, 0);

        // Check if schedule exists
        let schedule = await DoctorSchedule.findOne({
            doctor: req.user._id,
            date: scheduleDate
        });

        if (schedule) {
            // Update existing schedule
            if (slots) schedule.slots = slots;
            if (isAvailable !== undefined) schedule.isAvailable = isAvailable;
            if (notes !== undefined) schedule.notes = notes;
            await schedule.save();
        } else {
            // Create new schedule
            schedule = await DoctorSchedule.create({
                doctor: req.user._id,
                date: scheduleDate,
                slots: slots || [],
                isAvailable: isAvailable !== undefined ? isAvailable : true,
                notes: notes || ''
            });
        }

        const populatedSchedule = await DoctorSchedule.findById(schedule._id)
            .populate('doctor', 'name')
            .populate('slots.bookedBy', 'name');

        res.status(201).json(populatedSchedule);
    } catch (error) {
        console.error('Error creating/updating schedule:', error);
        res.status(500).json({ message: error.message || 'Erreur serveur' });
    }
};

// @desc    Add time slots to a date
// @route   POST /api/schedules/:id/slots
// @access  Private (Doctor)
const addSlots = async (req, res) => {
    try {
        const { id } = req.params;
        const { slots } = req.body;

        const schedule = await DoctorSchedule.findById(id);

        if (!schedule) {
            return res.status(404).json({ message: 'Horaire non trouvé' });
        }

        if (schedule.doctor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        schedule.slots.push(...slots);
        await schedule.save();

        res.json(schedule);
    } catch (error) {
        console.error('Error adding slots:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// @desc    Delete a schedule
// @route   DELETE /api/schedules/:id
// @access  Private (Doctor)
const deleteSchedule = async (req, res) => {
    try {
        const { id } = req.params;

        const schedule = await DoctorSchedule.findById(id);

        if (!schedule) {
            return res.status(404).json({ message: 'Horaire non trouvé' });
        }

        if (schedule.doctor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        // Check if any slots are booked
        const hasBookings = schedule.slots.some(slot => slot.isBooked);
        if (hasBookings) {
            return res.status(400).json({
                message: 'Impossible de supprimer un horaire avec des réservations'
            });
        }

        await DoctorSchedule.findByIdAndDelete(id);
        res.json({ message: 'Horaire supprimé avec succès' });
    } catch (error) {
        console.error('Error deleting schedule:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// @desc    Get available doctors with their schedules
// @route   GET /api/schedules/available
// @access  Private
const getAvailableDoctors = async (req, res) => {
    try {
        const { date } = req.query;
        const searchDate = date ? new Date(date) : new Date();
        searchDate.setHours(0, 0, 0, 0);

        // Get all doctors
        const doctors = await User.find({
            role: 'doctor',
            isActive: true
        }).select('name phone specialty');

        // Get schedules for the date
        const schedules = await DoctorSchedule.find({
            date: searchDate,
            isAvailable: true
        }).populate('doctor', 'name phone specialty');

        // Combine data
        const doctorsWithSchedules = doctors.map(doctor => {
            const schedule = schedules.find(
                s => s.doctor._id.toString() === doctor._id.toString()
            );
            return {
                doctor: {
                    _id: doctor._id,
                    name: doctor.name,
                    phone: doctor.phone,
                    specialty: doctor.specialty
                },
                schedule: schedule ? {
                    _id: schedule._id,
                    date: schedule.date,
                    availableSlots: schedule.slots.filter(s => !s.isBooked),
                    totalSlots: schedule.slots.length
                } : null
            };
        });

        res.json(doctorsWithSchedules);
    } catch (error) {
        console.error('Error fetching available doctors:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// @desc    Book a slot
// @route   POST /api/schedules/:id/book/:slotId
// @access  Private (Parent)
const bookSlot = async (req, res) => {
    try {
        const { id, slotId } = req.params;

        const schedule = await DoctorSchedule.findById(id);

        if (!schedule) {
            return res.status(404).json({ message: 'Horaire non trouvé' });
        }

        const slot = schedule.slots.id(slotId);

        if (!slot) {
            return res.status(404).json({ message: 'Créneau non trouvé' });
        }

        if (slot.isBooked) {
            return res.status(400).json({ message: 'Ce créneau est déjà réservé' });
        }

        slot.isBooked = true;
        slot.bookedBy = req.user._id;
        await schedule.save();

        const populatedSchedule = await DoctorSchedule.findById(id)
            .populate('doctor', 'name')
            .populate('slots.bookedBy', 'name');

        res.json(populatedSchedule);
    } catch (error) {
        console.error('Error booking slot:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// @desc    Cancel a booking
// @route   DELETE /api/schedules/:id/book/:slotId
// @access  Private
const cancelBooking = async (req, res) => {
    try {
        const { id, slotId } = req.params;

        const schedule = await DoctorSchedule.findById(id);

        if (!schedule) {
            return res.status(404).json({ message: 'Horaire non trouvé' });
        }

        const slot = schedule.slots.id(slotId);

        if (!slot) {
            return res.status(404).json({ message: 'Créneau non trouvé' });
        }

        // Check if user can cancel (owner or doctor)
        const canCancel = slot.bookedBy?.toString() === req.user._id.toString() ||
            schedule.doctor.toString() === req.user._id.toString() ||
            req.user.role === 'admin';

        if (!canCancel) {
            return res.status(403).json({ message: 'Non autorisé à annuler cette réservation' });
        }

        slot.isBooked = false;
        slot.bookedBy = undefined;
        await schedule.save();

        res.json({ message: 'Réservation annulée' });
    } catch (error) {
        console.error('Error canceling booking:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = {
    getDoctorSchedule,
    getMySchedule,
    createOrUpdateSchedule,
    addSlots,
    deleteSchedule,
    getAvailableDoctors,
    bookSlot,
    cancelBooking
};
