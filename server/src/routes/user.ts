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

// GET /api/user/history (User: fetch reading history)
userRouter.get('/history', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const history = await prisma.readingHistory.findMany({
      where: { userId },
      orderBy: { viewedAt: 'desc' },
      take: 50,
      include: {
        article: {
          include: {
            author: { select: { id: true, name: true } }
          }
        }
      }
    });

    return res.json({
      history: history.map(h => ({
        articleId: h.articleId,
        viewedAt: h.viewedAt,
        article: h.article
      }))
    });
  } catch (err: any) {
    console.error('Get reading history error:', err);
    return res.status(500).json({ error: 'Failed to fetch reading history' });
  }
});

// POST /api/user/history/:articleId (User: record article read)
userRouter.post('/history/:articleId', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { articleId } = req.params;

    const article = await prisma.article.findUnique({ where: { id: articleId } });
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const item = await prisma.readingHistory.upsert({
      where: {
        userId_articleId: { userId, articleId }
      },
      update: {
        viewedAt: new Date()
      },
      create: {
        userId,
        articleId,
        viewedAt: new Date()
      }
    });

    return res.json({ message: 'Reading history updated', item });
  } catch (err: any) {
    console.error('Record reading history error:', err);
    return res.status(500).json({ error: 'Failed to record reading history' });
  }
});

// DELETE /api/user/history (User: clear reading history)
userRouter.delete('/history', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    await prisma.readingHistory.deleteMany({
      where: { userId }
    });

    return res.json({ message: 'Reading history cleared successfully' });
  } catch (err: any) {
    console.error('Clear reading history error:', err);
    return res.status(500).json({ error: 'Failed to clear reading history' });
  }
});

// GET /api/user/profile (User: own profile with stats & preferences)
userRouter.get('/profile', async (req: Request, res: Response) => {
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
        bio: true,
        avatarUrl: true,
        followedTopics: true,
        createdAt: true,
        _count: {
          select: {
            savedArticles: true,
            readingHistory: true,
            following: true,
            articles: { where: { status: 'PUBLISHED' } },
            discussions: true,
            comments: true
          }
        }
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    let topics: string[] = [];
    try {
      topics = user.followedTopics ? JSON.parse(user.followedTopics) : [];
    } catch {
      topics = [];
    }

    return res.json({
      profile: {
        ...user,
        followedTopics: topics,
        stats: {
          savedCount: user._count.savedArticles,
          historyCount: user._count.readingHistory,
          followingCount: user._count.following,
          articlesCount: user._count.articles,
          discussionsCount: user._count.discussions,
          commentsCount: user._count.comments
        }
      }
    });
  } catch (err: any) {
    console.error('Get profile error:', err);
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// PUT /api/user/profile (User: update own profile)
userRouter.put('/profile', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, bio, avatarUrl, followedTopics } = req.body;

    const data: any = {};
    if (typeof name === 'string' && name.trim()) data.name = name.trim();
    if (bio !== undefined) data.bio = typeof bio === 'string' ? bio.trim() : null;
    if (avatarUrl !== undefined) data.avatarUrl = typeof avatarUrl === 'string' ? avatarUrl.trim() : null;
    if (Array.isArray(followedTopics)) {
      data.followedTopics = JSON.stringify(followedTopics.map((t: any) => String(t).trim()));
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bio: true,
        avatarUrl: true,
        followedTopics: true
      }
    });

    let topics: string[] = [];
    try {
      topics = updated.followedTopics ? JSON.parse(updated.followedTopics) : [];
    } catch {
      topics = [];
    }

    return res.json({
      message: 'Profile updated successfully',
      profile: {
        ...updated,
        followedTopics: topics
      }
    });
  } catch (err: any) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/user/follow-topic (User: toggle follow a topic)
userRouter.post('/follow-topic', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { topic } = req.body;

    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return res.status(400).json({ error: 'Topic string is required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { followedTopics: true }
    });

    let topics: string[] = [];
    try {
      topics = user?.followedTopics ? JSON.parse(user.followedTopics) : [];
    } catch {
      topics = [];
    }

    const cleanTopic = topic.trim();
    let isFollowing = false;

    if (topics.includes(cleanTopic)) {
      topics = topics.filter(t => t !== cleanTopic);
      isFollowing = false;
    } else {
      topics.push(cleanTopic);
      isFollowing = true;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { followedTopics: JSON.stringify(topics) }
    });

    return res.json({
      message: isFollowing ? `Followed topic: ${cleanTopic}` : `Unfollowed topic: ${cleanTopic}`,
      followedTopics: topics,
      isFollowing
    });
  } catch (err: any) {
    console.error('Follow topic error:', err);
    return res.status(500).json({ error: 'Failed to update followed topic' });
  }
});

// GET /api/user/for-you (User: transparent multi-factor recommendation engine)
userRouter.get('/for-you', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // 1. Fetch user's preferences & recent activity
    const [user, history, follows] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { followedTopics: true }
      }),
      prisma.readingHistory.findMany({
        where: { userId },
        orderBy: { viewedAt: 'desc' },
        take: 10,
        include: { article: { select: { category: true } } }
      }),
      prisma.authorFollow.findMany({
        where: { followerId: userId },
        select: { authorId: true }
      })
    ]);

    let followedTopics: string[] = [];
    try {
      followedTopics = user?.followedTopics ? JSON.parse(user.followedTopics) : [];
    } catch {
      followedTopics = [];
    }

    const followedAuthorIds = follows.map(f => f.authorId);

    // Count top categories from history
    const historyCategories: Record<string, number> = {};
    history.forEach(h => {
      const cat = h.article.category;
      if (cat) historyCategories[cat] = (historyCategories[cat] || 0) + 1;
    });
    const topHistoryCategories = Object.keys(historyCategories);

    // 2. Query recommended articles matching transparent criteria
    const whereOr: any[] = [];

    if (followedTopics.length > 0) {
      whereOr.push({ category: { in: followedTopics } });
    }
    if (followedAuthorIds.length > 0) {
      whereOr.push({ authorId: { in: followedAuthorIds } });
    }
    if (topHistoryCategories.length > 0) {
      whereOr.push({ category: { in: topHistoryCategories } });
    }

    let recommendedArticles: any[] = [];

    if (whereOr.length > 0) {
      recommendedArticles = await prisma.article.findMany({
        where: {
          status: 'PUBLISHED',
          OR: whereOr
        },
        take: 20,
        orderBy: { publishedAt: 'desc' },
        include: {
          author: { select: { id: true, name: true } },
          _count: { select: { comments: true, savedBy: true } }
        }
      });
    }

    // 3. Fallback: if user has no preferences or matches, provide top engaging stories
    if (recommendedArticles.length < 5) {
      const existingIds = recommendedArticles.map(a => a.id);
      const fallback = await prisma.article.findMany({
        where: {
          status: 'PUBLISHED',
          id: { notIn: existingIds }
        },
        take: 10,
        orderBy: [
          { comments: { _count: 'desc' } },
          { publishedAt: 'desc' }
        ],
        include: {
          author: { select: { id: true, name: true } },
          _count: { select: { comments: true, savedBy: true } }
        }
      });
      recommendedArticles = [...recommendedArticles, ...fallback];
    }

    // 4. Attach transparent recommendation explanation to each article
    const articlesWithAttribution = recommendedArticles.map(article => {
      let recommendationReason = 'Popular on OPEN MEDIA';
      if (followedTopics.includes(article.category)) {
        recommendationReason = `Matches your followed topic: ${article.category}`;
      } else if (followedAuthorIds.includes(article.authorId)) {
        recommendationReason = `From followed author: ${article.author?.name || 'Contributor'}`;
      } else if (topHistoryCategories.includes(article.category)) {
        recommendationReason = `Based on your recent interest in ${article.category}`;
      }

      return {
        ...article,
        recommendationReason
      };
    });

    return res.json({
      recommendations: articlesWithAttribution,
      factors: {
        followedTopics,
        followedAuthorsCount: followedAuthorIds.length,
        frequentCategories: topHistoryCategories
      }
    });
  } catch (err: any) {
    console.error('For You recommendations error:', err);
    return res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});
