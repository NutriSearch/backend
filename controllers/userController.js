// controllers/userController.js
const User = require('../models/User');

// Recuperer tous les utilisateurs (admin)
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-loginHistory -passwordResetToken -passwordResetExpires');
        res.status(200).json({ status: 'success', results: users.length, data: { users } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Recuperer un utilisateur par ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Utilisateur non trouve' });
        }
        res.status(200).json({ status: 'success', data: { user } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Mettre a jour un utilisateur (admin)
exports.updateUser = async (req, res) => {
    try {
        const forbidden = ['password', 'passwordResetToken', 'passwordResetExpires', 'loginHistory'];
        const updates = { ...req.body };
        forbidden.forEach((field) => delete updates[field]);

        const user = await User.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true
        });

        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Utilisateur non trouve' });
        }

        res.status(200).json({ status: 'success', data: { user } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Desactiver ou supprimer un utilisateur
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Utilisateur non trouve' });
        }

        res.status(204).json({ status: 'success', data: null });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
