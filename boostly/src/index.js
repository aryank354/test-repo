require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { initDb } = require('./db/database');

// Import routes (with error handling for missing files)
let studentRoutes, recognitionRoutes, endorsementRoutes, redemptionRoutes;

try {
    studentRoutes = require('./routes/students.routes');
} catch (err) {
    console.error('Error loading students routes:', err.message);
    process.exit(1);
}

try {
    recognitionRoutes = require('./routes/recognitions.routes');
} catch (err) {
    console.error('Error loading recognitions routes:', err.message);
    process.exit(1);
}

try {
    endorsementRoutes = require('./routes/endorsements.routes');
} catch (err) {
    console.error('Error loading endorsements routes:', err.message);
    process.exit(1);
}

try {
    redemptionRoutes = require('./routes/redemptions.routes');
} catch (err) {
    console.error('Error loading redemptions routes:', err.message);
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting - 100 requests per 10 minutes
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100,
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev')); // HTTP request logging
app.use(limiter); // Apply rate limiting to all routes

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Boostly API is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/students', studentRoutes);
app.use('/api/recognitions', recognitionRoutes);
app.use('/api/endorsements', endorsementRoutes);
app.use('/api/redemptions', redemptionRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error'
    });
});

// Initialize database and start server
const startServer = async () => {
    try {
        console.log('🚀 Starting Boostly server...');
        
        // Initialize database
        await initDb();
        
        // Start listening
        app.listen(PORT, () => {
            console.log(`✓ Server running on port ${PORT}`);
            console.log(`✓ Health check: http://localhost:${PORT}/health`);
            console.log(`✓ API base URL: http://localhost:${PORT}/api`);
            console.log('================================');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;