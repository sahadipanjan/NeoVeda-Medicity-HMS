/**
 * Hospital Management System — Server Entry Point
 * 
 * Express application configured with:
 * - Security headers (Helmet)
 * - CORS for frontend origin
 * - Request logging (Morgan)
 * - Cookie parsing for HttpOnly JWT
 * - Rate limiting (global + auth-specific)
 * - Structured route mounting
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const { apiLimiter } = require('./middleware/rateLimiter');

// Route modules
const authRoutes = require('./routes/auth.routes');
const patientRoutes = require('./routes/patients.routes');
const doctorRoutes = require('./routes/doctors.routes');
const appointmentRoutes = require('./routes/appointments.routes');
const wardRoutes = require('./routes/wards.routes');
const billingRoutes = require('./routes/billing.routes');
const adminRoutes = require('./routes/admin.routes');
const tpaRoutes = require('./routes/tpa.routes');
const doctorDashRoutes = require('./routes/doctor.routes');

const app = express();
const PORT = process.env.PORT || 4000;

// ---- Global Middleware ----
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('combined'));
app.use(apiLimiter);

// ---- Health Check ----
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Hospital Management System API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});

// ---- API Routes ----
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/wards', wardRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tpa', tpaRoutes);
app.use('/api/doctor', doctorDashRoutes);

// ---- 404 Handler ----
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found.`,
    });
});

// ---- Global Error Handler ----
app.use((err, req, res, next) => {
    console.error('[ERROR]', err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred.'
            : err.message,
    });
});

// ---- Start Server ----
app.listen(PORT, () => {
    console.log(`
  ╔══════════════════════════════════════════════════╗
  ║  Hospital Management System API Server           ║
  ║  Running on port ${PORT}                            ║
  ║  Environment: ${process.env.NODE_ENV || 'development'}                  ║
  ╚══════════════════════════════════════════════════╝
  `);
});

module.exports = app;
