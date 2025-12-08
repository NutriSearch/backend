// server.js - Backend API NutriSearch
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const auth = require('./middleware/auth');

require('dotenv').config();

const app = express();

// ===== MIDDLEWARE =====
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request limiting
app.use(auth.limitRequests(100));

// ===== MONGODB CONNECTION =====
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nutrisearch', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log(' MongoDB connecte'))
    .catch(err => console.error(' Erreur MongoDB:', err));

// ===== ROUTES =====
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/semantic', require('./routes/semantic'));

// API info endpoint
app.get('/api', (req, res) => {
    res.json({
        name: 'NutriSearch Backend API',
        version: '1.1.0',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users (admin)',
            semantic: '/api/semantic'
        }
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Serveur NutriSearch operationnel',
        timestamp: new Date().toISOString(),
        version: '1.1.0'
    });
});

// ===== ERROR HANDLING =====
// 404 handler (must use RegExp for wildcard in Express 5.x)
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: `Route ${req.originalUrl} non trouvee`
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(' Erreur:', err.stack);

    res.status(err.statusCode || 500).json({
        status: 'error',
        message: err.message || 'Erreur interne du serveur',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(` Serveur demarr� sur le port ${PORT}`);
    console.log(` Frontend expected at: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
});

module.exports = app;
