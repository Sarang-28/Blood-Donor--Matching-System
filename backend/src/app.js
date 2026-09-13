const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const { notFoundHandler, errorHandler } = require('./middlewares/errorMiddleware');

// Import Route Handlers
const authRoutes = require('./routes/authRoutes');
const donorRoutes = require('./routes/donorRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const patientRoutes = require('./routes/patientRoutes');
const bloodBankRoutes = require('./routes/bloodBankRoutes');
const bloodRequestRoutes = require('./routes/bloodRequestRoutes');
const matchingRoutes = require('./routes/matchingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Security HTTP headers
app.use(helmet());

// Request logging
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

// CORS configuration
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5000',
    env.clientUrl,
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, same-origin, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        // Allow any Vercel preview or production deployments
        if (origin.endsWith('.vercel.app')) return callback(null, true);
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting: general API limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // limit each IP to 300 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes.',
    },
});
app.use('/api', apiLimiter);

// Stricter rate limiting for authentication routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30, // 30 attempts per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many login attempts. Please wait 15 minutes before trying again.',
    },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body parser with payload limits
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: true, limit: '20kb' }));

// Backend root endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Hyperlocal Blood Donor Matching API is running',
        version: '1.0.0',
    });
});

// Base API root endpoint
app.get('/api', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Hyperlocal Blood Donor Matching API is operational',
        version: '1.0.0',
        documentation: {
            health: '/api/health',
            auth: '/api/auth',
            donors: '/api/donors',
            bloodRequests: '/api/blood-requests',
            bloodBanks: '/api/blood-banks',
            hospitals: '/api/hospitals',
            matches: '/api/matches',
            admin: '/api/admin',
            notifications: '/api/notifications',
        },
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'online',
        timestamp: new Date().toISOString(),
        service: 'Hyperlocal Blood Donor Matching Backend API',
        environment: env.nodeEnv,
    });
});

// API Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/blood-banks', bloodBankRoutes);
// Backward compatibility alias for ngo endpoint
app.use('/api/ngos', bloodBankRoutes);
app.use('/api/blood-requests', bloodRequestRoutes);
app.use('/api/matches', matchingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Fallback 404 handler for undefined routes
app.use(notFoundHandler);

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
