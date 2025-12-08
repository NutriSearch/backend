const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Routes publiques
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);
router.post('/logout', authController.logout);
router.get('/logout', authController.logout);

// Routes protegees
router.use(auth.protect);

router.get('/me', authController.getMe);
router.patch('/update-me', authController.updateMe);
router.patch('/update-password', authController.updatePassword);

// Routes admin seulement (a etendre si besoin)
router.use(auth.restrictTo('admin'));
// Exemple: router.get('/users', adminController.listUsers);

module.exports = router;
