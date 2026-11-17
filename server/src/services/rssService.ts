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

export const CATEGORY_IMAGE_COLLECTIONS: Record<ApprovedCategory, string[]> = {
  'IT': [
    'photo-1518770660439-4636190af475', // Microchip processor die
    'photo-1451187580459-43490279c0fa', // Global digital network
    'photo-1526374965328-7f61d4dc18c5', // Matrix code stream
    'photo-1531297484001-80022131f5a1', // Sleek laptop and workstation
    'photo-1558494949-ef010cbdcc31', // Server rack datacenter
    'photo-1544197150-b99a580bb7a8', // Server room corridor
    'photo-1504384308090-c894fdcc538d', // Modern tech workspace
    'photo-1488590528505-98d2b5aba04b', // Coding monitor
    'photo-1519389950473-47ba0277781c', // Engineering collaboration
    'photo-1525547719571-a2d4ac8945e2', // Laptop and circuit board
    'photo-1461749280684-dccba630e2f6', // Programming code screen
    'photo-1517694712202-14dd9538aa97', // Computer setup
    'photo-1498050108023-c5249f4df085', // Web development desk
    'photo-1550745165-9bc0b252726f', // Electronic components
    'photo-1515378791036-0648a3ef77b2', // Professional computing
    'photo-1537498425277-c283d32ef9db'  // Datacenter hardware
  ],
  'Business': [
    'photo-1486406146926-c627a92ad1ab', // Financial district skyscraper
    'photo-1590283603385-17ffb3a7f29f', // Stock trading screen
    'photo-1559526324-4b87b5e36e44', // Wall street architecture
    'photo-1460925895917-afdab827c52f', // Financial analytics chart
    'photo-1454165804606-c3d57bc86b40', // Corporate strategic planning
    'photo-1507679799987-c73779587ccf', // Executive in business suit
    'photo-1444653614773-995cb1ef9028', // Modern corporate glass towers
    'photo-1526304640581-d334cdbbf45e', // Global financial currencies
    'photo-1551836022-d5d88e9218df', // Executive board meeting
    'photo-1497366216548-37526070297c', // Corporate headquarters office
    'photo-1497215728101-856f4ea42174', // Modern open enterprise floor
    'photo-1512917774080-9991f1c4c750', // Capital investment real estate
    'photo-1520333789090-1afc82db536a', // Modern executive boardroom
    'photo-1553729459-efe14ef6055d', // Business currency and capital
    'photo-1563986768494-4dee2763ff3f', // Enterprise investment analysis
    'photo-1554224155-8d04cb21cd6c'  // Corporate growth analytics
  ],
  'Cyber Security': [
    'photo-1550751827-4bd374c3f58b', // Cyber operations cyber matrix
    'photo-1563986768609-322da13575f3', // Cybersecurity lock symbol
    'photo-1614064641938-3bbee52942c7', // Encrypted cybersecurity shield
    'photo-1510511459019-5dda7724fd87', // Cyber threat telemetry
    'photo-1563089145-599997674d42', // Digital padlock visual
    'photo-1607799279861-4dd421887fb3', // Binary code security stream
    'photo-1504639725590-34d0984388bd', // Ethical hacking terminal
    'photo-1555949963-ff9fe0c870eb', // Cyber threat research console
    'photo-1573164713988-8665fc963095', // Secure communications console
    'photo-1618005182384-a83a8bd57fbe', // Abstract cryptographic curves
    'photo-1516321318423-f06f85e504b3', // Cyber network nodes
    'photo-1510915228340-29c85a43dcfe', // Security specialist working
    'photo-1558494949-ef010cbdcc31', // Firewall hardware security
    'photo-1526374965328-7f61d4dc18c5', // Matrix cyber intrusion stream
    'photo-1544197150-b99a580bb7a8', // Server encryption vault
    'photo-1525547719571-a2d4ac8945e2'  // Hardware security diagnostics
  ],
  'AI': [
    'photo-1677442136019-21780ecad995', // Foundation model neural brain
    'photo-1620712943543-bcc4688e7485', // Synthetic neural connections
    'photo-1531746790731-6c087fecd65a', // Humanoid AI face sculpture
    'photo-1507146426996-ef05306b995a', // Robotics engineering lab
    'photo-1485827404703-89b55fcc595e', // Autonomous robotics hand
    'photo-1535378917042-10a22c95931a', // Robotics lab testing
    'photo-1617791160505-6f008e1e6703', // Cognitive computing visual
    'photo-1516110833967-0b5716ca1387', // Computational intelligence grid
    'photo-1579546929518-9e396f3cc809', // Gradient generative synthesis
    'photo-1531482615713-2afd69097998', // AI model developers
    'photo-1504384308090-c894fdcc538d', // Machine intelligence compute
    'photo-1519389950473-47ba0277781c', // AI research team
    'photo-1526374965328-7f61d4dc18c5', // Neural computational nodes
    'photo-1451187580459-43490279c0fa', // Global cognitive network
    'photo-1558494949-ef010cbdcc31', // GPU cluster compute
    'photo-1518770660439-4636190af475'  // AI accelerator processor
  ]
};

export function generateStraightBrief(title: string, summary?: string, body?: string): string {
  const base = (summary || body || title)
    .replace(/<[^>]+>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*+/g, '')
    .replace(/^---[\s\S]*$/m, '')
    .replace(/\s+/g, ' ')
    .trim();
  const words = base.split(/\s+/).filter(Boolean);
  if (words.length <= 48) return words.join(' ');
  return words.slice(0, 48).join(' ') + '...';
}

export function getDiverseImageUrl(category: ApprovedCategory | string, seed?: string | number): string {
  const str = String(seed || '').toLowerCase();
  let catKey: ApprovedCategory = (category in CATEGORY_IMAGE_COLLECTIONS) ? (category as ApprovedCategory) : 'IT';

  // Keyword-aware contextual image refinement
  if (/attack|breach|hack|threat|vulnerab|malware|ransom|security|supply chain|exploit|zero-day|cve|phish/.test(str)) {
    catKey = 'Cyber Security';
  } else if (/chip|semiconductor|foundry|gpu|nvidia|intel|amd|hardware|datacenter|server|processor|quantum/.test(str)) {
    catKey = 'IT';
  } else if (/stock|market|invest|trade|shares|bank|capital|revenue|earnings|finance|wall street|valuation/.test(str)) {
    catKey = 'Business';
  } else if (/agent|model|neural|llm|robot|autonomous|gpt|gemini|deepmind|anthropic|openai|generative ai/.test(str)) {
    catKey = 'AI';
  }

  const collection = CATEGORY_IMAGE_COLLECTIONS[catKey] || CATEGORY_IMAGE_COLLECTIONS['IT'];
  if (!str) {
    return `https://images.unsplash.com/${collection[0]}?auto=format&fit=crop&w=1200&q=80`;
  }
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % collection.length;
  const photoId = collection[index];
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=1200&q=80`;
}

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

// Helper: Extract image thumbnail from item or HTML description, with deterministic diverse fallback
function extractImage(item: any, category: ApprovedCategory, seed?: string): string {
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
  return getDiverseImageUrl(category, seed || item.title || item.link || item.guid);
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
          const imageUrl = extractImage(item, assignedCategory, rawTitle);
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

          const straightBrief = generateStraightBrief(rawTitle, rawSummary || summary);

          const newArticle = await prisma.article.create({
            data: {
              title: rawTitle,
              slug: createSlug(rawTitle),
              summary: summary || `${rawTitle} — Coverage by ${feed.name}`,
              straightBrief,
              body: articleBody,
              image: imageUrl,
              category: assignedCategory,
              domain: classifyDomain(assignedCategory, rawTitle, rawSummary, feed.domain),
              sourceName: feed.name,
              sourceUrl: item.link || canonicalLink,
              contentType: 'NEWS',
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
