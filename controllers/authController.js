// controllers/authController.js
const crypto = require('crypto');
const User = require('../models/User');

const sanitizeUser = (userDoc) => {
    const safe = userDoc.toJSON ? userDoc.toJSON() : userDoc;
    delete safe.password;
    delete safe.passwordResetToken;
    delete safe.passwordResetExpires;
    delete safe.loginHistory;
    return safe;
};

const sendToken = (user, statusCode, res, rememberMe = false, message) => {
    const token = user.generateAuthToken();

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000)
    };

    res.cookie('token', token, cookieOptions);

    const safeUser = sanitizeUser(user);

    res.status(statusCode).json({
        status: 'success',
        success: true,
        message: message || undefined,
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        user: safeUser,
        data: { user: safeUser }
    });
};

exports.register = async (req, res) => {
    try {
        const { fullName, email, password, rememberMe = false } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({
                status: 'error',
                success: false,
                message: 'Nom complet, email et mot de passe sont requis'
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                status: 'error',
                success: false,
                message: 'Un compte existe deja avec cet email'
            });
        }

        const newUser = await User.create({
            fullName,
            email,
            password,
            profile: req.body.profile || {},
            preferences: req.body.preferences || {}
        });

        sendToken(newUser, 201, res, rememberMe, 'Compte créé avec succès');
    } catch (error) {
        res.status(400).json({
            status: 'error',
            success: false,
            message: error.message
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password, rememberMe = false } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                status: 'error',
                success: false,
                message: 'Veuillez fournir un email et un mot de passe'
            });
        }

        const user = await User.findOne({ email }).select('+password +isActive');

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({
                status: 'error',
                success: false,
                message: 'Email ou mot de passe incorrect'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                status: 'error',
                success: false,
                message: 'Votre compte est desactive'
            });
        }

        user.lastLogin = Date.now();
        user.loginHistory = user.loginHistory || [];
        user.loginHistory.push({
            date: new Date(),
            ip: req.ip,
            device: req.headers['user-agent']
        });
        await user.save({ validateBeforeSave: false });

        sendToken(user, 200, res, rememberMe, 'Connexion réussie');
    } catch (error) {
        res.status(400).json({
            status: 'error',
            success: false,
            message: error.message
        });
    }
};

exports.logout = (req, res) => {
    res.cookie('token', 'logout', {
        httpOnly: true,
        expires: new Date(Date.now() + 5 * 1000),
        sameSite: 'lax'
    });

    res.status(200).json({
        status: 'success',
        success: true,
        message: 'Deconnecte avec succes'
    });
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({
            status: 'success',
            success: true,
            data: { user: sanitizeUser(user) }
        });
    } catch (error) {
        res.status(400).json({ status: 'error', success: false, message: error.message });
    }
};

exports.updateMe = async (req, res) => {
    try {
        const restrictedFields = ['password', 'role', 'emailVerified', 'passwordChangedAt'];
        const updates = { ...req.body };
        restrictedFields.forEach((field) => delete updates[field]);

        const allowedFields = ['fullName', 'username', 'preferences', 'profile', 'avatar'];
        const filteredUpdates = {};
        allowedFields.forEach((field) => {
            if (updates[field] !== undefined) filteredUpdates[field] = updates[field];
        });

        const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredUpdates, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            status: 'success',
            data: { user: sanitizeUser(updatedUser) }
        });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

exports.updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, rememberMe = false } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                status: 'error',
                success: false,
                message: 'Les mots de passe actuel et nouveau sont requis'
            });
        }

        const user = await User.findById(req.user.id).select('+password');

        if (!(await user.comparePassword(currentPassword))) {
            return res.status(401).json({
                status: 'error',
                success: false,
                message: 'Votre mot de passe actuel est incorrect'
            });
        }

        user.password = newPassword;
        await user.save();

        sendToken(user, 200, res, rememberMe, 'Mot de passe mis à jour');
    } catch (error) {
        res.status(400).json({ status: 'error', success: false, message: error.message });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                status: 'error',
                success: false,
                message: 'Aucun utilisateur trouve avec cet email'
            });
        }

        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });

        res.status(200).json({
            status: 'success',
            success: true,
            message: 'Token de reinitialisation genere',
            resetToken // expose uniquement en dev; en prod il faut envoyer par email
        });
    } catch (error) {
        res.status(400).json({ status: 'error', success: false, message: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        }).select('+password');

        if (!user) {
            return res.status(400).json({
                status: 'error',
                success: false,
                message: 'Token invalide ou expire'
            });
        }

        user.password = req.body.password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        sendToken(user, 200, res, false, 'Mot de passe reinitialise');
    } catch (error) {
        res.status(400).json({ status: 'error', success: false, message: error.message });
    }
};
