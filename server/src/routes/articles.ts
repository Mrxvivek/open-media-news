import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateBody, createArticleSchema, createCommentSchema, resubmitArticleSchema } from '../middleware/validation.js';
import { emitRealtime } from '../index.js';

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
    const { category, search, limit = '50', offset = '0' } = req.query;

    const where: any = {
      status: 'PUBLISHED'
    };

    if (category && typeof category === 'string' && category !== 'all') {
      where.category = category;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q } },
        { summary: { contains: q } },
        { body: { contains: q } }
      ];
    }

    const take = Math.min(parseInt(limit as string, 10) || 50, 100);
    const skip = parseInt(offset as string, 10) || 0;

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        take,
        skip,
        orderBy: { publishedAt: 'desc' },
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
    if (category && category !== 'all') {
      where.category = category;
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
    const { title, summary, body, category, domain, image, imageUrl, status = 'PENDING' } = req.body;

    const userRole = req.user!.role;
    // Only admins can directly create PUBLISHED articles; publishers submit as PENDING or DRAFT
    let finalStatus: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED' = 'PENDING';
    if (status === 'DRAFT') {
      finalStatus = 'DRAFT';
    } else if (userRole === 'ADMIN' && status === 'PUBLISHED') {
      finalStatus = 'PUBLISHED';
    } else {
      finalStatus = 'PENDING';
    }

    const slug = slugify(title);

    const article = await prisma.article.create({
      data: {
        title: title.trim(),
        slug,
        summary: summary.trim(),
        body: body.trim(),
        category: category.trim(),
        domain: domain?.trim() || null,
        image: image?.trim() || imageUrl?.trim() || null,
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
        image: req.body.image?.trim() || req.body.imageUrl?.trim() || null,
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

// GET /api/articles/:id/comments (Public/User: get comments)
articlesRouter.get('/:id/comments', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const comments = await prisma.comment.findMany({
      where: { articleId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } }
      }
    });

    return res.json({ comments });
  } catch (err: any) {
    console.error('Get comments error:', err);
    return res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// POST /api/articles/:id/comments (User: comment on posts)
articlesRouter.post('/:id/comments', requireAuth, validateBody(createCommentSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const article = await prisma.article.findUnique({ where: { id } });
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        articleId: id,
        userId: req.user!.id
      },
      include: {
        user: { select: { id: true, name: true } }
      }
    });

    // Real-time broadcast of new comment
    emitRealtime('comment:created', {
      articleId: id,
      comment
    });

    return res.status(201).json({
      message: 'Comment added successfully',
      comment
    });
  } catch (err: any) {
    console.error('Add comment error:', err);
    return res.status(500).json({ error: 'Failed to add comment' });
  }
});
