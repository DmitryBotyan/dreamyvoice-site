import type { RequestHandler } from 'express';

export const requireAdmin: RequestHandler = (req, res, next) => {
  if (req.currentUser?.role === 'ADMIN') {
    return next();
  }

  return res.status(403).json({ message: 'Admin access required' });
};
