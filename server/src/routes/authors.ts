import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';

export const authorsRouter = Router();

authorsRouter.get('/trending', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit || '6'), 10) || 6, 20);

    const authors = await prisma.user.findMany({
      where: {
        role: { in: ['PUBLISHER', 'ADMIN'] }
      },
      take: limit,
      orderBy: [
        { articles: { _count: 'desc' } },
        { followers: { _count: 'desc' } },
        { createdAt: 'asc' }
      ],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        _count: {
          select: {
            articles: {
              where: { status: 'PUBLISHED' }
            },
            followers: true
          }
        }
      }
    });

    return res.json({
      authors: authors.map((author) => ({
        ...author,
        publishedCount: author._count.articles,
        followerCount: author._count.followers
      }))
    });
  } catch (err: any) {
    console.error('Trending authors error:', err);
    return res.status(500).json({ error: 'Failed to fetch trending authors' });
  }
});
