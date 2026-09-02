import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'open-media-super-secret-jwt-key-2026';

export interface AuthPayload {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'PUBLISHER' | 'ADMIN';
  isRootAdmin?: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

/**
 * Middleware that extracts Bearer token and attaches decoded user to req.user if valid.
 * Does not block unauthenticated requests so public routes can optionally use user context.
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Middleware requiring a valid authenticated user.
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

/**
 * Middleware requiring specific role(s) (e.g. ['ADMIN'] or ['PUBLISHER', 'ADMIN']).
 */
export const requireRole = (roles: Array<'USER' | 'PUBLISHER' | 'ADMIN'>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Required role ${roles.join(' or ')}, but user has ${req.user.role}`
      });
    }
    next();
  };
};

/**
 * Middleware requiring the active session to be the Root Admin.
 */
export const requireRootAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.user.role !== 'ADMIN' || !req.user.isRootAdmin) {
    return res.status(403).json({
      error: 'Forbidden: This action requires Root Admin authorization'
    });
  }
  next();
};

export const generateToken = (user: AuthPayload): string => {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
};
