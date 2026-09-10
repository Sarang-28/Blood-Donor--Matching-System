const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const { notFoundHandler, errorHandler } = require('./middlewares/errorMiddleware');

// Import Route Handlers
const authRoutes = require('./routes/authRoutes');
const donorRoutes = require('./routes/donorRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const patientRoutes = require('./routes/patientRoutes');
const ngoRoutes = require('./routes/ngoRoutes');
const bloodRequestRoutes = require('./routes/bloodRequestRoutes');
const matchingRoutes = require('./routes/matchingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Middlewares
app.use(cors({
    origin: env.clientUrl || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'online',
        timestamp: new Date().toISOString(),
        service: 'Hyperlocal Blood Donor Matching Backend API',
    });
});

// API Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/ngos', ngoRoutes);
app.use('/api/blood-requests', bloodRequestRoutes);
app.use('/api/matches', matchingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Fallback 404 handler for undefined routes
app.use(notFoundHandler);

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
