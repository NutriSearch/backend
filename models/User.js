// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const passwordValidator = {
    validator: (value) =>
        /[A-Z]/.test(value) &&
        /[a-z]/.test(value) &&
        /\d/.test(value) &&
        value.length >= 8,
    message: 'Le mot de passe doit contenir au moins 8 caracteres, une majuscule, une minuscule et un chiffre'
};

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        trim: true,
        minlength: [3, 'Le nom doit contenir au moins 3 caracteres'],
        maxlength: [100, 'Le nom ne peut depasser 100 caracteres'],
        required: [true, 'Le nom complet est requis']
    },
    username: {
        type: String,
        unique: true,
        trim: true,
        minlength: [3, 'Le nom d"utilisateur doit avoir au moins 3 caracteres']
    },
    email: {
        type: String,
        required: [true, 'L"email est requis'],
        unique: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Veuillez fournir un email valide']
    },
    password: {
        type: String,
        required: [true, 'Le mot de passe est requis'],
        select: false,
        validate: passwordValidator
    },
    role: {
        type: String,
        enum: ['user', 'nutritionist', 'admin'],
        default: 'user'
    },
    avatar: {
        type: String,
        default: ''
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    profile: {
        age: Number,
        weight: Number,
        height: Number,
        gender: {
            type: String,
            enum: ['male', 'female', 'other']
        },
        activityLevel: {
            type: String,
            enum: ['sedentary', 'light', 'moderate', 'active', 'very_active']
        },
        goals: [{
            type: String,
            enum: ['weight_loss', 'maintenance', 'muscle_gain', 'wellness', 'energy', 'detox']
        }],
        dietaryRestrictions: [String],
        allergies: [String]
    },
    preferences: {
        theme: {
            type: String,
            enum: ['light', 'dark'],
            default: 'light'
        },
        language: {
            type: String,
            default: 'fr'
        },
        notifications: {
            type: Boolean,
            default: true
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    lastLogin: Date,
    loginHistory: [{
        date: Date,
        ip: String,
        device: String
    }]
}, {
    timestamps: true
});

// Generation automatique d'un username si absent
userSchema.pre('validate', function(next) {
    if (!this.username) {
        const base = (this.fullName || this.email || 'user')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'user';
        const suffix = Math.floor(Math.random() * 9000 + 1000);
        this.username = `${base}-${suffix}`;
    }

    if (!this.avatar) {
        const seed = encodeURIComponent(this.fullName || this.username);
        this.avatar = `https://ui-avatars.com/api/?name=${seed}&background=random`;
    }

    if (!this.fullName && this.username) {
        this.fullName = this.username;
    }

    next();
});

// Hash password avant sauvegarde
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12);
    this.passwordChangedAt = Date.now() - 1000;
    next();
});

// Methode pour verifier le password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Generer un token JWT
userSchema.methods.generateAuthToken = function() {
    return jwt.sign(
        {
            id: this._id,
            email: this.email,
            role: this.role
        },
        process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
        {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        }
    );
};

// Verifier si le mot de passe a ete modifie apres l'emission du token
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

// Generer un token de reinitialisation de mot de passe
userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

// Methode pour filtrer les donnees sensibles
userSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    delete user.loginHistory;
    delete user.passwordResetToken;
    delete user.passwordResetExpires;
    delete user.__v;
    return user;
};

module.exports = mongoose.model('User', userSchema);
