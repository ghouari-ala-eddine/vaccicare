const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const setupDefaultAdmin = require('./config/setupAdmin');

// Load env vars
dotenv.config();

// Connect to database and setup admin
connectDB().then(() => {
    // Setup the default admin account
    setupDefaultAdmin();
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/children', require('./routes/childRoutes'));
app.use('/api/vaccines', require('./routes/vaccineRoutes'));
app.use('/api/vaccinations', require('./routes/vaccinationRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/side-effects', require('./routes/sideEffectRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/notes', require('./routes/noteRoutes'));
app.use('/api/lab-results', require('./routes/labResultRoutes'));
app.use('/api/schedules', require('./routes/scheduleRoutes'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Vaccination API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
