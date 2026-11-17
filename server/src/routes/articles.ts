import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateBody, createArticleSchema, createCommentSchema, resubmitArticleSchema } from '../middleware/validation.js';
import { emitRealtime } from '../realtime.js';
import { resolveCategory } from '../services/newsClassifier.js';
import { getDiverseImageUrl, generateStraightBrief } from '../services/rssService.js';
import { recordAudit } from '../services/auditService.js';

export const articlesRouter = Router();

// Helper to make unique URL slug
const slugify = (text: string): string => {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return `${base.slice(0, 60)}-${randomSuffix}`;
};

// GET /api/articles (Public feed: only status: PUBLISHED)
articlesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { category, domain, search, limit = '50', offset = '0', sort = 'latest' } = req.query;

    const where: any = {
      status: 'PUBLISHED'
    };

    const APPROVED_CATEGORIES = ['Business', 'IT', 'Cyber Security', 'AI'];
    const resolvedCategory = category && typeof category === 'string' && category !== 'all'
      ? resolveCategory(category)
      : null;

    if (resolvedCategory) {
      where.category = resolvedCategory;
    } else {
      where.category = { in: APPROVED_CATEGORIES };
    }

    if (domain && typeof domain === 'string' && domain.trim() && domain.trim() !== 'all') {
      where.domain = domain.trim();
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q } },
        { summary: { contains: q } },
        { body: { contains: q } }
      ];
    }

    const sortType = typeof sort === 'string' ? sort.toLowerCase() : 'latest';
    let orderBy: any = { publishedAt: 'desc' };
    if (sortType === 'popular') {
      orderBy = [
        { comments: { _count: 'desc' } },
        { savedBy: { _count: 'desc' } },
        { publishedAt: 'desc' }
      ];
    } else if (sortType === 'oldest') {
      orderBy = { publishedAt: 'asc' };
    }

    const take = Math.min(parseInt(limit as string, 10) || 50, 500);
    const skip = parseInt(offset as string, 10) || 0;

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        take,
        skip,
        orderBy,
        include: {
          author: {
            select: { id: true, name: true, email: true, role: true }
          },
          _count: {
            select: { comments: true, savedBy: true }
          }
        }
      }),
      prisma.article.count({ where })
    ]);

    return res.json({ articles, total });
  } catch (err: any) {
    console.error('Get articles error:', err);
    return res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// POST /api/articles/summarize (Public: AI Summarizer)
articlesRouter.post('/summarize', async (req: Request, res: Response) => {
  try {
    const { category, question } = req.body || {};
    const where: any = { status: 'PUBLISHED' };
    const APPROVED_CATEGORIES = ['Business', 'IT', 'Cyber Security', 'AI'];
    if (category && category !== 'all' && APPROVED_CATEGORIES.includes(category)) {
      where.category = category;
    } else {
      where.category = { in: APPROVED_CATEGORIES };
    }

    const articles = await prisma.article.findMany({
      where,
      take: 6,
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        summary: true,
        category: true,
        domain: true,
        publishedAt: true
      }
    });

    if (!articles.length) {
      return res.json({
        success: true,
        summary: 'No published articles found in the newsroom to summarize at this time.',
        takeaways: []
      });
    }

    const categoryCounts: Record<string, number> = {};
    articles.forEach(a => {
      categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1;
    });
    const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Technology';

    const highlights = articles.slice(0, 3).map(a => `• "${a.title}" (${a.category}): ${a.summary}`).join('\n\n');
    const fullSummary = `AI Executive Briefing:\n\nRecent coverage is led by major developments in ${topCategory}, focusing on enterprise modernization and rapid market shifts. Key developments include:\n\n${highlights}\n\nOur newsroom continues to monitor incoming updates across global technology, business strategy, and cybersecurity vectors.`;

    return res.json({
      success: true,
      summary: fullSummary,
      articlesCount: articles.length,
      topCategory,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('AI Summarize error:', err);
    return res.status(500).json({ error: 'Failed to generate AI summary' });
  }
});

// GET /api/articles/:id (Public single article reader)
articlesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, email: true } },
        comments: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' }
        },
        _count: { select: { savedBy: true, comments: true } }
      }
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    return res.json({ article });
  } catch (err: any) {
    console.error('Get article error:', err);
    return res.status(500).json({ error: 'Failed to fetch article' });
  }
});

// POST /api/articles (Publisher or Admin: create/submit post)
articlesRouter.post('/', requireRole(['PUBLISHER', 'ADMIN']), validateBody(createArticleSchema), async (req: Request, res: Response) => {
  try {
    const {
      title,
      summary,
      body,
      category,
      domain,
      image,
      imageUrl,
      status = 'PENDING',
      contentType = 'NEWS',
      sourceName,
      sourceUrl,
      straightBrief
    } = req.body;

    const userRole = req.user!.role;
    // Both PUBLISHER and ADMIN can publish directly to live wire and breaking ticker
    let finalStatus: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED' = 'PUBLISHED';
    if (status === 'DRAFT') {
      finalStatus = 'DRAFT';
    } else if (status === 'PENDING') {
      finalStatus = 'PENDING';
    } else {
      finalStatus = 'PUBLISHED';
    }

    const slug = slugify(title);
    const finalImage = image?.trim() || imageUrl?.trim() || getDiverseImageUrl(category.trim(), title.trim());
    const finalBrief = straightBrief?.trim() || generateStraightBrief(title.trim(), summary.trim(), body.trim());
    const finalSourceName = sourceName?.trim() || (userRole === 'ADMIN' ? 'OPEN MEDIA Editorial' : req.user!.name);
    const finalSourceUrl = sourceUrl?.trim() || null;
    const finalContentType = ['NEWS', 'ANALYSIS', 'COMMUNITY', 'SPONSORED'].includes(contentType) ? contentType : 'NEWS';

    const article = await prisma.article.create({
      data: {
        title: title.trim(),
        slug,
        summary: summary.trim(),
        straightBrief: finalBrief,
        body: body.trim(),
        category: category.trim(),
        domain: domain?.trim() || null,
        contentType: finalContentType,
        sourceName: finalSourceName,
        sourceUrl: finalSourceUrl,
        image: finalImage,
        status: finalStatus,
        authorId: req.user!.id,
        publishedAt: finalStatus === 'PUBLISHED' ? new Date() : null
      },
      include: {
        author: { select: { id: true, name: true, email: true, role: true } }
      }
    });

    // Real-time broadcast
    emitRealtime('article:submitted', article);

    if (finalStatus === 'PUBLISHED') {
      emitRealtime('article:status_changed', {
        id: article.id,
        status: article.status,
        title: article.title,
        article
      });
      // Broadcast breaking ticker update
      emitRealtime('ticker:new', {
        id: article.id,
        title: article.title,
        category: article.category,
        domain: article.domain,
        slug: article.slug,
        time: article.publishedAt
      });
    }

    return res.status(201).json({
      message: finalStatus === 'PUBLISHED' ? 'Article published successfully' : 'Article submitted for editorial review',
      article
    });
  } catch (err: any) {
    console.error('Create article error:', err);
    return res.status(500).json({ error: 'Failed to create article' });
  }
});

articlesRouter.get('/mine/list', requireRole(['PUBLISHER', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const articles = await prisma.article.findMany({
      where: { authorId: req.user!.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        author: { select: { id: true, name: true, email: true, role: true } }
      }
    });

    return res.json({ articles });
  } catch (err: any) {
    console.error('Get publisher articles error:', err);
    return res.status(500).json({ error: 'Failed to fetch your submissions' });
  }
});

articlesRouter.patch('/:id/resubmit', requireRole(['PUBLISHER', 'ADMIN']), validateBody(resubmitArticleSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.article.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, email: true, role: true } }
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (req.user!.role !== 'ADMIN' && existing.authorId !== req.user!.id) {
      return res.status(403).json({ error: 'You can only resubmit your own articles' });
    }

    const updated = await prisma.article.update({
      where: { id },
      data: {
        title: req.body.title.trim(),
        summary: req.body.summary.trim(),
        body: req.body.body.trim(),
        category: req.body.category.trim(),
        domain: req.body.domain?.trim() || null,
        image: req.body.image?.trim() || req.body.imageUrl?.trim() || existing.image || getDiverseImageUrl(req.body.category.trim(), req.body.title.trim()),
        status: req.user!.role === 'ADMIN' ? 'PUBLISHED' : 'PENDING',
        editorialFeedback: null,
        publishedAt: req.user!.role === 'ADMIN' ? new Date() : existing.publishedAt
      },
      include: {
        author: { select: { id: true, name: true, email: true, role: true } }
      }
    });

    emitRealtime('article:submitted', updated);
    if (updated.status === 'PUBLISHED') {
      emitRealtime('article:status_changed', {
        id: updated.id,
        status: updated.status,
        title: updated.title,
        article: updated
      });
    }

    return res.json({
      message: updated.status === 'PUBLISHED' ? 'Article updated and published' : 'Article resubmitted for editorial review',
      article: updated
    });
  } catch (err: any) {
    console.error('Resubmit article error:', err);
    return res.status(500).json({ error: 'Failed to resubmit article' });
  }
});

// GET /api/articles/:id/reactions (Public: get reaction counts & user reaction if authenticated)
articlesRouter.get('/:id/reactions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const article = await prisma.article.findUnique({ where: { id } });
    if (!article) return res.status(404).json({ error: 'Article not found' });

    const reactions = await prisma.reaction.findMany({
      where: { articleId: id },
      select: { type: true, userId: true }
    });

    const counts: Record<string, number> = {
      LIKE: 0,
      INSIGHTFUL: 0,
      HELPFUL: 0,
      total: reactions.length
    };

    let userReaction: string | null = null;
    const currentUserId = req.user?.id;

    for (const r of reactions) {
      if (counts[r.type] !== undefined) {
        counts[r.type]++;
      }
      if (currentUserId && r.userId === currentUserId) {
        userReaction = r.type;
      }
    }

    return res.json({ counts, userReaction });
  } catch (err: any) {
    console.error('Get reactions error:', err);
    return res.status(500).json({ error: 'Failed to fetch reactions' });
  }
});

// POST /api/articles/:id/reactions (User: toggle or change reaction)
articlesRouter.post('/:id/reactions', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type } = req.body;
    const VALID_REACTIONS = ['LIKE', 'INSIGHTFUL', 'HELPFUL'];

    if (!type || !VALID_REACTIONS.includes(type)) {
      return res.status(400).json({ error: `Invalid reaction type. Allowed: ${VALID_REACTIONS.join(', ')}` });
    }

    const article = await prisma.article.findUnique({ where: { id } });
    if (!article) return res.status(404).json({ error: 'Article not found' });

    const userId = req.user!.id;

    const existing = await prisma.reaction.findUnique({
      where: { userId_articleId: { userId, articleId: id } }
    });

    let currentReaction: string | null = null;

    if (existing && existing.type === type) {
      // Toggle off / remove
      await prisma.reaction.delete({
        where: { userId_articleId: { userId, articleId: id } }
      });
      currentReaction = null;
    } else if (existing) {
      // Update reaction type
      await prisma.reaction.update({
        where: { userId_articleId: { userId, articleId: id } },
        data: { type }
      });
      currentReaction = type;
    } else {
      // Create new reaction
      await prisma.reaction.create({
        data: {
          type,
          userId,
          articleId: id
        }
      });
      currentReaction = type;
    }

    // Calculate updated counts
    const reactions = await prisma.reaction.findMany({
      where: { articleId: id },
      select: { type: true }
    });

    const counts: Record<string, number> = {
      LIKE: 0,
      INSIGHTFUL: 0,
      HELPFUL: 0,
      total: reactions.length
    };

    for (const r of reactions) {
      if (counts[r.type] !== undefined) counts[r.type]++;
    }

    emitRealtime('reaction:updated', {
      articleId: id,
      counts
    });

    return res.json({
      message: currentReaction ? `Reaction set to ${currentReaction}` : 'Reaction removed',
      counts,
      userReaction: currentReaction
    });
  } catch (err: any) {
    console.error('Post reaction error:', err);
    return res.status(500).json({ error: 'Failed to record reaction' });
  }
});

// GET /api/articles/:id/comments (Public/User: get comments with threaded replies)
articlesRouter.get('/:id/comments', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const comments = await prisma.comment.findMany({
      where: { articleId: id, parentId: null },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, role: true } },
        replies: {
          include: {
            user: { select: { id: true, name: true, role: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    const totalCount = await prisma.comment.count({ where: { articleId: id } });

    return res.json({ comments, totalCount });
  } catch (err: any) {
    console.error('Get comments error:', err);
    return res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// POST /api/articles/:id/comments (User: post comment or reply)
articlesRouter.post('/:id/comments', requireAuth, validateBody(createCommentSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content, parentId } = req.body;

    const article = await prisma.article.findUnique({ where: { id } });
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (parentId) {
      const parentComment = await prisma.comment.findUnique({ where: { id: parentId } });
      if (!parentComment || parentComment.articleId !== id) {
        return res.status(400).json({ error: 'Invalid parent comment for this article' });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        articleId: id,
        userId: req.user!.id,
        parentId: parentId || null
      },
      include: {
        user: { select: { id: true, name: true, role: true } }
      }
    });

    // Real-time broadcast of new comment
    emitRealtime('comment:created', {
      articleId: id,
      comment
    });

    return res.status(201).json({
      message: parentId ? 'Reply added successfully' : 'Comment added successfully',
      comment
    });
  } catch (err: any) {
    console.error('Add comment error:', err);
    return res.status(500).json({ error: 'Failed to add comment' });
  }
});

// PUT /api/articles/comments/:commentId (User: edit own comment or admin)
articlesRouter.put('/comments/:commentId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Comment content cannot be empty' });
    }

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    // Permission check: only comment author or Admin can edit
    if (comment.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You are not authorized to edit this comment' });
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: content.trim(),
        isEdited: true
      },
      include: {
        user: { select: { id: true, name: true, role: true } }
      }
    });

    emitRealtime('comment:updated', {
      articleId: comment.articleId,
      comment: updated
    });

    return res.json({ message: 'Comment updated successfully', comment: updated });
  } catch (err: any) {
    console.error('Edit comment error:', err);
    return res.status(500).json({ error: 'Failed to edit comment' });
  }
});

// DELETE /api/articles/comments/:commentId (User: delete own comment or admin)
articlesRouter.delete('/comments/:commentId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    // Permission check: only comment author or Admin can delete
    if (comment.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You are not authorized to delete this comment' });
    }

    await prisma.comment.delete({ where: { id: commentId } });

    emitRealtime('comment:deleted', {
      articleId: comment.articleId,
      commentId
    });

    return res.json({ message: 'Comment deleted successfully', commentId });
  } catch (err: any) {
    console.error('Delete comment error:', err);
    return res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// POST /api/articles/comments/:commentId/report (User: report comment)
articlesRouter.post('/comments/:commentId/report', requireAuth, async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { reason = 'Inappropriate content' } = req.body || {};

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    const report = await prisma.commentReport.create({
      data: {
        commentId,
        userId: req.user!.id,
        reason: typeof reason === 'string' && reason.trim() ? reason.trim() : 'Flagged by reader'
      }
    });

    return res.status(201).json({ message: 'Comment reported for review', reportId: report.id });
  } catch (err: any) {
    console.error('Report comment error:', err);
    return res.status(500).json({ error: 'Failed to report comment' });
  }
});
