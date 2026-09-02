import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const userRouter = Router();

// All user library routes require authentication
userRouter.use(requireAuth);

// POST /api/user/save/:articleId (User: save or toggle saved article)
userRouter.post('/save/:articleId', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { articleId } = req.params;

    const article = await prisma.article.findUnique({ where: { id: articleId } });
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const existing = await prisma.savedArticle.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId
        }
      }
    });

    if (existing) {
      // Toggle off / unsave
      await prisma.savedArticle.delete({
        where: {
          userId_articleId: {
            userId,
            articleId
          }
        }
      });
      return res.json({ message: 'Article removed from saved library', saved: false, articleId });
    } else {
      // Save
      await prisma.savedArticle.create({
        data: {
          userId,
          articleId
        }
      });
      return res.status(201).json({ message: 'Article saved to library', saved: true, articleId });
    }
  } catch (err: any) {
    console.error('Save article error:', err);
    return res.status(500).json({ error: 'Failed to update saved article' });
  }
});

// GET /api/user/saved (User: get saved article IDs)
userRouter.get('/saved', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const saved = await prisma.savedArticle.findMany({
      where: { userId },
      include: {
        article: {
          include: {
            author: { select: { id: true, name: true } }
          }
        }
      }
    });

    return res.json({
      savedArticleIds: saved.map(s => s.articleId),
      articles: saved.map(s => s.article)
    });
  } catch (err: any) {
    console.error('Get saved articles error:', err);
    return res.status(500).json({ error: 'Failed to fetch saved articles' });
  }
});

// POST /api/user/follow/:authorId (User: toggle follow author)
userRouter.post('/follow/:authorId', async (req: Request, res: Response) => {
  try {
    const followerId = req.user!.id;
    const { authorId } = req.params;

    if (followerId === authorId) {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    const author = await prisma.user.findUnique({ where: { id: authorId } });
    if (!author) {
      return res.status(404).json({ error: 'Author not found' });
    }

    const existing = await prisma.authorFollow.findUnique({
      where: {
        followerId_authorId: {
          followerId,
          authorId
        }
      }
    });

    if (existing) {
      // Unfollow
      await prisma.authorFollow.delete({
        where: {
          followerId_authorId: {
            followerId,
            authorId
          }
        }
      });
      return res.json({ message: `Unfollowed ${author.name}`, following: false, authorId });
    } else {
      // Follow
      await prisma.authorFollow.create({
        data: {
          followerId,
          authorId
        }
      });
      return res.status(201).json({ message: `Now following ${author.name}`, following: true, authorId });
    }
  } catch (err: any) {
    console.error('Follow author error:', err);
    return res.status(500).json({ error: 'Failed to update author follow' });
  }
});

// GET /api/user/following (User: get followed author IDs)
userRouter.get('/following', async (req: Request, res: Response) => {
  try {
    const followerId = req.user!.id;
    const follows = await prisma.authorFollow.findMany({
      where: { followerId },
      include: {
        author: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    return res.json({
      followingAuthorIds: follows.map(f => f.authorId),
      authors: follows.map(f => f.author)
    });
  } catch (err: any) {
    console.error('Get following error:', err);
    return res.status(500).json({ error: 'Failed to fetch followed authors' });
  }
});

userRouter.get('/follows', async (req: Request, res: Response) => {
  try {
    const followerId = req.user!.id;
    const follows = await prisma.authorFollow.findMany({
      where: { followerId },
      orderBy: { author: { name: 'asc' } },
      include: {
        author: {
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
        }
      }
    });

    return res.json({
      authors: follows.map((follow) => ({
        ...follow.author,
        publishedCount: follow.author._count.articles,
        followerCount: follow.author._count.followers
      }))
    });
  } catch (err: any) {
    console.error('Get follows error:', err);
    return res.status(500).json({ error: 'Failed to fetch followed authors' });
  }
});
