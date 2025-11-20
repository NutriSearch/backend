const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connexion MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nutrisearch', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Routes - CORRIGÉ
app.use('/api/semantic', require('./routes/semantic'));

// Endpoint de santé
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Serveur d\'ontologie nutritionnelle opérationnel',
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Serveur d'ontologie Protégé démarré sur le port ${PORT}`);
});