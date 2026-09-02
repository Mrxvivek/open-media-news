import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { requireRole, requireRootAdmin } from '../middleware/auth.js';
import {
  validateBody,
  createUserSchema,
  updateStatusSchema,
  batchStatusSchema,
  editArticleSchema
} from '../middleware/validation.js';
import { emitRealtime } from '../index.js';

export const adminRouter = Router();

// Helper to generate cryptographically secure password
const generateSecurePassword = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  let pass = '';
  const bytes = crypto.randomBytes(12);
  for (let i = 0; i < 12; i++) {
    pass += chars[bytes[i] % chars.length];
  }
  return pass;
};

// All admin routes require ADMIN role
adminRouter.use(requireRole(['ADMIN']));

adminRouter.get('/events', async (req: Request, res: Response) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        organizer: { select: { id: true, name: true, email: true, role: true } }
      }
    });

    return res.json({ events });
  } catch (err: any) {
    console.error('Admin events list error:', err);
    return res.status(500).json({ error: 'Failed to fetch event submissions' });
  }
});

// GET /api/admin/submissions (Admin: view all submissions)
adminRouter.get('/submissions', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    const where: any = {};
    if (status && typeof status === 'string' && ['DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED', 'CHANGES_REQUESTED', 'TAKEN_DOWN'].includes(status)) {
      where.status = status;
    }

    const submissions = await prisma.article.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, name: true, email: true, role: true }
        },
        _count: {
          select: { comments: true, savedBy: true }
        }
      }
    });

    const statusCounts = await prisma.article.groupBy({
      by: ['status'],
      _count: true
    });

    return res.json({
      submissions,
      counts: statusCounts.reduce((acc: any, curr) => {
        acc[curr.status] = curr._count;
        return acc;
      }, {})
    });
  } catch (err: any) {
    console.error('Admin submissions error:', err);
    return res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// GET /api/admin/users (Admin: list all platform users and roles)
adminRouter.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isRootAdmin: true,
        createdAt: true,
        _count: {
          select: {
            articles: true,
            comments: true
          }
        }
      }
    });

    const counts = {
      total: users.length,
      users: users.filter(u => u.role === 'USER').length,
      publishers: users.filter(u => u.role === 'PUBLISHER').length,
      admins: users.filter(u => u.role === 'ADMIN').length,
      rootAdminEmail: users.find(u => u.isRootAdmin)?.email || null
    };

    return res.json({ users, counts });
  } catch (err: any) {
    console.error('Admin get users error:', err);
    return res.status(500).json({ error: 'Failed to fetch platform users' });
  }
});

// POST /api/admin/users/create (STRICTLY ROOT ADMIN ONLY: Create Publisher or Secondary Admin)
adminRouter.post('/users/create', requireRootAdmin, validateBody(createUserSchema), async (req: Request, res: Response) => {
  try {
    const { name, email, role, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists' });
    }

    const plainPassword = password && password.trim() ? password.trim() : generateSecurePassword();
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    // Any user created via this route has isRootAdmin: false and rootAdminMarker: null
    // preserving the strict single primary root admin guarantee
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role,
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

    return res.status(201).json({
      message: `${role} account created successfully`,
      user: newUser,
      credentials: {
        name: newUser.name,
        email: newUser.email,
        password: plainPassword,
        role: newUser.role,
        isRootAdmin: newUser.isRootAdmin
      }
    });
  } catch (err: any) {
    console.error('Admin create user error:', err);
    return res.status(500).json({ error: 'Failed to create platform account' });
  }
});

// DELETE /api/admin/users/:id (STRICTLY ROOT ADMIN ONLY: Delete non-root platform user)
adminRouter.delete('/users/:id', requireRootAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isRootAdmin || user.rootAdminMarker) {
      return res.status(403).json({ error: 'Primary Root Admin account cannot be deleted' });
    }

    if (user.id === req.user!.id) {
      return res.status(400).json({ error: 'Cannot delete your own active administrator account' });
    }

    // Cascade delete user associations
    await prisma.$transaction([
      prisma.comment.deleteMany({ where: { userId: id } }),
      prisma.savedArticle.deleteMany({ where: { userId: id } }),
      prisma.authorFollow.deleteMany({ where: { OR: [{ followerId: id }, { authorId: id }] } }),
      prisma.event.deleteMany({ where: { organizerId: id } }),
      prisma.article.deleteMany({ where: { authorId: id } }),
      prisma.user.delete({ where: { id } })
    ]);

    return res.json({
      message: `User ${user.email} successfully removed from platform`,
      deletedUserId: id
    });
  } catch (err: any) {
    console.error('Admin delete user error:', err);
    return res.status(500).json({ error: 'Failed to delete user account' });
  }
});

// PATCH /api/admin/articles/:id/status (Admin: review/approve/reject/take down single article)
adminRouter.patch('/articles/:id/status', validateBody(updateStatusSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, editorialFeedback } = req.body;

    const existing = await prisma.article.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const data: any = { status, editorialFeedback: editorialFeedback || null };
    if (status === 'PUBLISHED' && !existing.publishedAt) {
      data.publishedAt = new Date();
    }
    if (['DRAFT', 'TAKEN_DOWN'].includes(status)) {
      data.publishedAt = null;
    }

    const updated = await prisma.article.update({
      where: { id },
      data,
      include: {
        author: { select: { id: true, name: true, email: true } }
      }
    });

    // Real-time broadcast
    emitRealtime('article:status_changed', {
      id: updated.id,
      status: updated.status,
      title: updated.title,
      article: updated
    });

    return res.json({
      message: `Article status updated to ${status}`,
      article: updated
    });
  } catch (err: any) {
    console.error('Admin update article status error:', err);
    return res.status(500).json({ error: 'Failed to update article status' });
  }
});

adminRouter.patch('/events/:id/status', validateBody(updateStatusSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, editorialFeedback } = req.body;

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const updated = await prisma.event.update({
      where: { id },
      data: {
        status,
        ...(editorialFeedback ? { description: `${existing.description}\n\nEditorial feedback: ${editorialFeedback}` } : {})
      },
      include: {
        organizer: { select: { id: true, name: true, email: true } }
      }
    });

    emitRealtime('event:status_changed', {
      id: updated.id,
      status: updated.status,
      title: updated.title,
      event: updated
    });

    return res.json({
      message: `Event status updated to ${status}`,
      event: updated
    });
  } catch (err: any) {
    console.error('Admin update event status error:', err);
    return res.status(500).json({ error: 'Failed to update event status' });
  }
});

// PATCH /api/admin/articles/:id (Admin: full editorial editing of article content)
adminRouter.patch('/articles/:id', validateBody(editArticleSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.article.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const updateData: any = {};
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.summary !== undefined) updateData.summary = req.body.summary;
    if (req.body.body !== undefined) updateData.body = req.body.body;
    if (req.body.category !== undefined) updateData.category = req.body.category;
    if (req.body.domain !== undefined) updateData.domain = req.body.domain;
    if (req.body.image !== undefined) updateData.image = req.body.image;
    if (req.body.status !== undefined) {
      updateData.status = req.body.status;
      if (req.body.status === 'PUBLISHED' && !existing.publishedAt) {
        updateData.publishedAt = new Date();
      } else if (['DRAFT', 'TAKEN_DOWN'].includes(req.body.status)) {
        updateData.publishedAt = null;
      }
    }
    if (req.body.editorialFeedback !== undefined) updateData.editorialFeedback = req.body.editorialFeedback || null;

    const updated = await prisma.article.update({
      where: { id },
      data: updateData,
      include: {
        author: { select: { id: true, name: true, email: true } }
      }
    });

    // Real-time broadcast of content update
    emitRealtime('article:updated', {
      id: updated.id,
      article: updated
    });

    if (updateData.status) {
      emitRealtime('article:status_changed', {
        id: updated.id,
        status: updated.status,
        title: updated.title,
        article: updated
      });
    }

    return res.json({
      message: 'Article updated successfully by administrator',
      article: updated
    });
  } catch (err: any) {
    console.error('Admin edit article error:', err);
    return res.status(500).json({ error: 'Failed to edit article' });
  }
});

// POST /api/admin/articles/batch-status (Admin: batch approval / takedown / rejection)
adminRouter.post('/articles/batch-status', validateBody(batchStatusSchema), async (req: Request, res: Response) => {
  try {
    const { articleIds, status, editorialFeedback } = req.body;

    const data: any = { status, editorialFeedback: editorialFeedback || null };
    if (status === 'PUBLISHED') {
      data.publishedAt = new Date();
    } else if (['DRAFT', 'TAKEN_DOWN'].includes(status)) {
      data.publishedAt = null;
    }

    const result = await prisma.article.updateMany({
      where: {
        id: { in: articleIds }
      },
      data
    });

    // Real-time broadcast for batch status change
    emitRealtime('articles:batch_status_changed', {
      articleIds,
      status,
      count: result.count
    });

    return res.json({
      message: `Batch updated ${result.count} articles to ${status}`,
      count: result.count,
      status,
      articleIds
    });
  } catch (err: any) {
    console.error('Admin batch status error:', err);
    return res.status(500).json({ error: 'Failed to perform batch update' });
  }
});
