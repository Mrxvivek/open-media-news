import Parser from 'rss-parser';
import { prisma } from '../prisma.js';
import { emitRealtime } from '../realtime.js';
import {
  ApprovedCategory,
  isEnglishText,
  translateToEnglish,
  classifyNews,
  classifyDomain,
  normalizeHeadline,
  canonicalizeUrl
} from './newsClassifier.js';

export interface RSSFeedConfig {
  id: string;
  name: string;
  url: string;
  category: ApprovedCategory;
  domain: string;
  language: 'en';
}

/**
 * Approved Centralized RSS Sources organized strictly under 4 pillars:
 * 1. Business
 * 2. IT & Technology ('IT')
 * 3. Cyber Security
 * 4. Artificial Intelligence ('AI')
 */
export const RSS_FEEDS: RSSFeedConfig[] = [
  // --- 1. BUSINESS ---
  {
    id: 'google-business-global',
    name: 'Google News Business',
    url: 'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-US&gl=US&ceid=US:en',
    category: 'Business',
    domain: 'Global Business',
    language: 'en'
  },
  {
    id: 'google-business-in',
    name: 'Google News Business (India & Asia)',
    url: 'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-IN&gl=IN&ceid=IN:en',
    category: 'Business',
    domain: 'Enterprise Markets',
    language: 'en'
  },
  {
    id: 'wsj-business',
    name: 'Wall Street Journal Business',
    url: 'https://feeds.a.dj.com/rss/WSJcomUSBusiness.xml',
    category: 'Business',
    domain: 'Wall Street Journal',
    language: 'en'
  },
  {
    id: 'fortune-business',
    name: 'Fortune',
    url: 'https://fortune.com/feed/',
    category: 'Business',
    domain: 'Fortune',
    language: 'en'
  },

  // --- 2. IT & TECHNOLOGY ---
  {
    id: 'techcrunch',
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    category: 'IT',
    domain: 'Startups & Tech',
    language: 'en'
  },
  {
    id: 'wired-tech',
    name: 'Wired',
    url: 'https://www.wired.com/feed/rss',
    category: 'IT',
    domain: 'Wired',
    language: 'en'
  },
  {
    id: 'ars-technica',
    name: 'Ars Technica',
    url: 'https://feeds.arstechnica.com/arstechnica/index',
    category: 'IT',
    domain: 'Ars Technica',
    language: 'en'
  },
  {
    id: 'bbc-tech',
    name: 'BBC News Technology',
    url: 'https://feeds.bbci.co.uk/news/technology/rss.xml',
    category: 'IT',
    domain: 'BBC Tech',
    language: 'en'
  },
  {
    id: 'google-tech',
    name: 'Google News Technology',
    url: 'https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-US&gl=US&ceid=US:en',
    category: 'IT',
    domain: 'Enterprise IT',
    language: 'en'
  },

  // --- 3. CYBER SECURITY ---
  {
    id: 'the-hackers-news',
    name: 'The Hacker News',
    url: 'https://feeds.feedburner.com/TheHackersNews',
    category: 'Cyber Security',
    domain: 'Security Research',
    language: 'en'
  },
  {
    id: 'securityweek',
    name: 'SecurityWeek',
    url: 'https://www.securityweek.com/feed/',
    category: 'Cyber Security',
    domain: 'SecurityWeek',
    language: 'en'
  },
  {
    id: 'darkreading',
    name: 'Dark Reading',
    url: 'https://www.darkreading.com/rss.xml',
    category: 'Cyber Security',
    domain: 'Information Security',
    language: 'en'
  },
  {
    id: 'google-cyber',
    name: 'Google News Cybersecurity',
    url: 'https://news.google.com/rss/search?q=cybersecurity&hl=en-US&gl=US&ceid=US:en',
    category: 'Cyber Security',
    domain: 'Zero-Day Research',
    language: 'en'
  },

  // --- 4. ARTIFICIAL INTELLIGENCE ---
  {
    id: 'google-ai',
    name: 'Google News AI',
    url: 'https://news.google.com/rss/search?q=%22artificial+intelligence%22+OR+%22generative+ai%22+OR+%22machine+learning%22&hl=en-US&gl=US&ceid=US:en',
    category: 'AI',
    domain: 'Artificial Intelligence',
    language: 'en'
  },
  {
    id: 'mit-tech-ai',
    name: 'MIT Technology Review AI',
    url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed/',
    category: 'AI',
    domain: 'MIT Tech Review',
    language: 'en'
  },
  {
    id: 'techcrunch-ai',
    name: 'TechCrunch AI',
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    category: 'AI',
    domain: 'TechCrunch AI',
    language: 'en'
  }
];

const CATEGORY_DEFAULT_IMAGES: Record<ApprovedCategory, string> = {
  'IT': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
  'Business': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
  'Cyber Security': 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
  'AI': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80'
};

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['content:encoded', 'contentEncoded'],
      ['dc:creator', 'creator']
    ]
  },
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  }
});

// Helper: Strip HTML tags and entities
function cleanText(raw?: string): string {
  if (!raw) return '';
  return raw
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper: Extract image thumbnail from item or HTML description
function extractImage(item: any, category: ApprovedCategory): string {
  if (item.enclosure?.url && item.enclosure.url.match(/\.(jpeg|jpg|gif|png|webp)/i)) {
    return item.enclosure.url;
  }
  if (item.mediaContent?.$?.url) {
    return item.mediaContent.$.url;
  }
  if (item.mediaThumbnail?.$?.url) {
    return item.mediaThumbnail.$.url;
  }
  const anyItem = item as any;
  const content = anyItem.contentEncoded || anyItem.content || anyItem.description || '';
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch && imgMatch[1]) {
    return imgMatch[1];
  }
  return CATEGORY_DEFAULT_IMAGES[category] || CATEGORY_DEFAULT_IMAGES['IT'];
}

// Helper: Create URL slug
function createSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return `${base.slice(0, 50)}-${randomSuffix}`;
}

export interface RSSSyncStats {
  lastSyncTime: string | null;
  totalFetched: number;
  newInserted: number;
  skippedDuplicates: number;
  activeFeeds: number;
  isSyncing: boolean;
  errors: Array<{ feed: string; error: string }>;
}

let syncStats: RSSSyncStats = {
  lastSyncTime: null,
  totalFetched: 0,
  newInserted: 0,
  skippedDuplicates: 0,
  activeFeeds: RSS_FEEDS.length,
  isSyncing: false,
  errors: []
};

// Ensure default News Wire author exists in the database
let cachedWireAuthorId: string | null = null;
async function getOrCreateWireAuthorId(): Promise<string> {
  if (cachedWireAuthorId) return cachedWireAuthorId;

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: 'wire@openmedia.test' },
        { email: 'admin@openmedia.test' },
        { role: 'ADMIN' }
      ]
    }
  });

  if (existing) {
    cachedWireAuthorId = existing.id;
    return existing.id;
  }

  const newUser = await prisma.user.create({
    data: {
      name: 'OpenMedia News Wire',
      email: 'wire@openmedia.test',
      passwordHash: '$2a$10$wT282n0aV/e15D2hR9aT4.H2F6kEw6r4V6w2s8A1u8k5e2o1n5.uC',
      role: 'PUBLISHER'
    }
  });

  cachedWireAuthorId = newUser.id;
  return newUser.id;
}

/**
 * Ingest fresh articles from configured RSS feeds into OpenMedia database
 * with strict English-language verification, category classification,
 * exclusion filtering, and duplicate prevention.
 */
export async function ingestRSSFeeds(): Promise<RSSSyncStats> {
  if (syncStats.isSyncing) {
    console.log('[RSS Engine] Ingestion already in progress, skipping duplicate trigger.');
    return syncStats;
  }

  syncStats.isSyncing = true;
  syncStats.errors = [];
  let newArticlesInRun = 0;
  let totalFetchedInRun = 0;
  let skippedInRun = 0;

  try {
    const authorId = await getOrCreateWireAuthorId();

    for (const feed of RSS_FEEDS) {
      try {
        const parsed = await parser.parseURL(feed.url);
        const items = parsed.items || [];
        totalFetchedInRun += items.length;

        // Process top 12 newest items per feed to avoid database flooding
        const recentItems = items.slice(0, 12);

        for (const item of recentItems) {
          let rawTitle = cleanText(item.title);
          if (!rawTitle || rawTitle.length < 5) continue;

          const anyItem = item as any;
          let rawSummary = cleanText(anyItem.contentSnippet || anyItem.summary || anyItem.description || '');

          // 1. Language Detection & English Verification
          if (!isEnglishText(rawTitle) || (rawSummary && !isEnglishText(rawSummary))) {
            const transTitle = await translateToEnglish(rawTitle);
            const transSummary = rawSummary ? await translateToEnglish(rawSummary) : '';

            if (transTitle && isEnglishText(transTitle)) {
              rawTitle = transTitle;
              rawSummary = transSummary || rawSummary;
            } else {
              // Reliable translation unavailable: skip rather than publishing untranslated content
              skippedInRun++;
              continue;
            }
          }

          // 2. Strict Category Classification & Exclusion Filtering
          const classification = classifyNews(rawTitle, rawSummary, feed.category);
          if (!classification.approved || !classification.category) {
            // Unrelated topic (cinema, politics, sports, general crime, weather, local)
            skippedInRun++;
            continue;
          }

          const assignedCategory: ApprovedCategory = classification.category;
          const canonicalLink = canonicalizeUrl(item.link);
          const titleFingerprint = normalizeHeadline(rawTitle);

          // 3. Duplicate Prevention across all feeds & categories
          // Check A: Canonical link in database body
          const existingByLink = canonicalLink ? await prisma.article.findFirst({
            where: {
              body: { contains: canonicalLink }
            },
            select: { id: true }
          }) : null;

          if (existingByLink) {
            skippedInRun++;
            continue;
          }

          // Check B: Normalized headline duplicate check
          const existingByTitle = await prisma.article.findFirst({
            where: {
              OR: [
                { title: rawTitle },
                { title: { contains: rawTitle.slice(0, 42) } }
              ]
            },
            select: { id: true, title: true }
          });

          if (existingByTitle) {
            skippedInRun++;
            continue;
          }

          // 4. Format Content
          const summary = rawSummary.length > 250 ? `${rawSummary.slice(0, 247)}...` : rawSummary;
          const imageUrl = extractImage(item, assignedCategory);
          const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();

          // Build clean article body with publisher attribution and canonical link
          const articleBody = `
${rawSummary || rawTitle}

---
*Source: Originally syndicated via **${feed.name}**.*  
[Read the full continuous story on official wire source →](${item.link || canonicalLink})
<!-- canonical_url: ${canonicalLink} -->
<!-- fingerprint: ${titleFingerprint.slice(0, 80)} -->
`.trim();

          const newArticle = await prisma.article.create({
            data: {
              title: rawTitle,
              slug: createSlug(rawTitle),
              summary: summary || `${rawTitle} — Coverage by ${feed.name}`,
              body: articleBody,
              image: imageUrl,
              category: assignedCategory,
              domain: classifyDomain(assignedCategory, rawTitle, rawSummary, feed.domain),
              status: 'PUBLISHED',
              publishedAt,
              authorId
            },
            include: {
              author: {
                select: { id: true, name: true, email: true, role: true }
              }
            }
          });

          newArticlesInRun++;

          // Broadcast real-time push to all connected users
          emitRealtime('article:created', {
            id: newArticle.id,
            title: newArticle.title,
            category: newArticle.category,
            domain: newArticle.domain,
            publishedAt: newArticle.publishedAt,
            image: newArticle.image,
            summary: newArticle.summary,
            source: feed.name
          });
        }
      } catch (feedErr: any) {
        console.warn(`[RSS Engine] Error fetching feed "${feed.name}":`, feedErr.message || feedErr);
        syncStats.errors.push({ feed: feed.name, error: feedErr.message || String(feedErr) });
      }
    }

    syncStats.lastSyncTime = new Date().toISOString();
    syncStats.totalFetched += totalFetchedInRun;
    syncStats.newInserted += newArticlesInRun;
    syncStats.skippedDuplicates += skippedInRun;

    console.log(`[RSS Engine] Ingestion complete at ${syncStats.lastSyncTime}. Ingested: ${newArticlesInRun}, Filtered/Skipped: ${skippedInRun}, Total Processed: ${totalFetchedInRun}`);

    if (newArticlesInRun > 0) {
      emitRealtime('articles:rss_synced', {
        inserted: newArticlesInRun,
        skipped: skippedInRun,
        timestamp: syncStats.lastSyncTime
      });
    }
  } catch (err: any) {
    console.error('[RSS Engine] Critical ingestion pipeline failure:', err);
  } finally {
    syncStats.isSyncing = false;
  }

  return syncStats;
}

export function getRSSStats(): RSSSyncStats {
  return { ...syncStats };
}

let schedulerTimer: NodeJS.Timeout | null = null;

/**
 * Start automated recurring RSS background ingestion
 */
export function startRSSAutomation(intervalMinutes: number = 15) {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
  }

  console.log(`[RSS Engine] Initializing automated RSS polling every ${intervalMinutes} minutes.`);

  // Grace initial fetch after 3 seconds so server boots cleanly
  setTimeout(() => {
    ingestRSSFeeds().catch((err) => console.error('[RSS Engine] Initial boot ingestion error:', err));
  }, 3000);

  // Recurring cron interval
  schedulerTimer = setInterval(() => {
    ingestRSSFeeds().catch((err) => console.error('[RSS Engine] Scheduled ingestion error:', err));
  }, intervalMinutes * 60 * 1000);

  if (schedulerTimer.unref) {
    schedulerTimer.unref();
  }
}
