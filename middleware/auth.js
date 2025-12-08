// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

exports.protect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies?.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'Veuillez vous connecter pour acceder a cette ressource'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        const currentUser = await User.findById(decoded.id).select('+isActive +passwordChangedAt');

        if (!currentUser || !currentUser.isActive) {
            return res.status(401).json({
                status: 'error',
                message: "L'utilisateur associe a ce token n'existe plus ou est desactive"
            });
        }

        if (currentUser.changedPasswordAfter && currentUser.changedPasswordAfter(decoded.iat)) {
            return res.status(401).json({
                status: 'error',
                message: 'Le mot de passe a ete modifie, veuillez vous reconnecter'
            });
        }

        req.user = currentUser;
        req.token = token;
        next();

    } catch (error) {
        return res.status(401).json({
            status: 'error',
            message: 'Token invalide ou expire'
        });
    }
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'error',
                message: "Vous n'avez pas la permission d'acceder a cette ressource"
            });
        }
        next();
    };
};

exports.limitRequests = (limit = 100) => {
    const requests = new Map();

    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        const windowStart = now - 60 * 60 * 1000; // 1 hour window

        // Clean up old entries
        for (const [key, value] of requests.entries()) {
            if (value.timestamp < windowStart) {
                requests.delete(key);
            }
        }

        // Get or create request tracking for this IP
        let userRequests = requests.get(ip);
        
        if (!userRequests || userRequests.timestamp < windowStart) {
            // Reset if window has passed
            userRequests = { count: 0, timestamp: now };
        }

        if (userRequests.count >= limit) {
            return res.status(429).json({
                status: 'error',
                success: false,
                message: 'Trop de requetes, veuillez reessayer plus tard'
            });
        }

        userRequests.count++;
        userRequests.timestamp = now;
        requests.set(ip, userRequests);
        next();
    };
};
