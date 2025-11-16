"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = void 0;
const requireAdmin = (req, res, next) => {
    if (req.currentUser?.role === 'ADMIN') {
        return next();
    }
    return res.status(403).json({ message: 'Admin access required' });
};
exports.requireAdmin = requireAdmin;
