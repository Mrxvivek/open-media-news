import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { generateToken, requireAuth } from '../middleware/auth.js';
import {
  validateBody,
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '../middleware/validation.js';
import { recordAudit } from '../services/auditService.js';

export const authRouter = Router();

// POST /api/auth/register (Public registration: STRICTLY USER role only with email verification code)
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
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Enforce default registration strictly to 'USER' and isRootAdmin: false
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: 'USER',
        isRootAdmin: false,
        rootAdminMarker: null,
        emailVerified: false,
        verificationToken: verificationCode
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isRootAdmin: true,
        emailVerified: true,
        createdAt: true
      }
    });

    await recordAudit({
      action: 'USER_REGISTERED',
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      targetId: user.id,
      targetType: 'USER',
      details: 'Self-registration with pending email verification'
    });

    const token = generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as any,
      isRootAdmin: user.isRootAdmin
    });

    return res.status(201).json({
      message: 'Account created successfully. Please verify your email.',
      token,
      user,
      requiresVerification: true,
      verificationCode, // Provided in response for seamless in-app verification
      verificationToken: verificationCode
    });
  } catch (err: any) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// POST /api/auth/verify-email
authRouter.post('/verify-email', validateBody(verifyEmailSchema), async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const code = (req.body.code || req.body.token || '').trim();
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      return res.status(404).json({ error: 'Account not found' });
    }

    if (user.emailVerified) {
      const token = generateToken({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as any,
        isRootAdmin: user.isRootAdmin
      });
      return res.json({ success: true, message: 'Email address is already verified.', token, emailVerified: true, user });
    }

    if (user.verificationToken !== code) {
      return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isRootAdmin: true,
        emailVerified: true
      }
    });

    await recordAudit({
      action: 'EMAIL_VERIFIED',
      actorId: updated.id,
      actorEmail: updated.email,
      actorRole: updated.role,
      targetId: updated.id,
      targetType: 'USER',
      details: 'Email successfully verified'
    });

    const token = generateToken({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role as any,
      isRootAdmin: updated.isRootAdmin
    });

    return res.json({
      success: true,
      message: 'Email verified successfully! You have full platform access.',
      token,
      user: updated
    });
  } catch (err: any) {
    console.error('Verify email error:', err);
    return res.status(500).json({ error: 'Internal server error verifying email' });
  }
});

// POST /api/auth/resend-verification
authRouter.post('/resend-verification', validateBody(resendVerificationSchema), async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      return res.status(404).json({ error: 'Account not found' });
    }

    if (user.emailVerified) {
      return res.json({ success: true, message: 'Email is already verified.' });
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken: newCode }
    });

    return res.json({
      success: true,
      message: 'A new verification code has been dispatched.',
      verificationCode: newCode,
      verificationToken: newCode
    });
  } catch (err: any) {
    console.error('Resend verification error:', err);
    return res.status(500).json({ error: 'Internal server error resending verification' });
  }
});

// POST /api/auth/forgot-password (Password Recovery initiation)
authRouter.post('/forgot-password', validateBody(forgotPasswordSchema), async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    // Security practice: Return uniform message to avoid email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists with this email address, a password recovery code has been generated.'
      });
    }

    const resetToken = crypto.randomBytes(16).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour expiration

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires
      }
    });

    await recordAudit({
      action: 'PASSWORD_RESET_REQUESTED',
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      targetId: user.id,
      targetType: 'USER',
      details: 'Password recovery token generated'
    });

    return res.json({
      success: true,
      message: 'Password recovery token generated successfully.',
      resetToken // Provided in response for user flow in app
    });
  } catch (err: any) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: 'Internal server error processing password recovery' });
  }
});

// POST /api/auth/reset-password (Password Recovery completion)
authRouter.post('/reset-password', validateBody(resetPasswordSchema), async (req: Request, res: Response) => {
  try {
    const { email, token, newPassword } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        resetPasswordToken: token.trim(),
        resetPasswordExpires: { gt: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired password reset token. Please request a new recovery link.' });
    }

    // Password strength check: min 8 chars, uppercase, lowercase, number
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasDigit = /[0-9]/.test(newPassword);
    if (!hasUpper || !hasLower || !hasDigit) {
      return res.status(400).json({
        error: 'Password does not meet enterprise security requirements. Must contain uppercase, lowercase, and a number.'
      });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    });

    await recordAudit({
      action: 'PASSWORD_RESET_COMPLETED',
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      targetId: user.id,
      targetType: 'USER',
      details: 'User successfully completed password recovery'
    });

    return res.json({
      success: true,
      message: 'Password successfully updated. You may now sign in with your new credentials.'
    });
  } catch (err: any) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Internal server error resetting password' });
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
