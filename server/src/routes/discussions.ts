import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, createDiscussionSchema, createDiscussionCommentSchema } from '../middleware/validation.js';
import { emitRealtime } from '../realtime.js';

export const discussionsRouter = Router();

// GET /api/discussions (Public: list discussions)
discussionsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { category, search, sort = 'latest', limit = '30', offset = '0' } = req.query;

    const where: any = {};
    if (category && typeof category === 'string' && category !== 'all') {
      where.category = category.trim();
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q } },
        { content: { contains: q } }
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'popular') {
      orderBy = [
        { comments: { _count: 'desc' } },
        { views: 'desc' },
        { createdAt: 'desc' }
      ];
    }

    const take = Math.min(parseInt(limit as string, 10) || 30, 100);
    const skip = parseInt(offset as string, 10) || 0;

    const [discussions, total] = await Promise.all([
      prisma.discussion.findMany({
        where,
        take,
        skip,
        orderBy,
        include: {
          author: { select: { id: true, name: true, role: true, avatarUrl: true } },
          _count: { select: { comments: true } }
        }
      }),
      prisma.discussion.count({ where })
    ]);

    return res.json({ discussions, total });
  } catch (err: any) {
    console.error('Get discussions error:', err);
    return res.status(500).json({ error: 'Failed to fetch discussions' });
  }
});

// GET /api/discussions/:id (Public: get single discussion and comments)
discussionsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const discussion = await prisma.discussion.update({
      where: { id },
      data: { views: { increment: 1 } },
      include: {
        author: { select: { id: true, name: true, role: true, avatarUrl: true } },
        comments: {
          where: { parentId: null },
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { id: true, name: true, role: true, avatarUrl: true } },
            replies: {
              include: {
                author: { select: { id: true, name: true, role: true, avatarUrl: true } }
              },
              orderBy: { createdAt: 'asc' }
            }
          }
        },
        _count: { select: { comments: true } }
      }
    });

    if (!discussion) {
      return res.status(404).json({ error: 'Discussion not found' });
    }

    return res.json({ discussion });
  } catch (err: any) {
    console.error('Get single discussion error:', err);
    return res.status(500).json({ error: 'Failed to fetch discussion' });
  }
});

// POST /api/discussions (User: create discussion)
discussionsRouter.post('/', requireAuth, validateBody(createDiscussionSchema), async (req: Request, res: Response) => {
  try {
    const { title, content, category } = req.body;
    const authorId = req.user!.id;

    const discussion = await prisma.discussion.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        category: category.trim(),
        authorId
      },
      include: {
        author: { select: { id: true, name: true, role: true, avatarUrl: true } },
        _count: { select: { comments: true } }
      }
    });

    emitRealtime('discussion:created', discussion);

    return res.status(201).json({
      message: 'Discussion created successfully',
      discussion
    });
  } catch (err: any) {
    console.error('Create discussion error:', err);
    return res.status(500).json({ error: 'Failed to create discussion' });
  }
});

// POST /api/discussions/:id/comments (User: post comment or reply)
discussionsRouter.post('/:id/comments', requireAuth, validateBody(createDiscussionCommentSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content, parentId } = req.body;
    const authorId = req.user!.id;

    const discussion = await prisma.discussion.findUnique({ where: { id } });
    if (!discussion) {
      return res.status(404).json({ error: 'Discussion not found' });
    }

    if (parentId) {
      const parentComment = await prisma.discussionComment.findUnique({ where: { id: parentId } });
      if (!parentComment || parentComment.discussionId !== id) {
        return res.status(400).json({ error: 'Invalid parent comment for this discussion' });
      }
    }

    const comment = await prisma.discussionComment.create({
      data: {
        content: content.trim(),
        discussionId: id,
        authorId,
        parentId: parentId || null
      },
      include: {
        author: { select: { id: true, name: true, role: true, avatarUrl: true } }
      }
    });

    // Notify author if comment is from another user
    const recipientId = parentId ? (await prisma.discussionComment.findUnique({ where: { id: parentId } }))?.authorId : discussion.authorId;
    if (recipientId && recipientId !== authorId) {
      await prisma.notification.create({
        data: {
          userId: recipientId,
          type: 'DISCUSSION_REPLY',
          title: 'New reply on discussion',
          message: `${req.user!.name} responded to "${discussion.title.substring(0, 40)}..."`,
          link: `#discussion-${id}`
        }
      }).catch(() => {});
    }

    emitRealtime('discussion:comment_created', { discussionId: id, comment });

    return res.status(201).json({
      message: parentId ? 'Reply posted successfully' : 'Comment posted successfully',
      comment
    });
  } catch (err: any) {
    console.error('Add discussion comment error:', err);
    return res.status(500).json({ error: 'Failed to post comment' });
  }
});

// POST /api/discussions/:id/report (User: report discussion)
discussionsRouter.post('/:id/report', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason = 'Inappropriate content' } = req.body || {};

    const discussion = await prisma.discussion.findUnique({ where: { id } });
    if (!discussion) return res.status(404).json({ error: 'Discussion not found' });

    const report = await prisma.discussionReport.create({
      data: {
        discussionId: id,
        reporterId: req.user!.id,
        reason: typeof reason === 'string' && reason.trim() ? reason.trim() : 'Flagged for moderation'
      }
    });

    return res.status(201).json({ message: 'Discussion reported for review', reportId: report.id });
  } catch (err: any) {
    console.error('Report discussion error:', err);
    return res.status(500).json({ error: 'Failed to report discussion' });
  }
});

// DELETE /api/discussions/:id (User: delete own discussion or Admin)
discussionsRouter.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const discussion = await prisma.discussion.findUnique({ where: { id } });
    if (!discussion) return res.status(404).json({ error: 'Discussion not found' });

    if (discussion.authorId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You are not authorized to delete this discussion' });
    }

    await prisma.discussion.delete({ where: { id } });

    emitRealtime('discussion:deleted', { discussionId: id });

    return res.json({ message: 'Discussion deleted successfully', id });
  } catch (err: any) {
    console.error('Delete discussion error:', err);
    return res.status(500).json({ error: 'Failed to delete discussion' });
  }
});
