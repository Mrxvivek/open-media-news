import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { generateToken, requireAuth } from '../middleware/auth.js';
import { validateBody, registerSchema, loginSchema } from '../middleware/validation.js';

export const authRouter = Router();

// POST /api/auth/register (Public registration: STRICTLY USER role only)
authRouter.post('/register', validateBody(registerSchema), async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Enforce default registration strictly to 'USER' and isRootAdmin: false
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: 'USER',
        isRootAdmin: false,
        rootAdminMarker: null
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isRootAdmin: true,
        createdAt: true
      }
    });

    const token = generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as any,
      isRootAdmin: user.isRootAdmin
    });

    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user
    });
  } catch (err: any) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// POST /api/auth/login
authRouter.post('/login', validateBody(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as any,
      isRootAdmin: user.isRootAdmin,
      createdAt: user.createdAt
    };

    const token = generateToken({
      id: safeUser.id,
      name: safeUser.name,
      email: safeUser.email,
      role: safeUser.role,
      isRootAdmin: safeUser.isRootAdmin
    });

    return res.json({
      message: 'Login successful',
      token,
      user: safeUser
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isRootAdmin: true,
        createdAt: true,
        _count: {
          select: {
            savedArticles: true,
            following: true,
            articles: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user });
  } catch (err: any) {
    console.error('Get profile error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
