import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { ingestRSSFeeds, getRSSStats, RSS_FEEDS } from '../services/rssService.js';
import { resolveCategory } from '../services/newsClassifier.js';

export const newsRouter = Router();

const APPROVED_CATEGORIES = ['Business', 'IT', 'Cyber Security', 'AI'];

// GET /api/news/feed (Categorized RSS & database news feed)
newsRouter.get('/feed', async (req: Request, res: Response) => {
  try {
    const { category, search, limit = '30', offset = '0' } = req.query;

    const where: any = {
      status: 'PUBLISHED'
    };

    const resolvedCategory = category && typeof category === 'string' && category !== 'all'
      ? resolveCategory(category)
      : null;

    if (resolvedCategory) {
      where.category = resolvedCategory;
    } else {
      where.category = { in: APPROVED_CATEGORIES };
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q } },
        { summary: { contains: q } },
        { domain: { contains: q } }
      ];
    }

    const take = Math.min(parseInt(limit as string, 10) || 30, 100);
    const skip = parseInt(offset as string, 10) || 0;

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        take,
        skip,
        orderBy: { publishedAt: 'desc' },
        include: {
          author: {
            select: { id: true, name: true, role: true }
          }
        }
      }),
      prisma.article.count({ where })
    ]);

    return res.json({
      success: true,
      total,
      count: articles.length,
      articles
    });
  } catch (err: any) {
    console.error('News feed error:', err);
    return res.status(500).json({ error: 'Failed to retrieve news feed' });
  }
});

// GET /api/news/ticker (Breaking news headlines for ticker marquee)
newsRouter.get('/ticker', async (req: Request, res: Response) => {
  try {
    const breaking = await prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        category: { in: APPROVED_CATEGORIES }
      },
      take: 16,
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        category: true,
        domain: true,
        slug: true,
        publishedAt: true
      }
    });

    const items = breaking.map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      domain: item.domain,
      slug: item.slug,
      time: item.publishedAt
    }));

    return res.json({
      success: true,
      count: items.length,
      headlines: items,
      items
    });
  } catch (err: any) {
    console.error('Ticker error:', err);
    return res.status(500).json({ error: 'Failed to load breaking headlines' });
  }
});

// POST /api/news/sync (Manual RSS Ingestion Trigger)
newsRouter.post('/sync', async (req: Request, res: Response) => {
  try {
    const stats = await ingestRSSFeeds();
    return res.json({
      success: true,
      message: 'RSS ingestion completed successfully.',
      stats
    });
  } catch (err: any) {
    console.error('Manual RSS sync error:', err);
    return res.status(500).json({ error: 'Failed to execute RSS sync' });
  }
});

// GET /api/news/stats (RSS Ingestion System Status)
newsRouter.get('/stats', (req: Request, res: Response) => {
  const stats = getRSSStats();
  return res.json({
    success: true,
    engine: 'OpenMedia Automated RSS News Aggregator',
    feedsConfigured: RSS_FEEDS.map((f) => ({
      id: f.id,
      name: f.name,
      category: f.category,
      domain: f.domain,
      language: f.language
    })),
    stats
  });
});

// Helper: Generates RSS 2.0 XML of OpenMedia's articles (overall or per category tab)
export async function generateRSSXML(categoryInput?: string): Promise<string> {
  const resolvedCategory = resolveCategory(categoryInput);

  const where: any = {
    status: 'PUBLISHED'
  };

  if (resolvedCategory) {
    where.category = resolvedCategory;
  } else {
    where.category = { in: APPROVED_CATEGORIES };
  }

  const articles = await prisma.article.findMany({
    where,
    take: 50,
    orderBy: { publishedAt: 'desc' },
    include: {
      author: { select: { name: true } }
    }
  });

  const itemsXML = articles.map((art) => `
    <item>
      <title><![CDATA[${art.title}]]></title>
      <link>https://openmedia.soxit.in/#article/${art.slug}</link>
      <guid isPermaLink="false">${art.id}</guid>
      <pubDate>${new Date(art.publishedAt || art.createdAt).toUTCString()}</pubDate>
      <category><![CDATA[${art.category}]]></category>
      <dc:creator><![CDATA[${art.author?.name || 'OpenMedia Wire'}]]></dc:creator>
      <description><![CDATA[${art.summary}]]></description>
      ${art.image ? `<enclosure url="${art.image}" type="image/jpeg" />` : ''}
    </item>
  `).join('\n');

  const feedTitle = resolvedCategory
    ? `OPEN MEDIA — ${resolvedCategory} Intelligence RSS Feed`
    : `OPEN MEDIA — Global Technology, Business &amp; Cybersecurity Intelligence`;

  const feedDesc = resolvedCategory
    ? `Latest syndicated ${resolvedCategory} intelligence and editorial coverage from OPEN MEDIA.`
    : `Latest worldwide intelligence, AI innovations, enterprise tech, cyber alerts, and business reports.`;

  const feedLink = resolvedCategory
    ? `https://openmedia.soxit.in/#${resolvedCategory === 'IT' ? 'tech' : resolvedCategory === 'Cyber Security' ? 'cyber' : resolvedCategory.toLowerCase()}`
    : `https://openmedia.soxit.in`;

  const selfLink = resolvedCategory
    ? `https://openmedia.soxit.in/rss.xml?category=${encodeURIComponent(resolvedCategory)}`
    : `https://openmedia.soxit.in/rss.xml`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${feedTitle}</title>
    <link>${feedLink}</link>
    <description>${feedDesc}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${selfLink}" rel="self" type="application/rss+xml" />
    ${itemsXML}
  </channel>
</rss>`;
}
