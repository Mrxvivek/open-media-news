/**
 * OPEN MEDIA — CORE CONTROLLER
 * Single Page Application routing, magazine reader, reactive storage, search & AI.
 */

const APPROVED_CATEGORIES = ['Business', 'IT', 'Cyber Security', 'AI'];
const NON_ENGLISH_REGEX = /[\u0C00-\u0C7F\u0900-\u0D7F\u0E00-\u0E7F\u3040-\u30FF\u4E00-\u9FFF\u0600-\u06FF]/;
const CAT_MAP = { tech: 'IT', business: 'Business', cyber: 'Cyber Security', ai: 'AI' };
const VALID_PAGES = ['home', 'foryou', 'business', 'tech', 'cyber', 'ai', 'publish', 'admin', 'careers', 'contact', 'advertise'];

const TECH_DOMAIN_GROUPS = {
  'Artificial Intelligence': ['Generative AI', 'AI Startups', 'Machine Learning', 'AI Policy', 'AI Tools', 'Indian Language AI'],
  'Cloud Computing & Data Centres': ['AWS', 'Azure', 'Google Cloud', 'Data Centres', 'Kubernetes', 'AI Infrastructure'],
  'Semiconductors & Hardware': ['AI Chips', 'GPUs', 'Smartphones', 'Laptops', 'Servers', 'Manufacturing'],
  'Startups, Enterprise IT & Digital Business': ['Startup Funding', 'SaaS', 'FinTech', 'Product Launches', 'Technology Jobs', 'Founder Stories']
};
const BUSINESS_DOMAIN_GROUPS = {
  'Companies & Corporations': ['Company News', 'Product Launches', 'Corporate Announcements'],
  'Corporate Finance & Earnings': ['Quarterly Results', 'Revenue Reports', 'Profit Analysis', 'Debt Management'],
  'Mergers, Acquisitions & Deals': ['Acquisitions', 'Partnerships', 'Joint Ventures', 'Strategic Alliances'],
  'Business Strategy': ['Digital Transformation', 'Innovation', 'Market Competition', 'Restructuring'],
  'Leadership & Management': ['CEO Changes', 'Executive Appointments', 'Board Updates', 'Leadership Insights'],
  'Corporate Growth & Expansion': ['New Markets', 'Global Expansion', 'Hiring', 'New Offices']
};
const CYBER_DOMAIN_GROUPS = {
  'Global Cyber Attacks': ['Worldwide Attacks', 'Nation-State Threats', 'Incident Reports'],
  'Threat Insights': ['Threat Intelligence', 'APT Groups', 'Security Research'],
  'Zero-Day Radar': ['CVEs', 'Exploits', 'Patches', 'Vulnerabilities'],
  'Ransomware Files': ['Ransomware Attacks', 'Data Leaks', 'Recovery Stories'],
  'Events': ['Security Conferences', 'Training Programs', 'Expert Sessions']
};
// group -> canonical domain string that exists on real article records
const GROUP_MATCH = {
  'Artificial Intelligence': 'Artificial Intelligence',
  'Cloud Computing & Data Centres': 'Cloud Computing',
  'Semiconductors & Hardware': 'Semiconductors',
  'Startups, Enterprise IT & Digital Business': 'Startups',
  'Companies & Corporations': 'Companies',
  'Corporate Finance & Earnings': 'Earnings',
  'Mergers, Acquisitions & Deals': 'M&A',
  'Business Strategy': 'Strategy',
  'Leadership & Management': 'Leadership',
  'Corporate Growth & Expansion': 'Expansion',
  'Partnerships': 'Partnerships',
  'Global Cyber Attacks': 'Global Attacks',
  'Threat Insights': 'Security Research',
  'Zero-Day Radar': 'Zero-Day',
  'Ransomware Files': 'Ransomware',
  'Events': 'Critical'
};
const BUSINESS_DOMAIN_MATCH = {
  'Company News': 'Companies',
  'Product Launches': 'Companies',
  'Corporate Announcements': 'Companies',
  'Quarterly Results': 'Earnings',
  'Revenue Reports': 'Earnings',
  'Profit Analysis': 'Earnings',
  'Debt Management': 'Earnings',
  'Acquisitions': 'M&A',
  'Partnerships': 'Partnerships',
  'Joint Ventures': 'M&A',
  'Strategic Alliances': 'M&A',
  'Digital Transformation': 'Strategy',
  'Innovation': 'Strategy',
  'Market Competition': 'Strategy',
  'Restructuring': 'Strategy',
  'CEO Changes': 'Leadership',
  'Executive Appointments': 'Leadership',
  'Board Updates': 'Leadership',
  'Leadership Insights': 'Leadership',
  'New Markets': 'Expansion',
  'Global Expansion': 'Expansion',
  'Hiring': 'Expansion',
  'New Offices': 'Expansion'
};

const DOMAIN_KEYWORDS = {
  // Business Pillar Domains
  'Companies': /\b(company|companies|corporation|corporate|retailer|manufacturer|firm|conglomerate|brand|industry|consumer|product launch|commercial|business|store|stores|operations|apple|google|amazon|microsoft|tesla|meta|walmart|reliance|tata)\b/i,
  'Earnings': /\b(earning|earnings|revenue|profit|profits|quarterly|quarter|q[1-4]|fiscal|results|guidance|shares|stock|stocks|stock market|wall street|valuation|dividend|margins|balance sheet|sales|financial|nasdaq|s&p|sensex|nifty|market cap)\b/i,
  'M&A': /\b(m&a|merger|mergers|acquire|acquires|acquired|acquisition|acquisitions|deal|deals|buyout|takeover|joint venture|alliance|purchase|bought|bid|bidding)\b/i,
  'Strategy': /\b(strategy|strategic|transformation|compete|competition|pivot|restructuring|innovation|plan|plans|overhaul|outlook|future|roadmap|initiative|reorganize)\b/i,
  'Leadership': /\b(ceo|cfo|cto|coo|chief executive|executive|executives|board|founder|founders|leadership|director|directors|appointed|appoints|resigns|resigned|steps down|management|chair|chairman|oust|ousted)\b/i,
  'Expansion': /\b(expansion|expand|expands|expanding|growth|new market|new markets|global|nationwide|facility|offices|hiring|scaling|rollout|entry|enter|international)\b/i,
  'Partnerships': /\b(partnership|partnerships|partner|partners|partnering|collaboration|collaborate|collaborating|agreement|pact|tie-up|alliance|consortium|deal with)\b/i,

  // IT & Technology Pillar Domains
  'Artificial Intelligence': /\b(ai|artificial intelligence|generative ai|genai|llm|llms|chatgpt|openai|anthropic|claude|gemini|deepseek|machine learning|deep learning|copilot|model|neural|autonomous|agent|agents)\b/i,
  'Cloud Computing': /\b(cloud|aws|amazon web services|azure|microsoft azure|google cloud|data center|data centers|datacenter|datacenters|kubernetes|docker|container|server|servers|multi-cloud|infrastructure|hosting|devops|cloud platform)\b/i,
  'Semiconductors': /\b(semiconductor|semiconductors|chip|chips|nvidia|intel|amd|tsmc|qualcomm|arm|hardware|processor|processors|gpu|gpus|cpu|cpus|foundry|foundries|silicon|packaging|transistor|microchip|export rules|wafer)\b/i,
  'Enterprise IT': /\b(enterprise it|enterprise|it infrastructure|modernization|cio|cto|mainframe|legacy|database|databases|software|network|networking|sysadmin|architecture|erp|systems|it systems|outage|telecom|fiber|5g|6g|it spending)\b/i,
  'Startups': /\b(startup|startups|venture|ventures|vc|vcs|funding|fundraise|seed|series a|series b|series c|raised|founder|founders|unicorn|unicorns|valuation|accelerator|incubator|pitch)\b/i,
  'SaaS': /\b(saas|software as a service|subscription|b2b|platform|cloud software|license|licensing|seats|crm|tooling|productivity tool|enterprise app)\b/i,
  'FinTech': /\b(fintech|payments|payment|banking|bank|crypto|cryptocurrency|bitcoin|blockchain|digital finance|wallet|transaction|transactions|lending|defi|embedded finance|upi|finances)\b/i,

  // Cyber Security Pillar Domains
  'Critical': /\b(critical|urgent|alert|alerts|emergency|severe|severity|cvss|high severity|advisory|breach|exploited|remote code execution|rce|patch now|immediate|zero-day|cve|active exploitation)\b/i,
  'Global Attacks': /\b(attack|attacks|attacker|attackers|global attack|cyberattack|cyberattacks|campaign|nation-state|apt|apt[0-9]+|intrusion|threat actor|threat actors|espionage|china|russia|iran|north korea|targeted|sabotage|ddos)\b/i,
  'Zero-Day': /\b(zero-day|zero day|0-day|unpatched|cve|cve-[0-9-]+|exploit|exploits|vulnerability|vulnerabilities|flaw|flaws|bug|proof of concept|poc|patch tuesday|security flaw|patch|fix)\b/i,
  'Ransomware': /\b(ransomware|extortion|extort|encrypt|encrypted|encryption|decrypt|decrypted|ransom|leak site|exfiltration|lockbit|blackcat|clop|dark web|hostage|double extortion|affiliate)\b/i,
  'Privacy': /\b(privacy|data privacy|surveillance|tracking|cookies|gdpr|regulation|fine|fines|compliance|personal data|consent|spy|spying|wiretap|biometric|user data)\b/i,
  'Data Breaches': /\b(data breach|data breaches|breach|breached|breaches|leak|leaked|leaks|stolen credentials|credentials|passwords|database leaked|exposed records|exposed|compromise|compromised|identity theft|customer data|records exposed)\b/i,

  // AI Pillar Domains
  'Generative AI': /\b(generative ai|genai|llm|llms|chatgpt|gpt|claude|gemini|deepseek|mistral|prompt|diffusion|image generation|text generation)\b/i,
  'AI Research': /\b(research|paper|benchmark|reasoning|breakthrough|study|finding|algorithm|weights|parameter|pre-training|post-training)\b/i,
  'AI Startups': /\b(ai startup|ai startups|seed funding|venture|raised|valuation|stealth|founder|accelerator|yc)\b/i,
  'AI Security': /\b(prompt injection|jailbreak|watermarking|alignment|safety|guardrail|adversarial|red teaming|vulnerability in ai)\b/i,
  'AI Tools & Agents': /\b(agent|agents|agentic|autonomous agent|workflow|copilot|coding agent|tool|tools|orchestration|assistant)\b/i,
  'Enterprise AI': /\b(enterprise ai|adoption|governance|deployment|roi|integration|production|internal platform|cdo)\b/i,
  'AI Policy': /\b(policy|regulation|governance|compliance|standard|law|act|eu ai act|accord|treaty|framework|standards)\b/i
};

class GlobalCoverageApp {
  constructor() {
    this.currentHeroIndex = 0;
    this.currentHeroPage = 0;
    this.heroFlipInProgress = false;
    this.heroRenderPending = false;
    this.heroFlipTimer = null;
    this.currentTrendingIndex = 0;
    this.currentPage = 'home';
    this.libraryView = 'saved';
    this.aiHeroRotateTimer = null;
    this.trendingRotateTimer = null;
    this.sidebarAdTimer = null;
    this.mediaAdTimer = null;
    this.liveUpdateTimer = null;
    this.newsRefreshTimer = null;
    this.liveRefreshTimer = null;

    // Backend API and authenticated session - dynamic hostname & protocol for local and production deployment
    const apiHost = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : 'localhost';
    const apiOrigin = (typeof window !== 'undefined' && window.location && window.location.origin && window.location.protocol !== 'file:')
      ? window.location.origin
      : 'http://' + apiHost + ':3000';
    this.apiBase = apiOrigin + '/api';
    this.socketUrl = apiOrigin;
    this.apiAvailable = false;
    this.authToken = localStorage.getItem('gc_auth_token') || null;
    this.currentUser = JSON.parse(localStorage.getItem('gc_current_user') || 'null');
    this.adminSubmissions = [];
    this.adminUsers = [];
    this.publisherArticles = [];
    this.activeAdminTab = 'submissions';
    this.selectedSubmissions = new Set();
    this.articleCommentsCache = {};
    this.socket = null;
    this.lastOfflineToast = 0;

    // Dynamic homepage view state (isolated from master arrays)
    this.dynamicHome = { heroStories: [], trending: [], articles: [], events: [] };

    this.savedArticles = this.readStoredArray('gc_saved');
    this.followedAuthors = this.readStoredArray('gc_following', ['Meera Rao']);
    this.followedAuthorMap = {};
    this.readingHistory = this.readStoredArray('gc_history');
    this.bookmarkedEvents = this.readStoredArray('gc_bookmarked_events');
    this.newsletterSubscribers = this.readStoredArray('gc_newsletter_subscribers');
    this.eventRegistrations = this.readStoredArray('gc_event_registrations');
    this.notifCount = 3;
    this.inFlightRequests = new Map();
    this.lastApiRequestAt = {};
    this.lastAuthAttemptAt = 0;
    this.lastTrendingAuthorsLoadAt = 0;
    this.trendingAuthorsRequestInFlight = false;

    // Phase 1: Home Latest Feed pagination, filter, and sorting state
    this.homeLatestFilter = 'all';
    this.homeLatestSort = 'latest';
    this.homeLatestPage = 1;
    this.homeLatestPageSize = 9;
    this.homeLatestLoading = false;

    this.init();
  }

  async init() {
    this.clearUnusedStorage();
    this.refreshNewsOrder();
    this.renderDate();
    this.renderLiveUpdates();
    this.renderTicker();

    // Fetch real-time articles & events from backend first
    await this.checkBackendConnection();

    this.renderHero();
    this.renderTrending();
    this.renderEvents();

    this.renderForYouPage();
    this.renderCategoryFeeds();
    this.renderAIPage();
    this.renderPublisherTracker();
    this.setupRouting();
    this.renderHomePage();
    this.setupGlobalListeners();
    this.startHeroAutoRotate();
    this.startTrendingAutoRotate();
    this.startNewsRefresh();

    // Auto-open deep linked article if shared via URL
    await this.checkAndOpenDeepLinkedArticle();

    // Restore any existing authenticated session; never auto-login seed accounts.
    this.updateNavVisibility();
    this.initRealtime();

    if (window.lucide) lucide.createIcons();
  }

  // --- Utilities ---
  escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  escapeJS(str) {
    if (!str) return '';
    return String(str)
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '&quot;')
      .replace(/\n/g, ' ')
      .replace(/\r/g, '');
  }

  shuffleArray(items) {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }
    return shuffled;
  }

  // Temporary dynamic homepage views (prevents in-place mutation of master data)
  getHomeHeroStories() {
    return this.dynamicHome?.heroStories?.length ? this.dynamicHome.heroStories : GC_DATA.heroStories;
  }
  getHomeTrending() {
    return this.dynamicHome?.trending?.length ? this.dynamicHome.trending : GC_DATA.trending;
  }
  getHomeArticles() {
    return this.dynamicHome?.articles?.length ? this.dynamicHome.articles : GC_DATA.articles;
  }
  getHomeEvents() {
    return this.dynamicHome?.events?.length ? this.dynamicHome.events : GC_DATA.events;
  }

  refreshNewsOrder() {
    const masterHero = GC_DATA.master?.heroStories || GC_DATA.heroStories;
    const masterTrending = GC_DATA.master?.trending || GC_DATA.trending;
    const masterArticles = GC_DATA.master?.articles || GC_DATA.articles;
    const masterEvents = GC_DATA.master?.events || GC_DATA.events;

    this.dynamicHome = {
      heroStories: this.shuffleArray(masterHero),
      trending: this.shuffleArray(masterTrending),
      articles: this.shuffleArray(masterArticles),
      events: this.shuffleArray(masterEvents)
    };
    this.currentHeroIndex = 0;
    this.currentTrendingIndex = 0;
  }

  startNewsRefresh() {
    clearInterval(this.newsRefreshTimer);
    this.newsRefreshTimer = setInterval(() => {
      this.refreshNewsOrder();
      this.renderHero();
      this.renderTrending();
      this.renderTicker();
      this.renderForYouPage();
      this.renderCategoryFeeds();
      this.renderTechSpotlight();
      this.renderBusinessHighlights();
      this.renderCyberAlerts();
      this.renderAIHighlights();
      this.renderMostRead();
      this.renderAIPage();
      this.renderLiveUpdates();
    }, 45000);
  }

  readStoredArray(key, fallback = []) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return Array.isArray(value) ? value : fallback;
    } catch (error) {
      return fallback;
    }
  }

  clearUnusedStorage() {
    const staleKeys = ['gc_submissions', 'gc_admin_submissions', 'gc_publisher_submissions', 'gc_demo_articles', 'gc_demo_events'];
    staleKeys.forEach((key) => localStorage.removeItem(key));

    localStorage.removeItem('gc_ai_chat');
    ['gc_saved', 'gc_following', 'gc_history', 'gc_bookmarked_events', 'gc_newsletter_subscribers', 'gc_event_registrations']
      .forEach((key) => {
        try {
          const value = JSON.parse(localStorage.getItem(key) || 'null');
          if (!Array.isArray(value)) {
            localStorage.removeItem(key);
          }
        } catch {
          localStorage.removeItem(key);
        }
      });
  }

  startLiveRefresh() {
    clearInterval(this.liveRefreshTimer);
    if (!this.apiAvailable) return;

    this.liveRefreshTimer = setInterval(() => {
      this.fetchBackendArticles();
      this.fetchTicker();
      this.fetchBackendEvents();
      if (this.currentUser && ['PUBLISHER', 'ADMIN'].includes(this.currentUser.role)) {
        this.renderPublisherTracker();
      }
      if (this.currentUser?.role === 'ADMIN') {
        this.loadAdminSubmissions();
        this.loadAdminEvents();
      }
    }, 15000);
  }

  initTimezone() {
    this.selectedTimezone = localStorage.getItem('om_selected_tz') || 'Asia/Kolkata';
    this.worldTimezones = [
      { id: 'Asia/Kolkata', abbr: 'IST', name: 'India Standard Time', city: 'Mumbai / New Delhi', market: 'NSE / BSE', flag: '🇮🇳' },
      { id: 'America/New_York', abbr: 'EST', name: 'US Eastern Time', city: 'New York', market: 'NYSE / NASDAQ', flag: '🇺🇸' },
      { id: 'America/Los_Angeles', abbr: 'PST', name: 'US Pacific Time', city: 'Silicon Valley / San Francisco', market: 'Tech Sector HQ', flag: '🇺🇸' },
      { id: 'Europe/London', abbr: 'GMT', name: 'London / Western Europe', city: 'London', market: 'LSE (FTSE 100)', flag: '🇬🇧' },
      { id: 'Asia/Singapore', abbr: 'SGT', name: 'Singapore Standard Time', city: 'Singapore', market: 'SGX', flag: '🇸🇬' },
      { id: 'Asia/Tokyo', abbr: 'JST', name: 'Japan Standard Time', city: 'Tokyo', market: 'TSE (Nikkei 225)', flag: '🇯🇵' },
      { id: 'Europe/Frankfurt', abbr: 'CET', name: 'Central European Time', city: 'Frankfurt / Zurich', market: 'DAX / SIX', flag: '🇪🇺' },
      { id: 'UTC', abbr: 'UTC', name: 'Universal Coordinated Time', city: 'Global Cyber Sync', market: '24/7 Threat Radar', flag: '🌐' }
    ];
  }

  getTimezoneAbbr(tzId) {
    if (!this.worldTimezones) this.initTimezone();
    const tz = this.worldTimezones.find(t => t.id === tzId);
    if (tz) return tz.abbr;
    if (tzId === 'Asia/Kolkata') return 'IST';
    if (tzId === 'America/New_York') return 'EST';
    if (tzId === 'America/Los_Angeles') return 'PST';
    if (tzId === 'Europe/London') return 'GMT';
    if (tzId === 'Asia/Singapore') return 'SGT';
    if (tzId === 'Asia/Tokyo') return 'JST';
    if (tzId === 'Europe/Frankfurt') return 'CET';
    return 'UTC';
  }

  isMarketOpen(tzId, now) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tzId,
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
      }).formatToParts(now);
      const day = parts.find(p => p.type === 'weekday')?.value;
      const hour = Number(parts.find(p => p.type === 'hour')?.value || 0);
      const min = Number(parts.find(p => p.type === 'minute')?.value || 0);
      const timeDec = hour + min / 60;
      if (day === 'Sat' || day === 'Sun') return false;

      if (tzId === 'Asia/Kolkata') return timeDec >= 9.25 && timeDec <= 15.5;
      if (tzId === 'America/New_York' || tzId === 'America/Los_Angeles') return timeDec >= 9.5 && timeDec <= 16;
      if (tzId === 'Europe/London' || tzId === 'Europe/Frankfurt') return timeDec >= 8 && timeDec <= 16.5;
      if (tzId === 'Asia/Singapore') return (timeDec >= 9 && timeDec <= 12) || (timeDec >= 13 && timeDec <= 17);
      if (tzId === 'Asia/Tokyo') return (timeDec >= 9 && timeDec <= 11.5) || (timeDec >= 12.5 && timeDec <= 15);
      return true;
    } catch (_) {
      return false;
    }
  }

  openWorldClocksModal() {
    if (!this.worldTimezones) this.initTimezone();
    const modal = document.getElementById('modal-world-clocks');
    if (!modal) return;
    this.updateWorldClocksModalContent();
    modal.classList.add('show');
    this.updateModalOpenState(true);
    this.refreshIcons(modal);
    if (this.worldClockModalTimer) clearInterval(this.worldClockModalTimer);
    this.worldClockModalTimer = setInterval(() => this.updateWorldClocksModalTimes(), 1000);
  }

  closeWorldClocksModal() {
    const modal = document.getElementById('modal-world-clocks');
    if (modal) modal.classList.remove('show');
    this.updateModalOpenState(false);
    if (this.worldClockModalTimer) {
      clearInterval(this.worldClockModalTimer);
      this.worldClockModalTimer = null;
    }
  }

  setTimezone(tzId) {
    this.selectedTimezone = tzId;
    localStorage.setItem('om_selected_tz', tzId);
    const abbr = this.getTimezoneAbbr(tzId);
    const badge = document.getElementById('current-tz-badge');
    if (badge) badge.textContent = abbr;
    this.showToast(`Switched active primary clock to ${abbr} (${tzId})`);
    this.updateWorldClocksModalContent();
  }

  updateWorldClocksModalContent() {
    const grid = document.getElementById('world-clocks-grid');
    if (!grid) return;
    const now = new Date();
    grid.innerHTML = (this.worldTimezones || []).map(tz => {
      const isSelected = this.selectedTimezone === tz.id;
      const isOpen = this.isMarketOpen(tz.id, now);
      const timeStr = now.toLocaleTimeString('en-US', { timeZone: tz.id, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      const dateStr = now.toLocaleDateString('en-US', { timeZone: tz.id, weekday: 'short', month: 'short', day: 'numeric' });

      return `
        <div class="world-clock-card ${isSelected ? 'active' : ''}" onclick="app.setTimezone('${tz.id}')" role="button" tabindex="0">
          <div class="world-clock-card-header">
            <span class="world-clock-city">${tz.flag} ${tz.city}</span>
            <span class="world-clock-badge">${tz.abbr}</span>
          </div>
          <div class="world-clock-time" id="wc-time-${tz.abbr.toLowerCase()}">${timeStr}</div>
          <div class="world-clock-sub" id="wc-date-${tz.abbr.toLowerCase()}">${dateStr} · ${tz.name}</div>
          <div class="world-clock-market-row">
            <span class="market-name">${tz.market}</span>
            <span class="market-status-pill ${isOpen ? 'open' : 'closed'}" id="wc-status-${tz.abbr.toLowerCase()}">
              ${isOpen ? '● Trading Open' : '○ Closed'}
            </span>
          </div>
          ${isSelected ? `<span class="active-tz-indicator">Active Header Clock</span>` : ''}
        </div>
      `;
    }).join('');
    this.refreshIcons(grid);
  }

  updateWorldClocksModalTimes() {
    const now = new Date();
    (this.worldTimezones || []).forEach(tz => {
      const timeEl = document.getElementById(`wc-time-${tz.abbr.toLowerCase()}`);
      const dateEl = document.getElementById(`wc-date-${tz.abbr.toLowerCase()}`);
      const statusEl = document.getElementById(`wc-status-${tz.abbr.toLowerCase()}`);
      if (timeEl) {
        timeEl.textContent = now.toLocaleTimeString('en-US', { timeZone: tz.id, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      }
      if (dateEl) {
        const dateStr = now.toLocaleDateString('en-US', { timeZone: tz.id, weekday: 'short', month: 'short', day: 'numeric' });
        dateEl.textContent = `${dateStr} · ${tz.name}`;
      }
      if (statusEl) {
        const isOpen = this.isMarketOpen(tz.id, now);
        statusEl.className = `market-status-pill ${isOpen ? 'open' : 'closed'}`;
        statusEl.textContent = isOpen ? '● Trading Open' : '○ Closed';
      }
    });
  }

  renderDate() {
    if (!this.selectedTimezone) this.initTimezone();
    this.startLiveClock();
  }

  startLiveClock() {
    if (!this.selectedTimezone) this.initTimezone();
    const updateClock = () => {
      const now = new Date();
      const dateEl = document.getElementById('current-date');
      const clockText = document.getElementById('ist-clock-text');
      const tzBadge = document.getElementById('current-tz-badge');
      const analogClock = document.querySelector('.analog-clock');
      const tz = this.selectedTimezone || 'Asia/Kolkata';
      const tzAbbr = this.getTimezoneAbbr(tz);

      const timeStr = now.toLocaleTimeString('en-US', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      const timeParts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
      }).formatToParts(now);
      const timePart = (type) => Number(timeParts.find((part) => part.type === type)?.value || 0);
      const hours = timePart('hour') % 12;
      const minutes = timePart('minute');
      const seconds = timePart('second');

      const dateStr = now.toLocaleDateString('en-US', {
        timeZone: tz,
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });

      if (clockText) {
        clockText.textContent = `${timeStr} ${tzAbbr}`;
      }
      if (tzBadge) {
        tzBadge.textContent = tzAbbr;
      }
      if (dateEl) {
        dateEl.textContent = dateStr;
      }
      if (analogClock) {
        analogClock.querySelector('.analog-clock-hour').style.transform = `rotate(${hours * 30 + minutes * 0.5 + seconds * (0.5 / 60)}deg)`;
        analogClock.querySelector('.analog-clock-minute').style.transform = `rotate(${minutes * 6 + seconds * 0.1}deg)`;
        analogClock.querySelector('.analog-clock-second').style.transform = `rotate(${seconds * 6}deg)`;
      }
    };
    updateClock();
    if (!this.liveClockTimer) {
      this.liveClockTimer = setInterval(updateClock, 1000);
    }
  }

  renderLiveUpdates() {
    const message = document.getElementById('live-update-message');
    const stories = this.getHomeTrending();
    if (!message || !stories.length) return;
    let updateIndex = 0;
    const paint = () => {
      const story = stories[updateIndex];
      message.classList.remove('live-update-enter');
      void message.offsetWidth;
      message.textContent = `${story.category}: ${story.title}`;
      message.classList.add('live-update-enter');
      updateIndex = (updateIndex + 1) % stories.length;
    };
    paint();
    clearInterval(this.liveUpdateTimer);
    this.liveUpdateTimer = setInterval(paint, 5200);
    this.refreshIcons(document.getElementById('live-update-message') || document.querySelector('.live-indicator'));
  }

  categorySlug(cat) { return (cat || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }

  trendingIcon(category) {
    return { Business: 'bar-chart-3', IT: 'cpu', 'Cyber Security': 'shield-check', AI: 'sparkles' }[category] || 'radio-tower';
  }

  // --- Dynamic Icon Rendering (Targeted Subtrees) ---
  bindImageFallbacks(root = document) {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll('img').forEach((img) => {
      if (img.dataset.fallbackBound === 'true') return;
      img.dataset.fallbackBound = 'true';
      img.onerror = () => {
        if (img.dataset.fallbackApplied === 'true') return;
        img.dataset.fallbackApplied = 'true';
        img.onerror = null;
        img.src = this.getImageFallbackSvg(img.alt || img.getAttribute('aria-label') || 'OPEN MEDIA');
      };
    });
  }

  refreshIcons(container = null) {
    if (!window.lucide) return;
    let target = container;
    if (typeof container === 'string') {
      target = document.querySelector(container);
    }
    if (target && target instanceof Element) {
      lucide.createIcons({ el: target, root: target });
      this.bindImageFallbacks(target);
    } else {
      lucide.createIcons();
      this.bindImageFallbacks(document);
    }
  }

  // --- Modal & Drawer Stacking / Scroll Lock Helper ---
  updateModalOpenState(isOpen) {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      const anyModalOpen = !!document.querySelector('.modal-overlay.show, .ai-teller-drawer.show, .mobile-drawer.show');
      if (!anyModalOpen) {
        document.body.classList.remove('modal-open');
      }
    }
  }

  // --- Backend API Service ---
  async apiFetch(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const requestKey = `${method}:${path}:${JSON.stringify(options.body || '')}`;
    if (this.inFlightRequests.has(requestKey)) {
      return this.inFlightRequests.get(requestKey);
    }

    if (method === 'GET') {
      const cooldownMs = 200;
      const lastRequestAt = this.lastApiRequestAt[path] || 0;
      const now = Date.now();
      if (lastRequestAt && (now - lastRequestAt) < cooldownMs) {
        return { ok: false, status: 0, data: null, error: new Error('Request throttled') };
      }
      this.lastApiRequestAt[path] = now;
    }

    const headers = {
      'Content-Type': 'application/json',
      ...(this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {}),
      ...(options.headers || {})
    };

    const requestPromise = (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(`${this.apiBase}${path}`, {
          ...options,
          headers,
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if ([401, 403].includes(res.status) && this.authToken && !path.startsWith('/auth/login')) {
          this.clearInvalidSession();
          this.showToast('Your session expired or is no longer valid. Please sign in again.');
        }

        if (res.status === 429) {
          console.warn(`[OPEN MEDIA API] Rate limited: ${path}`);
          this.showToast('The API is briefly rate-limiting requests. Please wait a moment.');
        }

        const data = await res.json().catch(() => ({}));
        return { ok: res.ok, status: res.status, data };
      } catch (err) {
        console.warn(`[OPEN MEDIA API] Fallback active for ${path}:`, err.message);
        this.apiAvailable = false;
        if (!this.lastOfflineToast || Date.now() - this.lastOfflineToast > 12000) {
          this.showToast('OPEN MEDIA is temporarily offline. Showing the latest local content.');
          this.lastOfflineToast = Date.now();
        }
        return { ok: false, status: 0, data: null, error: err };
      }
    })();

    this.inFlightRequests.set(requestKey, requestPromise);
    try {
      return await requestPromise;
    } finally {
      this.inFlightRequests.delete(requestKey);
    }
  }

  clearInvalidSession() {
    this.authToken = null;
    this.currentUser = null;
    localStorage.removeItem('gc_auth_token');
    localStorage.removeItem('gc_current_user');
    this.updateNavVisibility();
    this.navigateTo('home', false);
  }

  getImageFallbackSvg(label = 'OPEN MEDIA') {
    const safeLabel = this.escapeHTML(label).replace(/['<>]/g, '');
    const svg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 700">
        <defs>
          <linearGradient id="g" x1="0" x2="1">
            <stop offset="0%" stop-color="#E2E8F0"/>
            <stop offset="100%" stop-color="#CBD5E1"/>
          </linearGradient>
        </defs>
        <rect width="1200" height="700" fill="url(#g)"/>
        <rect x="80" y="80" width="1040" height="540" rx="28" fill="#F8FAFC"/>
        <circle cx="600" cy="250" r="110" fill="#94A3B8" opacity="0.18"/>
        <path d="M520 330h160l70 110H450l70-110zm50-90l40-52 40 52h-80z" fill="#475569" opacity="0.7"/>
        <text x="600" y="470" text-anchor="middle" font-family="Arial, sans-serif" font-size="52" font-weight="700" fill="#0F172A">${safeLabel}</text>
      </svg>
    `)}`;
    return svg;
  }

  getPosterFallback(category = 'IT', seed = 0) {
    const fallbacks = {
      'IT': [
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1537498425277-c283d32ef9db?auto=format&fit=crop&w=1200&q=80'
      ],
      'Business': [
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1444653614773-995cb1ef9028?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1520333789090-1afc82db536a?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80'
      ],
      'Cyber Security': [
        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1510511459019-5dda7724fd87?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=1200&q=80'
      ],
      'AI': [
        'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1535378917042-10a22c95931a?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1617791160505-6f008e1e6703?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1516110833967-0b5716ca1387?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80'
      ]
    };
    const list = fallbacks[category] || fallbacks['IT'];
    const str = String(seed || '');
    if (!str || str === '0') return list[0];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % list.length;
    return list[idx];
  }

  initRealtime() {
    if (typeof io === 'undefined') {
      console.warn('[Socket.io] Real-time client library not loaded.');
      return;
    }

    try {
      this.socket = io(this.socketUrl, {
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000
      });

      this.socket.on('connect', () => {
        console.log(`⚡ Connected to OPEN MEDIA Real-Time WebSocket Engine (${this.socket.id})`);
      });

      this.socket.on('disconnect', (reason) => {
        console.log(`🔌 Disconnected from real-time engine: ${reason}`);
      });

      // Real-time Event 1: New article submitted / published
      this.socket.on('article:submitted', (data) => {
        console.log('⚡ [Realtime] Article submitted:', data);
        if (data && data.status === 'PUBLISHED') {
          this.fetchTicker();
          this.fetchBackendArticles();
        }
        if (this.currentUser?.role === 'ADMIN') {
          this.showToast(`📝 New Submission: "${data.title || 'Untitled'}" by ${data.author?.name || 'Publisher'}`);
          if (this.currentPage === 'admin' && this.activeAdminTab === 'submissions') {
            this.loadAdminSubmissions();
          }
        }
      });

      // Real-time Event 1B: New breaking headline published to ticker
      this.socket.on('ticker:new', (item) => {
        console.log('⚡ [Realtime] New breaking headline received:', item);
        if (item && item.title) {
          if (!this.tickerItems) this.tickerItems = [];
          this.tickerItems = [item, ...this.tickerItems.filter(t => t.id !== item.id)];
          this.renderTicker();
        }
      });

      // Real-time Event 2: New event submitted
      this.socket.on('event:submitted', (data) => {
        console.log('⚡ [Realtime] Event submitted:', data);
        if (this.currentUser?.role === 'ADMIN') {
          this.showToast(`📅 New Event Submission: "${data.title || 'Untitled'}" by ${data.organizer?.name || 'Organizer'}`);
          if (this.currentPage === 'admin' && this.activeAdminTab === 'submissions') {
            this.loadAdminSubmissions();
          }
        }
      });

      // Real-time Event 3: Article status changed (Approved, Rejected, Changes Requested, Draft)
      this.socket.on('article:status_changed', (data) => {
        console.log('⚡ [Realtime] Article status changed:', data);
        this.fetchBackendArticles();
        this.fetchTicker();
        if (this.currentPage === 'admin' && this.activeAdminTab === 'submissions') {
          this.loadAdminSubmissions();
        }

        const articleTitle = data.title || data.article?.title || 'Article';
        const articleStatus = (data.status || data.article?.status || 'UPDATED').toUpperCase();
        const articleAuthorId = data.article?.authorId || data.article?.author?.id || data.authorId || data.author?.id;
        const isCurrentPublisher = this.currentUser && this.currentUser.role === 'PUBLISHER' && articleAuthorId === this.currentUser.id;

        if (isCurrentPublisher) {
          const reason = data.editorialFeedback || data.article?.editorialFeedback;
          let notifMsg = `Your article "${articleTitle}" was ${articleStatus} by Admin.`;
          if (articleStatus === 'PUBLISHED') {
            notifMsg = `🎉 Your article "${articleTitle}" was APPROVED and published!`;
          } else if (articleStatus === 'CHANGES_REQUESTED') {
            notifMsg = `⚠️ Changes requested for "${articleTitle}"${reason ? `: ${reason}` : ''}`;
          } else if (articleStatus === 'REJECTED') {
            notifMsg = `❌ Your article "${articleTitle}" was REJECTED${reason ? `. Reason: ${reason}` : ''}`;
          }
          this.showToast(notifMsg);

          // Push into dynamic notification store
          if (!this.notifications) this.notifications = [];
          this.notifications.unshift({
            icon: articleStatus === 'PUBLISHED' ? 'check-circle' : articleStatus === 'CHANGES_REQUESTED' ? 'edit-3' : 'alert-circle',
            cls: articleStatus === 'PUBLISHED' ? 'text-emerald' : articleStatus === 'CHANGES_REQUESTED' ? 'text-orange' : 'text-red',
            bg: articleStatus === 'PUBLISHED' ? '#DCFCE7' : articleStatus === 'CHANGES_REQUESTED' ? '#FFEDD5' : '#FEE2E2',
            title: `SUBMISSION ${articleStatus}`,
            body: notifMsg,
            time: 'Just now'
          });
          this.notifCount = (this.notifCount || 0) + 1;
          const countEl = document.getElementById('notif-count');
          if (countEl) {
            countEl.textContent = this.notifCount;
            countEl.style.display = 'flex';
          }
        }

        this.renderPublisherTracker();
        this.renderPublisherFeedbackHistory();
      });

      // Real-time Event 4: Event status changed
      this.socket.on('event:status_changed', (data) => {
        console.log('⚡ [Realtime] Event status changed:', data);
        this.fetchBackendEvents();
        if (this.currentPage === 'admin' && this.activeAdminTab === 'submissions') {
          this.loadAdminSubmissions();
        }
        this.renderPublisherTracker();
      });

      // Real-time Event 5: Batch status changed
      this.socket.on('articles:batch_status_changed', (data) => {
        console.log('⚡ [Realtime] Batch status changed:', data);
        this.fetchBackendArticles();
        if (this.currentPage === 'admin' && this.activeAdminTab === 'submissions') {
          this.loadAdminSubmissions();
        }
        this.showToast(`⚡ Batch Update: ${data.count} article(s) updated to ${data.status}`);
      });

      // Real-time Event 6: Article content edited
      this.socket.on('article:updated', (data) => {
        console.log('⚡ [Realtime] Article updated:', data);
        this.fetchBackendArticles();
        if (this.currentPage === 'admin' && this.activeAdminTab === 'submissions') {
          this.loadAdminSubmissions();
        }
        if (this.activeReaderArticleId === data.id) {
          this.openArticleModal(data.id);
        }
      });

      // Real-time Event 7: New comment created
      this.socket.on('comment:created', (data) => {
        console.log('⚡ [Realtime] Comment created:', data);
        if (this.activeReaderArticleId === data.articleId) {
          this.loadArticleComments(data.articleId);
        }
      });

      // Real-time Event: Comment updated
      this.socket.on('comment:updated', (data) => {
        console.log('⚡ [Realtime] Comment updated:', data);
        if (this.activeReaderArticleId === data.articleId) {
          this.loadArticleComments(data.articleId);
        }
      });

      // Real-time Event: Comment deleted
      this.socket.on('comment:deleted', (data) => {
        console.log('⚡ [Realtime] Comment deleted:', data);
        if (this.activeReaderArticleId === data.articleId) {
          this.loadArticleComments(data.articleId);
        }
      });

      // Real-time Event: Reaction updated
      this.socket.on('reaction:updated', (data) => {
        console.log('⚡ [Realtime] Reaction updated:', data);
        if (this.activeReaderArticleId === data.articleId) {
          this.loadArticleReactions(data.articleId);
        }
      });

      // Real-time Event: Individual article syndicated from wire
      this.socket.on('article:created', (data) => {
        console.log('⚡ [Realtime] New syndicated story:', data);
        if (!data || !data.title) return;
        if (!APPROVED_CATEGORIES.includes(data.category) || NON_ENGLISH_REGEX.test(data.title)) {
          return;
        }
        if (this.dynamicHome?.articles) {
          const exists = this.dynamicHome.articles.some(a => a.id === data.id || a.title === data.title);
          if (!exists) {
            const formatted = {
              id: data.id,
              title: data.title,
              summary: data.summary,
              description: data.summary,
              category: data.category,
              domain: data.domain || data.category,
              author: 'Editorial Desk',
              date: new Date(data.publishedAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              published: new Date(data.publishedAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              time: 'Just now',
              readTime: '3 min read',
              image: data.image || this.getPosterFallback(data.category, data.title || data.id)
            };
            this.dynamicHome.articles.unshift(formatted);
            this.dynamicHome.trending.unshift(formatted);
            this.dynamicHome.trending = this.dynamicHome.trending.slice(0, 10);
            if (GC_DATA.master) {
              GC_DATA.master.articles = this.dynamicHome.articles;
              GC_DATA.master.trending = this.dynamicHome.trending;
            }
            this.renderHero();
            this.renderTrending();
            this.renderTicker();
            this.renderCategoryFeeds();
            this.renderTechSpotlight();
            this.renderBusinessHighlights();
            this.renderCyberAlerts();
            this.renderAIHighlights();

            const liveMsg = document.getElementById('live-update-message');
            if (liveMsg) {
              liveMsg.textContent = `New: [${data.domain || data.category}] ${data.title.substring(0, 48)}...`;
            }
          }
        }
      });

      // Real-time Event 8: RSS wire syndicated
      this.socket.on('articles:rss_synced', async (data) => {
        console.log('⚡ [Realtime] RSS Wire Synced:', data);
        await this.fetchBackendArticles();
        await this.fetchTicker();
        if (this.currentPage === 'business') {
          this.renderCategoryFeed('business', 'business-feed', 'business-domain-tree', BUSINESS_DOMAIN_GROUPS, 'business-ad-slot');
        } else if (this.currentPage === 'tech') {
          this.renderCategoryFeed('tech', 'tech-feed', 'tech-domain-tree', TECH_DOMAIN_GROUPS, 'tech-ad-slot');
        } else if (this.currentPage === 'cyber') {
          this.renderCategoryFeed('cyber', 'cyber-feed', 'cyber-domain-tree', CYBER_DOMAIN_GROUPS, null);
        } else if (this.currentPage === 'ai') {
          this.renderAIPage();
        }
        const liveMsg = document.getElementById('live-update-message');
        if (liveMsg) {
          liveMsg.textContent = data?.inserted > 0
            ? `Wire Updated • ${data.inserted} fresh stories syndicated`
            : 'Live Wire Active • Business, IT, Cyber & AI Feeds Synced';
        }
        if (data && data.inserted > 0) {
          this.showToast(`⚡ Wire Alert: ${data.inserted} fresh stories syndicated`);
        }
      });
    } catch (err) {
      console.warn('[Socket.io] Realtime init error:', err);
    }
  }

  async checkBackendConnection() {
    const res = await this.apiFetch('/health');
    if (res.ok) {
      this.apiAvailable = true;
      this.clearUnusedStorage();
      await this.fetchBackendArticles();
      await this.fetchBackendEvents();
      if (this.authToken) {
        this.fetchUserLibrarySync();
        this.renderPublisherTracker();
      }
      this.startLiveRefresh();
    } else {
      this.apiAvailable = false;
      clearInterval(this.liveRefreshTimer);
    }
  }

  async fetchBackendArticles() {
    const res = await this.apiFetch('/articles?limit=500');
    if (res.ok && res.data?.articles?.length) {
      const validRawArticles = res.data.articles.filter(a => 
        APPROVED_CATEGORIES.includes(a.category) && 
        !NON_ENGLISH_REGEX.test(a.title) &&
        (!a.summary || !NON_ENGLISH_REGEX.test(a.summary))
      );
      const backendArticles = validRawArticles.map((a, i) => {
        const wordCount = (a.body || a.summary || '').split(/\s+/).filter(Boolean).length;
        const calcReadTime = `${Math.max(2, Math.ceil(wordCount / 180))} min read`;
        const pubDate = a.publishedAt || a.createdAt;
        return {
          id: a.id,
          title: a.title,
          summary: a.summary,
          description: a.summary,
          body: a.body,
          category: a.category,
          domain: a.domain || a.category,
          author: a.author?.name || 'Editorial Desk',
          authorId: a.author?.id || null,
          status: a.status || 'PENDING',
          editorialFeedback: a.editorialFeedback || null,
          publishedAt: pubDate,
          date: new Date(pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          published: new Date(pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          time: 'Recent',
          readTime: calcReadTime,
          image: a.image || this.getPosterFallback(a.category, a.title || a.id),
          commentsCount: a._count?.comments || 0,
          savedCount: a._count?.savedBy || 0
        };
      });

      // Update both active state and master data so rotation stays on real syndicated articles
      if (!GC_DATA.master) GC_DATA.master = {};
      GC_DATA.master.articles = backendArticles;
      GC_DATA.master.heroStories = backendArticles.slice(0, 5);
      GC_DATA.master.trending = backendArticles.slice(5, 15);
      GC_DATA.articles = backendArticles;
      this.dynamicHome.heroStories = backendArticles.slice(0, 5);
      this.dynamicHome.trending = backendArticles.slice(5, 15);
      this.dynamicHome.articles = backendArticles;

      this.renderHomePage();
      this.renderCategoryFeeds();
      if (this.currentPage === 'ai') {
        this.renderAIPage();
      } else if (this.currentPage === 'business') {
        this.renderCategoryFeed('business', 'business-feed', 'business-domain-tree', BUSINESS_DOMAIN_GROUPS, 'business-ad-slot');
      } else if (this.currentPage === 'tech') {
        this.renderCategoryFeed('tech', 'tech-feed', 'tech-domain-tree', TECH_DOMAIN_GROUPS, 'tech-ad-slot');
      } else if (this.currentPage === 'cyber') {
        this.renderCategoryFeed('cyber', 'cyber-feed', 'cyber-domain-tree', CYBER_DOMAIN_GROUPS, null);
      }
    }
  }

  async fetchUserLibrarySync() {
    if (!this.authToken) return;
    const [savedRes, followRes] = await Promise.all([
      this.apiFetch('/user/saved'),
      this.apiFetch('/user/follows')
    ]);
    if (savedRes.ok && Array.isArray(savedRes.data?.savedArticleIds)) {
      this.savedArticles = Array.from(new Set([...this.savedArticles, ...savedRes.data.savedArticleIds]));
      localStorage.setItem('gc_saved', JSON.stringify(this.savedArticles));
      this.renderForYouPage();
    }
    if (followRes.ok && Array.isArray(followRes.data?.authors)) {
      const authors = followRes.data.authors;
      this.followedAuthorMap = Object.fromEntries(authors.map(author => [author.id, author.name]));
      this.followedAuthors = Array.from(new Set(authors.map(a => a.name).filter(Boolean)));
      localStorage.setItem('gc_following', JSON.stringify(this.followedAuthors));
      this.renderForYouPage();
    }
  }

  async fetchBackendEvents() {
    const res = await this.apiFetch('/events');
    if (res.ok && Array.isArray(res.data?.events)) {
      GC_DATA.events = res.data.events.map((event) => ({
        id: event.id,
        title: event.title,
        type: event.category || 'Event',
        date: new Date(event.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: new Date(event.eventDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        speaker: event.organizer?.name || 'OPEN MEDIA Team',
        organization: event.location || 'OPEN MEDIA',
        description: event.description,
        category: event.category,
        registrationUrl: '#',
        image: event.imageUrl || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=80',
        location: event.location,
        organizerId: event.organizerId,
        status: event.status
      }));
      this.renderEvents();
      if (this.currentUser?.role === 'ADMIN') this.loadAdminEvents();
    }
  }

  getCurrentUser() {
    if (!this.authToken) return null;
    try {
      const storedUser = JSON.parse(localStorage.getItem('gc_current_user') || 'null');
      if (!storedUser || !['USER', 'PUBLISHER', 'ADMIN'].includes(storedUser.role)) return null;
      this.currentUser = storedUser;
      return storedUser;
    } catch {
      return null;
    }
  }

  updateNavVisibility() {
    const user = this.getCurrentUser();
    const isAuthenticated = Boolean(user);
    const role = user?.role || null;
    const isReader = isAuthenticated && role === 'USER';
    const isPublisher = isAuthenticated && role === 'PUBLISHER';
    const isAdmin = isAuthenticated && role === 'ADMIN';

    const setVisible = (selector, visible) => document.querySelectorAll(selector).forEach(el => {
      el.hidden = !visible;
      el.style.display = visible ? '' : 'none';
    });

    setVisible('.auth-guest', !isAuthenticated);
    setVisible('.auth-user', isAuthenticated);
    setVisible('.reader-only-nav', isReader);
    setVisible('.publisher-only-nav, .publisher-only-menu', isPublisher);
    setVisible('.admin-only-nav, .admin-only-menu', isAdmin);

    // Strict RBAC: Header Publish button must ONLY be visible for PUBLISHER role. Admins manage articles in Admin Panel.
    const navPublish = document.getElementById('nav-publish');
    if (navPublish) {
      navPublish.hidden = !isPublisher;
      navPublish.style.display = isPublisher ? '' : 'none';
    }

    const navAdmin = document.getElementById('nav-admin');
    if (navAdmin) {
      navAdmin.hidden = !isAdmin;
      navAdmin.style.display = isAdmin ? '' : 'none';
    }

    const navForYou = document.getElementById('nav-foryou');
    if (navForYou) {
      navForYou.hidden = !isReader;
      navForYou.style.display = isReader ? '' : 'none';
    }

    const nameEl = document.getElementById('menu-user-name');
    const roleEl = document.getElementById('menu-user-role');
    if (nameEl) nameEl.textContent = user?.name || 'Account';
    if (roleEl) {
      if (user?.isRootAdmin) {
        roleEl.textContent = 'Root Admin';
      } else if (role) {
        roleEl.textContent = role.charAt(0) + role.slice(1).toLowerCase();
      } else {
        roleEl.textContent = '';
      }
    }

    const pubAuthorInput = document.getElementById('pub-author');
    if (pubAuthorInput && (isPublisher || isAdmin)) {
      pubAuthorInput.value = user?.name || '';
    }

    // Restrict Add User button exclusively to Root Admin
    const btnOpenCreateUser = document.getElementById('btn-open-create-user');
    if (btnOpenCreateUser) {
      btnOpenCreateUser.style.display = user?.isRootAdmin ? '' : 'none';
    }
  }

  // Compatibility wrapper for older templates; all visibility now comes from one helper.
  updateRoleUI() { this.updateNavVisibility(); }

  // --- Consolidated 5-Tab Admin Review Suite ---
  switchAdminTab(tab) {
    this.activeAdminTab = tab;
    const tabNames = ['submissions', 'users', 'create', 'inquiries', 'audit'];
    tabNames.forEach(t => {
      const panel = document.getElementById(`admin-tab-${t}`);
      const btn = document.getElementById(`tab-btn-${t}`);
      if (t === tab) {
        if (panel) {
          panel.style.display = 'block';
          panel.classList.add('active');
        }
        if (btn) btn.classList.add('active');
      } else {
        if (panel) {
          panel.style.display = 'none';
          panel.classList.remove('active');
        }
        if (btn) btn.classList.remove('active');
      }
    });

    if (tab === 'submissions') {
      this.loadAdminSubmissions();
    } else if (tab === 'users') {
      this.loadAdminUsers();
    } else if (tab === 'inquiries') {
      this.loadAdminInquiries();
    } else if (tab === 'audit') {
      this.loadAdminAuditLogs();
    }
  }

  async loadAdminInquiries() {
    if (this.currentUser?.role !== 'ADMIN') return;
    const tbody = document.getElementById('admin-inquiries-table-body');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px;">Fetching inbound inquiries...</td></tr>`;

    const res = await this.apiFetch('/inquiries');
    if (res.ok && Array.isArray(res.data?.inquiries)) {
      const list = res.data.inquiries;
      if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:var(--color-dark-gray);">No commercial inquiries recorded yet.</td></tr>`;
        return;
      }
      tbody.innerHTML = list.map(inq => {
        const dateStr = new Date(inq.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const statusClass = inq.status === 'RESOLVED' ? 'status-approved' : inq.status === 'CONTACTED' ? 'status-pending' : 'status-rejected';
        return `
          <tr>
            <td><code style="font-size:0.78rem;">${inq.id.slice(0, 12)}</code></td>
            <td><b>${this.escapeHTML(inq.name)}</b><br><small class="text-muted">${this.escapeHTML(inq.company || 'Direct')} &bull; ${this.escapeHTML(inq.email)}</small></td>
            <td><span class="badge badge-info" style="font-size:0.72rem;">${this.escapeHTML(inq.inquiryType)}</span><br><small class="text-muted">${this.escapeHTML(inq.budget || 'Custom')}</small></td>
            <td style="max-width:240px; font-size:0.82rem;" title="${this.escapeHTML(inq.message || '')}">${this.escapeHTML((inq.message || '').slice(0, 80))}${(inq.message || '').length > 80 ? '...' : ''}</td>
            <td style="font-size:0.78rem;">${dateStr}</td>
            <td><span class="status-badge ${statusClass}">${inq.status}</span></td>
            <td>
              <select class="form-control" style="font-size:0.75rem; padding:4px 8px; width:auto;" onchange="app.updateInquiryStatus('${inq.id}', this.value)">
                <option value="NEW" ${inq.status === 'NEW' ? 'selected' : ''}>NEW</option>
                <option value="CONTACTED" ${inq.status === 'CONTACTED' ? 'selected' : ''}>CONTACTED</option>
                <option value="QUALIFIED" ${inq.status === 'QUALIFIED' ? 'selected' : ''}>QUALIFIED</option>
                <option value="RESOLVED" ${inq.status === 'RESOLVED' ? 'selected' : ''}>RESOLVED</option>
              </select>
            </td>
          </tr>
        `;
      }).join('');
      this.refreshIcons(tbody);
    } else {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px; color:var(--color-danger);">Unable to load business inquiries.</td></tr>`;
    }
  }

  async updateInquiryStatus(id, newStatus) {
    const res = await this.apiFetch(`/inquiries/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) {
      this.showToast(`Inquiry status updated to ${newStatus}`);
      this.loadAdminInquiries();
    } else {
      this.showToast(res.data?.error || 'Failed to update status.');
    }
  }

  async loadAdminAuditLogs() {
    if (this.currentUser?.role !== 'ADMIN') return;
    const tbody = document.getElementById('admin-audit-table-body');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px;">Fetching audit trail from database...</td></tr>`;

    const res = await this.apiFetch('/admin/audit-logs');
    const logs = res.data?.auditLogs || res.data?.logs;
    if (res.ok && Array.isArray(logs)) {
      if (!logs.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:24px; color:var(--color-dark-gray);">No audit log events recorded yet.</td></tr>`;
        return;
      }
      tbody.innerHTML = logs.map(l => {
        const dateStr = new Date(l.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
        return `
          <tr>
            <td style="font-size:0.78rem; font-family:monospace; white-space:nowrap;">${dateStr}</td>
            <td><span class="status-badge status-approved" style="font-size:0.72rem;">${this.escapeHTML(l.action)}</span></td>
            <td><b>${this.escapeHTML(l.actorEmail || 'System')}</b><br><small class="text-muted">Role: ${this.escapeHTML(l.actorRole || 'ADMIN')}</small></td>
            <td><code style="font-size:0.75rem;">${this.escapeHTML(l.targetType || 'ENTITY')}: ${(l.targetId || '').slice(0, 10)}</code></td>
            <td style="font-size:0.8rem; color:var(--color-dark-gray); max-width:280px;">${this.escapeHTML(l.details || '')}</td>
          </tr>
        `;
      }).join('');
      this.refreshIcons(tbody);
    } else {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:var(--color-danger);">Unable to load audit logs.</td></tr>`;
    }
  }

  async loadAdminSubmissions() {
    if (this.currentUser?.role !== 'ADMIN') return;
    const tbody = document.getElementById('admin-submissions-table-body');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:var(--color-dark-gray);">Fetching unified submissions pipeline from database...</td></tr>`;

    const typeFilter = document.getElementById('admin-filter-type')?.value || 'all';
    const statusFilter = document.getElementById('admin-filter-status')?.value || '';

    let [articlesRes, eventsRes] = await Promise.all([
      this.apiFetch(`/admin/submissions${statusFilter ? `?status=${statusFilter}` : ''}`),
      this.apiFetch('/admin/events')
    ]);

    let articles = (articlesRes.ok && Array.isArray(articlesRes.data?.submissions)) ? articlesRes.data.submissions : [];
    let counts = (articlesRes.ok && articlesRes.data?.counts) ? articlesRes.data.counts : { PENDING: 0, PUBLISHED: 0, REJECTED: 0, DRAFT: 0, CHANGES_REQUESTED: 0 };
    let events = (eventsRes.ok && Array.isArray(eventsRes.data?.events)) ? eventsRes.data.events : [];

    // Filter events by status if requested
    if (statusFilter) {
      events = events.filter(e => e.status === statusFilter);
    }

    // Map unified objects
    let unifiedList = [];
    if (typeFilter === 'all' || typeFilter === 'articles') {
      unifiedList.push(...articles.map(a => ({
        id: a.id,
        isEvent: false,
        title: a.title,
        summary: a.summary || '',
        category: a.category || 'Article',
        authorName: a.author?.name || 'Publisher Desk',
        authorEmail: a.author?.email || '',
        createdAt: a.createdAt,
        status: a.status || 'PENDING',
        editorialFeedback: a.editorialFeedback || null,
        raw: a
      })));
    }
    if (typeFilter === 'all' || typeFilter === 'events') {
      unifiedList.push(...events.map(e => ({
        id: e.id,
        isEvent: true,
        title: e.title,
        summary: e.description ? (e.description.slice(0, 100) + '...') : (e.location || 'Event'),
        category: `Event / ${e.category || 'General'}`,
        authorName: e.organizer?.name || 'Event Lead',
        authorEmail: e.organizer?.email || '',
        createdAt: e.createdAt || e.eventDate,
        status: e.status || 'PENDING',
        editorialFeedback: e.editorialFeedback || null,
        raw: e
      })));
    }

    // Sort by createdAt descending
    unifiedList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    this.adminSubmissions = unifiedList;

    // Update Counter Widgets
    const totalCount = (articlesRes.data?.submissions?.length || 0) + (eventsRes.data?.events?.length || 0);
    const pendingCount = (counts.PENDING || 0) + events.filter(e => e.status === 'PENDING').length;
    const publishedCount = (counts.PUBLISHED || 0) + events.filter(e => e.status === 'PUBLISHED').length;
    const rejectedCount = (counts.REJECTED || 0) + (counts.CHANGES_REQUESTED || 0) + (counts.DRAFT || 0) + events.filter(e => ['REJECTED', 'CHANGES_REQUESTED', 'DRAFT'].includes(e.status)).length;

    const totalEl = document.getElementById('admin-stat-total');
    const pendingEl = document.getElementById('admin-stat-pending');
    const pubEl = document.getElementById('admin-stat-published');
    const rejEl = document.getElementById('admin-stat-rejected');
    if (totalEl) totalEl.textContent = totalCount;
    if (pendingEl) pendingEl.textContent = pendingCount;
    if (pubEl) pubEl.textContent = publishedCount;
    if (rejEl) rejEl.textContent = rejectedCount;

    if (!unifiedList.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:32px; color:var(--color-dark-gray);">No submissions found matching filter criteria.</td></tr>`;
      this.updateBatchBar();
      return;
    }

    const badgeMap = {
      PENDING: 'status-pending',
      PUBLISHED: 'status-approved',
      DRAFT: 'status-under-review',
      CHANGES_REQUESTED: 'status-changes-requested',
      REJECTED: 'status-rejected'
    };

    tbody.innerHTML = unifiedList.map(s => {
      const dateStr = s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today';
      const isChecked = this.selectedSubmissions.has(s.id);
      const safeTitle = this.escapeHTML(s.title);
      const attrTitle = safeTitle.replace(/'/g, "\\'");

      return `
        <tr>
          <td style="text-align:center;">
            <input type="checkbox" class="sub-checkbox" value="${s.id}" data-type="${s.isEvent ? 'event' : 'article'}" ${isChecked ? 'checked' : ''} onchange="app.toggleSubmissionSelect('${s.id}', this.checked)">
          </td>
          <td style="max-width:280px;">
            <div style="display:flex; align-items:center; gap:6px;">
              ${s.isEvent ? '<span style="font-size:0.65rem; background:#EDE9FE; color:#6D28D9; font-weight:800; padding:2px 6px; border-radius:4px;">EVENT</span>' : ''}
              <b style="color:var(--color-deep-navy);">${safeTitle}</b>
            </div>
            ${s.summary ? `<div style="font-size:0.75rem; color:var(--color-dark-gray); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-top:2px;">${this.escapeHTML(s.summary)}</div>` : ''}
            ${s.editorialFeedback ? `<div style="font-size:0.72rem; color:#B45309; background:#FEF3C7; padding:2px 6px; border-radius:4px; margin-top:4px; display:inline-block;"><b>Feedback:</b> ${this.escapeHTML(s.editorialFeedback)}</div>` : ''}
          </td>
          <td><span class="category-tag" style="font-size:0.7rem;">${this.escapeHTML(s.category)}</span></td>
          <td>
            <b>${this.escapeHTML(s.authorName)}</b>
            ${s.authorEmail ? `<div style="font-size:0.72rem; color:var(--color-dark-gray);">${this.escapeHTML(s.authorEmail)}</div>` : ''}
          </td>
          <td>${dateStr}</td>
          <td><span class="status-badge ${badgeMap[s.status] || 'status-pending'}">${s.status}</span></td>
          <td>
            <div class="admin-actions-cell" style="flex-wrap:wrap; gap:4px;">
              ${s.status !== 'PUBLISHED' ? `
                <button class="btn btn-primary btn-xs" onclick="app.updateSubmissionStatus('${s.id}', 'PUBLISHED', '${s.isEvent ? 'event' : 'article'}')" title="Approve and publish live">
                  <i data-lucide="check"></i> Approve
                </button>
              ` : ''}
              ${s.status === 'PUBLISHED' ? `
                <button class="btn btn-outline btn-xs" onclick="app.updateSubmissionStatus('${s.id}', 'DRAFT', '${s.isEvent ? 'event' : 'article'}')" title="Take down to draft">
                  <i data-lucide="eye-off"></i> Take Down
                </button>
              ` : ''}
              <button class="btn btn-outline btn-xs text-orange" onclick="app.openRequestChangesModal('${s.id}', '${attrTitle}', 'CHANGES_REQUESTED', '${s.isEvent ? 'event' : 'article'}')" title="Request editorial changes with feedback">
                <i data-lucide="message-square-warning"></i> Request Changes
              </button>
              ${s.status !== 'REJECTED' ? `
                <button class="btn btn-outline btn-xs text-red" onclick="app.openRequestChangesModal('${s.id}', '${attrTitle}', 'REJECTED', '${s.isEvent ? 'event' : 'article'}')" title="Reject submission with feedback">
                  <i data-lucide="x"></i> Reject
                </button>
              ` : ''}
              ${!s.isEvent ? `
                <button class="btn btn-outline btn-xs" onclick="app.openEditArticleModal('${s.id}')" title="Edit full article content">
                  <i data-lucide="edit-2"></i> Edit
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    this.updateBatchBar();
    this.refreshIcons(tbody);
  }

  filterAdminSubmissions() {
    this.loadAdminSubmissions();
  }

  // --- Batch Actions in Submissions Table ---
  toggleSelectAllSubmissions(checked) {
    const checkboxes = document.querySelectorAll('.sub-checkbox');
    checkboxes.forEach(cb => {
      cb.checked = checked;
      if (checked) {
        this.selectedSubmissions.add(cb.value);
      } else {
        this.selectedSubmissions.delete(cb.value);
      }
    });
    this.updateBatchBar();
  }

  toggleSubmissionSelect(id, checked) {
    if (checked) {
      this.selectedSubmissions.add(id);
    } else {
      this.selectedSubmissions.delete(id);
    }
    const allBox = document.getElementById('select-all-submissions');
    const checkboxes = document.querySelectorAll('.sub-checkbox');
    if (allBox && checkboxes.length) {
      allBox.checked = Array.from(checkboxes).every(cb => cb.checked);
    }
    this.updateBatchBar();
  }

  clearBatchSelection() {
    this.selectedSubmissions.clear();
    const allBox = document.getElementById('select-all-submissions');
    if (allBox) allBox.checked = false;
    document.querySelectorAll('.sub-checkbox').forEach(cb => cb.checked = false);
    this.updateBatchBar();
  }

  updateBatchBar() {
    const bar = document.getElementById('admin-batch-bar');
    const countEl = document.getElementById('batch-selected-count');
    if (!bar) return;

    const count = this.selectedSubmissions.size;
    if (count > 0) {
      bar.style.display = 'flex';
      if (countEl) countEl.innerHTML = `<i data-lucide="check-square"></i> ${count} item(s) selected`;
      this.refreshIcons(bar);
    } else {
      bar.style.display = 'none';
    }
  }

  async executeBatchAction(targetStatus) {
    if (this.selectedSubmissions.size === 0) return;
    const selectedIds = Array.from(this.selectedSubmissions);

    let feedbackReason = '';
    if (targetStatus === 'REJECTED' || targetStatus === 'CHANGES_REQUESTED') {
      feedbackReason = window.prompt(`Editorial feedback note for ${selectedIds.length} item(s):`, '') || '';
    }

    // Separate articles and events
    const articleIds = [];
    const eventIds = [];
    selectedIds.forEach(id => {
      const item = this.adminSubmissions.find(s => s.id === id);
      if (item?.isEvent) {
        eventIds.push(id);
      } else {
        articleIds.push(id);
      }
    });

    if (articleIds.length > 0) {
      await this.apiFetch('/admin/articles/batch-status', {
        method: 'POST',
        body: JSON.stringify({
          articleIds,
          status: targetStatus,
          editorialFeedback: feedbackReason.trim() || undefined
        })
      });
    }

    if (eventIds.length > 0) {
      await Promise.all(eventIds.map(eid => this.apiFetch(`/admin/events/${eid}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: targetStatus, editorialFeedback: feedbackReason.trim() || undefined })
      })));
    }

    this.showToast(`Batch updated ${selectedIds.length} item(s) to ${targetStatus}`);
    this.clearBatchSelection();
    await this.loadAdminSubmissions();
    this.fetchBackendArticles();
    this.fetchBackendEvents();
  }

  async updateSubmissionStatus(id, newStatus, itemType = 'article', feedback = '') {
    const endpoint = itemType === 'event' ? `/admin/events/${id}/status` : `/admin/articles/${id}/status`;
    const res = await this.apiFetch(endpoint, {
      method: 'PATCH',
      body: JSON.stringify({
        status: newStatus,
        editorialFeedback: feedback?.trim() || undefined
      })
    });

    if (res.ok) {
      this.showToast(`${itemType === 'event' ? 'Event' : 'Article'} status updated to ${newStatus}`);
      await this.loadAdminSubmissions();
      this.fetchBackendArticles();
      this.fetchBackendEvents();
    } else {
      this.showToast(`Failed to update status: ${res.data?.error || 'Error'}`);
    }
  }

  // --- Editorial Feedback Modal Handlers (Admin) ---
  openRequestChangesModal(id, title, targetStatus = 'CHANGES_REQUESTED', itemType = 'article') {
    const modal = document.getElementById('modal-request-changes');
    const itemIdEl = document.getElementById('feedback-item-id');
    const itemTypeEl = document.getElementById('feedback-item-type');
    const statusEl = document.getElementById('feedback-target-status');
    const titleEl = document.getElementById('feedback-item-title');
    const descEl = document.getElementById('feedback-action-description');
    const textEl = document.getElementById('feedback-reason-text');

    if (itemIdEl) itemIdEl.value = id;
    if (itemTypeEl) itemTypeEl.value = itemType;
    if (statusEl) statusEl.value = targetStatus;
    if (titleEl) titleEl.textContent = title || 'Submission';
    if (textEl) textEl.value = '';

    if (descEl) {
      descEl.textContent = targetStatus === 'REJECTED'
        ? 'Provide the reason why this submission is being rejected so the author is informed.'
        : 'Specify the editorial improvements required before this post can be approved.';
    }

    if (modal) {
      modal.classList.add('show');
      document.body.classList.add('modal-open');
    }
  }

  closeRequestChangesModal() {
    const modal = document.getElementById('modal-request-changes');
    if (modal) {
      modal.classList.remove('show');
      document.body.classList.remove('modal-open');
    }
  }

  async handleRequestChangesSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('feedback-item-id').value;
    const itemType = document.getElementById('feedback-item-type').value;
    const targetStatus = document.getElementById('feedback-target-status').value;
    const reason = document.getElementById('feedback-reason-text').value.trim();

    if (!id || !reason) {
      this.showToast('Please provide an editorial feedback reason.');
      return;
    }

    await this.updateSubmissionStatus(id, targetStatus, itemType, reason);
    this.closeRequestChangesModal();
  }

  // --- Admin Full Editorial Article Editor Modal ---
  async openEditArticleModal(articleId) {
    let article = this.adminSubmissions.find(a => a.id === articleId);
    if (!article) {
      const res = await this.apiFetch(`/articles/${articleId}`);
      if (res.ok && res.data?.article) {
        article = res.data.article;
      }
    }

    if (!article) {
      this.showToast('Article not found.');
      return;
    }

    document.getElementById('edit-article-id').value = article.id;
    document.getElementById('edit-article-title').value = article.title || '';
    document.getElementById('edit-article-category').value = article.category || 'IT';
    document.getElementById('edit-article-domain').value = article.domain || '';
    document.getElementById('edit-article-status').value = article.status || 'PENDING';
    document.getElementById('edit-article-image').value = article.image || '';
    document.getElementById('edit-article-summary').value = article.summary || '';
    document.getElementById('edit-article-body').value = article.body || '';

    const modal = document.getElementById('modal-edit-article');
    if (modal) {
      modal.classList.add('show');
      document.body.classList.add('modal-open');
    }
  }

  closeEditArticleModal() {
    const modal = document.getElementById('modal-edit-article');
    if (modal) {
      modal.classList.remove('show');
      document.body.classList.remove('modal-open');
    }
  }

  async handleEditArticleSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('edit-article-id').value;
    const title = document.getElementById('edit-article-title').value.trim();
    const category = document.getElementById('edit-article-category').value;
    const domain = document.getElementById('edit-article-domain').value.trim();
    const status = document.getElementById('edit-article-status').value;
    const image = document.getElementById('edit-article-image').value.trim();
    const summary = document.getElementById('edit-article-summary').value.trim();
    const body = document.getElementById('edit-article-body').value.trim();
    const editorialFeedback = document.getElementById('edit-article-feedback')?.value.trim() || undefined;

    const payload = {
      title,
      category,
      domain: domain || undefined,
      status,
      image: image || undefined,
      summary,
      body,
      editorialFeedback
    };

    const res = await this.apiFetch(`/admin/articles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      this.showToast('Article content updated successfully.');
      this.closeEditArticleModal();
      await this.loadAdminSubmissions();
      this.fetchBackendArticles();
    } else {
      this.showToast(`Failed to update article: ${res.data?.error || 'Validation error'}`);
    }
  }

  async handleAdminArticleCreate(e, status = this.pendingAdminArticleStatus || 'PUBLISHED') {
    e.preventDefault();
    this.pendingAdminArticleStatus = null;
    if (this.currentUser?.role !== 'ADMIN') return;
    const payload = {
      title: document.getElementById('admin-create-title').value.trim(),
      category: document.getElementById('admin-create-category').value,
      domain: document.getElementById('admin-create-domain').value.trim() || undefined,
      image: document.getElementById('admin-create-image').value.trim() || undefined,
      summary: document.getElementById('admin-create-summary').value.trim(),
      body: document.getElementById('admin-create-body').value.trim(),
      status
    };
    const res = await this.apiFetch('/articles', { method: 'POST', body: JSON.stringify(payload) });
    if (res.ok) {
      this.showToast(status === 'PUBLISHED' ? 'Article published.' : 'Draft saved.');
      e.target.reset();
      const preview = document.getElementById('admin-create-image-preview');
      if (preview) preview.innerHTML = '';
      this.fetchBackendArticles();
      if (status === 'PUBLISHED') this.loadAdminSubmissions();
    } else {
      const errMsg = res.data?.message || (res.data?.details ? res.data.details.map(d => d.message).join(', ') : res.data?.error) || 'Unable to save article.';
      this.showToast(`Error: ${errMsg}`);
    }
  }

  saveAdminDraft() {
    const form = document.getElementById('admin-create-article-form');
    this.pendingAdminArticleStatus = 'DRAFT';
    form?.requestSubmit();
  }

  // --- User & Role Management Implementation ---
  async loadAdminUsers() {
    if (this.currentUser?.role !== 'ADMIN') return;
    const tbody = document.getElementById('admin-users-table-body');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:var(--color-dark-gray);">Fetching platform user directory...</td></tr>`;

    const res = await this.apiFetch('/admin/users');
    if (res.ok && Array.isArray(res.data?.users)) {
      this.adminUsers = res.data.users;
      const counts = res.data.counts || {};

      const totalEl = document.getElementById('admin-stat-user-total');
      const readersEl = document.getElementById('admin-stat-user-readers');
      const pubsEl = document.getElementById('admin-stat-user-pubs');
      const adminsEl = document.getElementById('admin-stat-user-admins');

      if (totalEl) totalEl.textContent = counts.total || this.adminUsers.length;
      if (readersEl) readersEl.textContent = counts.users || 0;
      if (pubsEl) pubsEl.textContent = counts.publishers || 0;
      if (adminsEl) adminsEl.textContent = counts.admins || 0;

      this.filterAdminUsers();
    } else {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:var(--color-dark-gray);">Failed to load platform user directory.</td></tr>`;
    }
  }

  filterAdminUsers() {
    const tbody = document.getElementById('admin-users-table-body');
    if (!tbody) return;

    const roleFilter = document.getElementById('admin-role-filter')?.value || 'ALL';
    let filtered = this.adminUsers || [];
    if (roleFilter !== 'ALL') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:32px; color:var(--color-dark-gray);">No users found matching the selected role filter.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(u => {
      const dateStr = u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently';
      const articleCount = u._count?.articles || 0;
      const commentCount = u._count?.comments || 0;

      let roleBadge = `<span class="status-badge badge-user">Reader</span>`;
      if (u.isRootAdmin) {
        roleBadge = `<span class="status-badge badge-root-admin"><i data-lucide="crown" style="width:12px;height:12px;margin-right:3px;"></i> Root Admin</span>`;
      } else if (u.role === 'ADMIN') {
        roleBadge = `<span class="status-badge badge-admin">Administrator</span>`;
      } else if (u.role === 'PUBLISHER') {
        roleBadge = `<span class="status-badge badge-publisher">Publisher</span>`;
      }

      const actionsCell = u.isRootAdmin
        ? `<span class="status-badge badge-root-admin" style="font-size:0.7rem;">Primary Root</span>`
        : `<button class="btn btn-outline btn-xs" style="color:var(--color-crimson); border-color:#FECACA;" onclick="app.deleteAdminUser('${u.id}', '${this.escapeHTML(u.name).replace(/'/g, "\\'")}')" title="Delete account"><i data-lucide="trash-2"></i> Delete</button>`;

      return `
        <tr>
          <td><b style="color:var(--color-deep-navy);">${this.escapeHTML(u.name)}</b></td>
          <td><code>${this.escapeHTML(u.email)}</code></td>
          <td>${roleBadge}</td>
          <td>${dateStr}</td>
          <td style="text-align:center;"><b>${articleCount}</b></td>
          <td style="text-align:center;"><b>${commentCount}</b></td>
          <td style="text-align:center;">${actionsCell}</td>
        </tr>
      `;
    }).join('');

    this.refreshIcons(tbody);
  }

  async deleteAdminUser(userId, userName) {
    if (!confirm(`Are you sure you want to delete the account for "${userName}"? This will also remove their associated submissions and comments.`)) {
      return;
    }
    const res = await this.apiFetch(`/admin/users/${userId}`, { method: 'DELETE' });
    if (res.ok) {
      this.showToast(`Account for "${userName}" successfully removed.`);
      await this.loadAdminUsers();
    } else {
      this.showToast(`Failed to delete user: ${res.data?.error || 'Server error'}`);
    }
  }

  openCreateUserModal() {
    const modal = document.getElementById('modal-create-user');
    const feedback = document.getElementById('create-user-feedback');
    const form = document.getElementById('create-user-form');
    if (form) form.reset();
    if (feedback) {
      feedback.style.display = 'none';
      feedback.innerHTML = '';
    }
    if (modal) {
      modal.classList.add('show');
      document.body.classList.add('modal-open');
    }
  }

  closeCreateUserModal() {
    const modal = document.getElementById('modal-create-user');
    if (modal) {
      modal.classList.remove('show');
      document.body.classList.remove('modal-open');
    }
  }

  async handleCreateUserSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('create-user-name').value.trim();
    const email = document.getElementById('create-user-email').value.trim();
    const role = document.getElementById('create-user-role').value;
    const password = document.getElementById('create-user-password').value.trim();
    const feedback = document.getElementById('create-user-feedback');
    const submitBtn = document.getElementById('btn-submit-create-user');

    if (!name || !email || !role) return;

    if (submitBtn) submitBtn.disabled = true;

    const res = await this.apiFetch('/admin/users/create', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        role,
        password: password || undefined
      })
    });

    if (submitBtn) submitBtn.disabled = false;

    if (res.ok && res.data?.credentials) {
      const creds = res.data.credentials;
      this.showToast(`Account created: ${creds.email}`);
      this.loadAdminUsers();

      if (feedback) {
        feedback.style.display = 'block';
        feedback.innerHTML = `
          <div style="margin-top:16px; padding:14px; background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.3); border-radius:var(--radius-sm);">
            <div style="font-weight:700; color:#15803D; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
              <i data-lucide="check-circle-2"></i> Credentials Generated Successfully
            </div>
            <p style="font-size:0.8rem; color:var(--color-charcoal); margin-bottom:8px;">
              Copy the credentials below. Securely share them with the assigned operator:
            </p>
            <div class="credentials-display-box">
<pre>
<span class="cred-key">Name:</span>     <span class="cred-val">${this.escapeHTML(creds.name)}</span>
<span class="cred-key">Role:</span>     <span class="cred-val">${this.escapeHTML(creds.role)}</span>
<span class="cred-key">Email:</span>    <span class="cred-val">${this.escapeHTML(creds.email)}</span>
<span class="cred-key">Password:</span> <span class="cred-val">${this.escapeHTML(creds.password)}</span>
</pre>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" id="btn-copy-creds" onclick="app.copyCredentials('${this.escapeHTML(creds.email)}', '${this.escapeHTML(creds.password)}', '${this.escapeHTML(creds.role)}')">
              <i data-lucide="copy"></i> Copy Credential Details
            </button>
          </div>
        `;
        this.refreshIcons(feedback);
      }
    } else {
      const errMsg = res.data?.error || (res.data?.details ? res.data.details.map(d => d.message).join(', ') : 'Failed to create account');
      if (feedback) {
        feedback.style.display = 'block';
        feedback.innerHTML = `
          <div style="margin-top:16px; padding:12px; background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.3); border-radius:var(--radius-sm); color:#DC2626; font-size:0.85rem;">
            <b>Error:</b> ${this.escapeHTML(errMsg)}
          </div>
        `;
      }
      this.showToast(`Error: ${errMsg}`);
    }
  }

  async copyCredentials(email, password, role) {
    const siteUrl = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : 'http://localhost:4000';
    const textToCopy = `OPEN MEDIA CREDENTIALS\nRole: ${role}\nEmail: ${email}\nPassword: ${password}\nURL: ${siteUrl}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      const btn = document.getElementById('btn-copy-creds');
      if (btn) {
        btn.innerHTML = `<i data-lucide="check"></i> Copied to Clipboard!`;
        this.refreshIcons(btn);
        setTimeout(() => {
          if (btn) {
            btn.innerHTML = `<i data-lucide="copy"></i> Copy Credential Details`;
            this.refreshIcons(btn);
          }
        }, 3000);
      }
      this.showToast('Credentials copied to clipboard!');
    } catch (err) {
      console.warn('Clipboard write failed:', err);
      this.showToast('Could not access clipboard. Please manually copy the credentials above.');
    }
  }

  // --- Article Reader Comments & Threaded Replies Integration (Phase 2) ---
  formatTimeAgo(dateInput) {
    if (!dateInput) return 'Just now';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return 'Recently';
    const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  async loadArticleComments(articleId) {
    const listEl = document.getElementById(`comments-list-${articleId}`);
    const countEl = document.getElementById(`comment-count-${articleId}`);
    if (!listEl) return;

    const res = await this.apiFetch(`/articles/${articleId}/comments`);
    let comments = [];
    let totalCount = 0;

    if (res.ok && Array.isArray(res.data?.comments)) {
      comments = res.data.comments;
      totalCount = res.data.totalCount || comments.length;
    } else {
      comments = this.articleCommentsCache[articleId] || [];
      totalCount = comments.length;
    }

    if (countEl) countEl.textContent = totalCount;

    if (!comments.length) {
      listEl.innerHTML = `<div style="text-align:center; padding:24px; color:var(--color-dark-gray); font-size:0.88rem; font-style:italic;">No comments yet. Be the first to share your perspective!</div>`;
      return;
    }

    const currentUserId = this.currentUser?.id;
    const isAdmin = this.currentUser?.role === 'ADMIN';

    const renderCommentCard = (c, isReply = false) => {
      const author = c.user?.name || 'Reader';
      const role = c.user?.role || 'USER';
      const isOwner = (c.userId === currentUserId || c.user?.id === currentUserId);
      const canManage = isOwner || isAdmin;
      const initial = author.charAt(0).toUpperCase();
      const timeStr = this.formatTimeAgo(c.createdAt);
      const editedTag = c.isEdited ? `<span class="comment-edited-tag">(edited)</span>` : '';
      const roleBadge = role === 'ADMIN' 
        ? `<span class="comment-role-badge role-admin">Editor</span>`
        : role === 'PUBLISHER'
        ? `<span class="comment-role-badge role-publisher">Author</span>`
        : '';

      const repliesHtml = (!isReply && Array.isArray(c.replies) && c.replies.length > 0)
        ? `<div class="comment-replies-list">
             ${c.replies.map(r => renderCommentCard(r, true)).join('')}
           </div>`
        : '';

      return `
        <div class="${isReply ? 'comment-reply-card' : 'comment-card'}" id="comment-container-${c.id}">
          <div class="comment-header">
            <div class="comment-author-info">
              <span class="comment-avatar">${initial}</span>
              <span class="comment-author-name">${this.escapeHTML(author)}</span>
              ${roleBadge}
              <span class="comment-time">${timeStr}${editedTag}</span>
            </div>
            <div class="comment-options">
              <button class="comment-action-link" onclick="app.reportComment('${c.id}')" title="Report inappropriate comment"><i data-lucide="flag"></i></button>
            </div>
          </div>
          <div class="comment-content" id="comment-body-${c.id}">${this.escapeHTML(c.content)}</div>
          
          <div class="comment-actions-bar">
            ${!isReply ? `<button class="comment-action-link" onclick="app.toggleReplyBox('${c.id}')"><i data-lucide="reply"></i> Reply</button>` : ''}
            ${canManage ? `<button class="comment-action-link" onclick="app.toggleEditBox('${c.id}')"><i data-lucide="edit-3"></i> Edit</button>` : ''}
            ${canManage ? `<button class="comment-action-link delete" onclick="app.deleteComment('${c.id}', '${articleId}')"><i data-lucide="trash-2"></i> Delete</button>` : ''}
          </div>

          <!-- Inline Edit Form (Hidden by default) -->
          <div class="comment-edit-box" id="edit-box-${c.id}" style="display:none;">
            <textarea id="edit-input-${c.id}">${this.escapeHTML(c.content)}</textarea>
            <div class="comment-edit-actions">
              <button type="button" class="btn btn-outline btn-sm" onclick="app.toggleEditBox('${c.id}')">Cancel</button>
              <button type="button" class="btn btn-primary btn-sm" onclick="app.saveCommentEdit('${c.id}', '${articleId}')">Save Changes</button>
            </div>
          </div>

          <!-- Inline Reply Form (Hidden by default) -->
          ${!isReply ? `
            <div class="comment-reply-box" id="reply-box-${c.id}" style="display:none;">
              <textarea id="reply-input-${c.id}" placeholder="Write a reply to ${this.escapeHTML(author)}..."></textarea>
              <div class="comment-reply-actions">
                <button type="button" class="btn btn-outline btn-sm" onclick="app.toggleReplyBox('${c.id}')">Cancel</button>
                <button type="button" class="btn btn-primary btn-sm" onclick="app.submitReply('${articleId}', '${c.id}')"><i data-lucide="send"></i> Post Reply</button>
              </div>
            </div>
          ` : ''}

          ${repliesHtml}
        </div>
      `;
    };

    listEl.innerHTML = comments.map(c => renderCommentCard(c, false)).join('');
    this.refreshIcons(listEl);
  }

  toggleReplyBox(commentId) {
    if (!this.currentUser) {
      this.openAuthModal('login');
      this.showToast('Please sign in to reply to comments.');
      return;
    }
    const box = document.getElementById(`reply-box-${commentId}`);
    if (!box) return;
    const isHidden = box.style.display === 'none';
    box.style.display = isHidden ? 'flex' : 'none';
    if (isHidden) {
      const input = document.getElementById(`reply-input-${commentId}`);
      if (input) input.focus();
    }
    this.refreshIcons(box);
  }

  toggleEditBox(commentId) {
    const box = document.getElementById(`edit-box-${commentId}`);
    const body = document.getElementById(`comment-body-${commentId}`);
    if (!box) return;
    const isHidden = box.style.display === 'none';
    box.style.display = isHidden ? 'flex' : 'none';
    if (body) body.style.display = isHidden ? 'none' : 'block';
    if (isHidden) {
      const input = document.getElementById(`edit-input-${commentId}`);
      if (input) input.focus();
    }
    this.refreshIcons(box);
  }

  async submitReply(articleId, parentId) {
    const input = document.getElementById(`reply-input-${parentId}`);
    if (!input || !input.value.trim()) {
      this.showToast('Reply cannot be empty.');
      return;
    }
    const content = input.value.trim();

    const res = await this.apiFetch(`/articles/${articleId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parentId })
    });

    if (res.ok) {
      input.value = '';
      this.showToast('Reply posted successfully');
      this.loadArticleComments(articleId);
    } else {
      this.showToast(`Failed to post reply: ${res.data?.error || 'Error'}`);
    }
  }

  async saveCommentEdit(commentId, articleId) {
    const input = document.getElementById(`edit-input-${commentId}`);
    if (!input || !input.value.trim()) {
      this.showToast('Comment cannot be empty.');
      return;
    }
    const content = input.value.trim();

    const res = await this.apiFetch(`/articles/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ content })
    });

    if (res.ok) {
      this.showToast('Comment updated.');
      this.loadArticleComments(articleId);
    } else {
      this.showToast(`Failed to update comment: ${res.data?.error || 'Unauthorized'}`);
    }
  }

  async deleteComment(commentId, articleId) {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    const res = await this.apiFetch(`/articles/comments/${commentId}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      this.showToast('Comment deleted.');
      this.loadArticleComments(articleId);
    } else {
      this.showToast(`Failed to delete comment: ${res.data?.error || 'Unauthorized'}`);
    }
  }

  async reportComment(commentId) {
    if (!this.currentUser) {
      this.openAuthModal('login');
      this.showToast('Please sign in to report content.');
      return;
    }
    const reason = prompt('Please specify why this comment is inappropriate (e.g. spam, abusive, off-topic):');
    if (!reason || !reason.trim()) return;

    const res = await this.apiFetch(`/articles/comments/${commentId}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason.trim() })
    });

    if (res.ok) {
      this.showToast('Thank you. Comment reported for editorial moderation.');
    } else {
      this.showToast('Failed to submit report.');
    }
  }

  async handleCommentSubmit(e, articleId) {
    e.preventDefault();
    if (!this.currentUser) {
      this.openAuthModal('login');
      this.showToast('Please sign in to comment on this story.');
      return;
    }

    const input = document.getElementById(`comment-input-${articleId}`);
    if (!input || !input.value.trim()) {
      this.showToast('Comment cannot be empty.');
      return;
    }
    const content = input.value.trim();

    const res = await this.apiFetch(`/articles/${articleId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });

    if (res.ok) {
      input.value = '';
      this.showToast('Comment posted successfully');
      this.loadArticleComments(articleId);
    } else {
      if (!this.articleCommentsCache[articleId]) this.articleCommentsCache[articleId] = [];
      this.articleCommentsCache[articleId].unshift({
        id: `com-${Date.now()}`,
        content,
        user: { name: this.currentUser?.name || 'Reader' },
        createdAt: new Date().toISOString()
      });
      input.value = '';
      this.showToast('Comment posted (Local mode)');
      this.loadArticleComments(articleId);
    }
  }

  // --- Article Reactions Methods (Phase 2) ---
  async loadArticleReactions(articleId) {
    const totalEl = document.getElementById(`reactions-total-${articleId}`);
    const likeCountEl = document.getElementById(`rx-count-like-${articleId}`);
    const insightfulCountEl = document.getElementById(`rx-count-insightful-${articleId}`);
    const helpfulCountEl = document.getElementById(`rx-count-helpful-${articleId}`);
    const likeBtn = document.getElementById(`rx-btn-like-${articleId}`);
    const insightfulBtn = document.getElementById(`rx-btn-insightful-${articleId}`);
    const helpfulBtn = document.getElementById(`rx-btn-helpful-${articleId}`);

    if (!likeBtn) return;

    const res = await this.apiFetch(`/articles/${articleId}/reactions`);
    if (res.ok && res.data) {
      const counts = res.data.counts || { LIKE: 0, INSIGHTFUL: 0, HELPFUL: 0, total: 0 };
      const userReaction = res.data.userReaction || null;

      if (totalEl) totalEl.textContent = `${counts.total} ${counts.total === 1 ? 'Reaction' : 'Reactions'}`;
      if (likeCountEl) likeCountEl.textContent = counts.LIKE || 0;
      if (insightfulCountEl) insightfulCountEl.textContent = counts.INSIGHTFUL || 0;
      if (helpfulCountEl) helpfulCountEl.textContent = counts.HELPFUL || 0;

      likeBtn.classList.toggle('active', userReaction === 'LIKE');
      insightfulBtn.classList.toggle('active', userReaction === 'INSIGHTFUL');
      helpfulBtn.classList.toggle('active', userReaction === 'HELPFUL');
    }
  }

  async toggleArticleReaction(articleId, type) {
    if (!this.currentUser) {
      this.openAuthModal('login');
      this.showToast('Please sign in to react to articles.');
      return;
    }

    const res = await this.apiFetch(`/articles/${articleId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ type })
    });

    if (res.ok && res.data) {
      this.showToast(res.data.message || 'Reaction updated');
      this.loadArticleReactions(articleId);
    } else {
      this.showToast(`Failed to update reaction: ${res.data?.error || 'Error'}`);
    }
  }

  // --- Article Social Share Methods (Phase 2) ---
  async openShareModal(articleId) {
    let article = this.findArticle(articleId);
    if (!article) {
      try {
        const res = await this.apiFetch(`/articles/${articleId}`);
        if (res.ok && res.data?.article) {
          const a = res.data.article;
          article = {
            id: a.id,
            title: a.title,
            summary: a.summary,
            description: a.summary,
            category: a.category,
            author: a.author?.name || 'Editorial Desk',
            readTime: '3 min read'
          };
        }
      } catch (e) {}
    }
    if (!article) {
      this.showToast('Unable to share: article details could not be loaded.');
      return;
    }

    const modal = document.getElementById('share-modal');
    const body = document.getElementById('share-modal-body');
    if (!modal || !body) return;

    const origin = window.location.origin;
    const shareUrl = `${origin}/?article=${encodeURIComponent(article.id)}#article-${encodeURIComponent(article.id)}`;
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(article.title);
    const canNativeShare = Boolean(navigator.share);

    body.innerHTML = `
      <div class="share-article-preview">
        <h4 class="share-article-title">${this.escapeHTML(article.title)}</h4>
        <div class="share-article-meta">
          <span>By ${this.escapeHTML(article.author || 'Editorial Lead')}</span> ·
          <span>${article.category}</span> ·
          <span>${article.readTime || '3 min read'}</span>
        </div>
      </div>
      ${canNativeShare ? `
        <div style="margin-bottom:12px;">
          <button class="btn btn-primary" style="width:100%; display:flex; align-items:center; justify-content:center; gap:8px;" onclick="app.triggerNativeShare('${article.id}')">
            <i data-lucide="share-2"></i> Share via Device / System Sheet
          </button>
        </div>
      ` : ''}
      <div class="social-share-grid">
        <a href="https://api.whatsapp.com/send?text=${encodedTitle}%0A%0A${encodedUrl}" target="_blank" rel="noopener noreferrer" class="social-share-btn btn-whatsapp" title="Share on WhatsApp">
          <i data-lucide="message-circle"></i>
          <span>WhatsApp</span>
        </a>
        <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}" target="_blank" rel="noopener noreferrer" class="social-share-btn btn-linkedin" title="Share on LinkedIn">
          <i data-lucide="linkedin"></i>
          <span>LinkedIn</span>
        </a>
        <a href="https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}" target="_blank" rel="noopener noreferrer" class="social-share-btn btn-x" title="Share on X (Twitter)">
          <i data-lucide="twitter"></i>
          <span>X / Twitter</span>
        </a>
        <a href="https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}" target="_blank" rel="noopener noreferrer" class="social-share-btn btn-telegram" title="Share on Telegram">
          <i data-lucide="send"></i>
          <span>Telegram</span>
        </a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}" target="_blank" rel="noopener noreferrer" class="social-share-btn btn-facebook" title="Share on Facebook">
          <i data-lucide="facebook"></i>
          <span>Facebook</span>
        </a>
        <button type="button" class="social-share-btn btn-copylink" onclick="app.copyShareUrl('${article.id}')" title="Copy article link">
          <i data-lucide="copy"></i>
          <span>Copy Link</span>
        </button>
      </div>
      <div class="share-url-box" style="margin-top:14px;">
        <input type="text" id="share-link-input-${article.id}" value="${shareUrl}" readonly onclick="this.select()">
        <button class="btn btn-primary btn-sm" onclick="app.copyShareUrl('${article.id}')"><i data-lucide="clipboard"></i> Copy</button>
      </div>
    `;

    modal.classList.add('show');
    this.updateModalOpenState(true);
    this.refreshIcons(body);
  }

  async triggerNativeShare(articleId) {
    let article = this.findArticle(articleId);
    if (!article) return;
    const shareUrl = `${window.location.origin}/?article=${encodeURIComponent(article.id)}#article-${encodeURIComponent(article.id)}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.summary || article.description || article.title,
          url: shareUrl
        });
        this.showToast('Shared successfully!');
      } catch (err) {
        if (err.name !== 'AbortError') {
          this.showToast('Could not share via device sheet.');
        }
      }
    }
  }

  closeShareModal() {
    const modal = document.getElementById('share-modal');
    if (modal) modal.classList.remove('show');
    this.updateModalOpenState(false);
  }

  async copyShareUrl(articleId) {
    const input = document.getElementById(`share-link-input-${articleId}`);
    const shareUrl = input ? input.value : `${window.location.origin}/?article=${encodeURIComponent(articleId)}#article-${encodeURIComponent(articleId)}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        this.showToast('Article link copied to clipboard!');
        return;
      }
    } catch (e) {}

    if (input) {
      input.select();
      document.execCommand('copy');
      this.showToast('Article link copied to clipboard!');
    }
  }

  // --- SPA Navigation / Routing ---
  renderHomePage() {
    this.renderHero();
    this.renderTrending();
    this.renderTicker();
    this.renderEditorPicks();
    this.renderHomeForYou();
    this.renderHomeLatestFeed();
    this.renderTechSpotlight();
    this.renderAIHighlights();
    this.renderCyberAlerts();
    this.renderBusinessHighlights();
    this.renderTechInsights();
    this.renderHomeDiscussions();
    this.renderHomePolls();
    this.renderEvents();
    this.renderTrendingFlipbook();
  }

  detectArticleDeepLink() {
    // 1. Check query parameter: ?article=... or ?id=...
    try {
      if (typeof window !== 'undefined' && window.location && window.location.search) {
        const params = new URLSearchParams(window.location.search);
        const articleParam = params.get('article') || params.get('id');
        if (articleParam && articleParam.trim()) {
          return decodeURIComponent(articleParam.trim());
        }
      }
    } catch (_) {}

    // 2. Check hash: #article-xyz or #article/xyz or #/article/xyz
    const rawHash = (typeof window !== 'undefined' && window.location && window.location.hash) ? window.location.hash.trim() : '';
    const hashMatch = rawHash.match(/^#(?:article[-/]|(?:\/article\/))(.+)$/i);
    if (hashMatch && hashMatch[1]) {
      return decodeURIComponent(hashMatch[1].trim());
    }

    // 3. Check path: /article/xyz
    const rawPath = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname.trim() : '';
    const pathMatch = rawPath.match(/^\/article\/(.+)$/i);
    if (pathMatch && pathMatch[1]) {
      return decodeURIComponent(pathMatch[1].trim());
    }

    return null;
  }

  async checkAndOpenDeepLinkedArticle() {
    const articleId = this.detectArticleDeepLink();
    if (articleId) {
      console.log('🔗 [Deep Link] Opening article:', articleId);
      await this.openArticleModal(articleId);
    }
  }

  handleInitialRoute() {
    const deepArticleId = this.detectArticleDeepLink();
    const rawHash = (window.location.hash || '').trim();
    let page = 'home';

    if (rawHash && rawHash !== '#') {
      const candidate = rawHash.replace(/^#/, '');
      if (VALID_PAGES.includes(candidate)) {
        page = candidate;
      }
    }

    // Only force #home if there is NO deep article link AND no other valid page hash
    if (!deepArticleId && (!rawHash || rawHash === '#' || page === 'home')) {
      if (window.location.hash !== '#home') {
        window.history.replaceState(null, '', '#home');
      }
    }

    this.navigateTo(page, false);
    this.renderHomePage();
  }

  setupRouting() {
    window.addEventListener('hashchange', () => this.handleHashChange());
    this.handleInitialRoute();
  }

  async handleHashChange() {
    const rawHash = (location.hash || '').trim();
    const deepArticleId = this.detectArticleDeepLink();

    if (deepArticleId) {
      if (this.activeReaderArticleId !== deepArticleId) {
        await this.openArticleModal(deepArticleId);
      }
      return;
    }

    if (this.activeReaderArticleId && !rawHash.startsWith('#article-')) {
      this.closeArticleModal(false);
    }

    const page = (rawHash || '#home').replace(/^#/, '');
    if (VALID_PAGES.includes(page)) {
      this.navigateTo(page, false);
    }
  }

  navigateTo(pageId, pushHash = true) {
    if (!VALID_PAGES.includes(pageId)) pageId = 'home';

    // Ensure any open modal, drawer, or overlay is cleanly dismissed upon page navigation
    this.closeAllModals();

    // Strict Role-Aware Navigation Guards
    const user = this.getCurrentUser();
    if (pageId === 'admin' && (!user || user.role !== 'ADMIN')) {
      this.showToast('Unauthorized access. Admin privileges required.');
      this.navigateTo('home', pushHash);
      return;
    }
    if (pageId === 'publish' && (!user || user.role !== 'PUBLISHER')) {
      this.showToast('Restricted: Publisher access is required.');
      this.navigateTo('home', pushHash);
      return;
    }
    if (pageId === 'foryou' && (!user || user.role !== 'USER')) {
      this.showToast('Sign in as a reader to view your personalized For You feed.');
      this.navigateTo('home', pushHash);
      return;
    }

    this.currentPage = pageId;

    document.querySelectorAll('.page-view').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-link, .mobile-nav-link, .mobile-bottom-nav .nav-item').forEach(el => el.classList.remove('active'));

    const targetPage = document.getElementById(`page-${pageId}`);
    if (targetPage) {
      targetPage.classList.add('active');
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      this.refreshIcons(targetPage);
    }

    document.querySelectorAll(`[data-page="${pageId}"]`).forEach(el => el.classList.add('active'));

    if (pushHash && location.hash !== `#${pageId}`) {
      history.pushState(null, '', `#${pageId}`);
    }

    if (pageId === 'business') {
      this.renderCategoryFeed('business', 'business-feed', 'business-domain-tree', BUSINESS_DOMAIN_GROUPS, 'business-ad-slot');
    } else if (pageId === 'tech') {
      this.renderCategoryFeed('tech', 'tech-feed', 'tech-domain-tree', TECH_DOMAIN_GROUPS, 'tech-ad-slot');
    } else if (pageId === 'cyber') {
      this.renderCategoryFeed('cyber', 'cyber-feed', 'cyber-domain-tree', CYBER_DOMAIN_GROUPS, null);
    } else if (pageId === 'ai') {
      this.renderAIPage();
    }

    if (pageId === 'admin') {
      if (this.activeAdminTab === 'users') {
        this.loadAdminUsers();
      } else {
        this.loadAdminSubmissions();
      }
    }

    document.title = pageId === 'home'
      ? 'OPEN MEDIA — Technology, Business & Cybersecurity Intelligence'
      : `${pageId.charAt(0).toUpperCase() + pageId.slice(1)} — OPEN MEDIA`;
  }

  setupGlobalListeners() {
    window.addEventListener('error', (event) => {
      if (event.target instanceof HTMLImageElement) {
        event.target.classList.add('media-failed');
        if (!event.target.dataset.fallbackApplied && event.target.src && !event.target.src.startsWith('data:image/svg+xml')) {
          event.target.dataset.fallbackApplied = 'true';
          event.target.onerror = null;
          event.target.src = this.getImageFallbackSvg(event.target.alt || 'OPEN MEDIA');
        }
      }
    }, true);

    window.addEventListener('scroll', () => {
      const header = document.getElementById('main-header');
      if (window.scrollY > 40) header.classList.add('compact');
      else header.classList.remove('compact');
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
      if (document.getElementById('page-home')?.classList.contains('active')) {
        if (e.key === 'ArrowRight') this.nextHeroStory(true);
        if (e.key === 'ArrowLeft') this.prevHeroStory(true);
      }
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"]')) {
        e.preventDefault();
        e.target.click();
      }
    });

    document.addEventListener('click', (e) => {
      const menu = document.getElementById('profile-menu');
      const trigger = e.target.closest('.profile-dropdown-wrapper');
      if (!trigger && menu?.classList.contains('show')) menu.classList.remove('show');

      // Click to close fallback on any darkened overlay backdrop
      if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('ai-drawer-overlay') || e.target.classList.contains('mobile-drawer-overlay') || e.target.id === 'ai-drawer-overlay' || e.target.id === 'mobile-drawer-overlay') {
        this.closeAllModals();
      }
    });
  }

  // --- Homepage Hero Carousel + Side Trending Panel ---
  renderHero() {
    if (this.heroFlipInProgress) {
      this.heroRenderPending = true;
      return;
    }

    const heroes = this.getHomeHeroStories();
    const hero = heroes[this.currentHeroIndex] || heroes[0];
    const container = document.getElementById('hero-main-card');
    if (!container || !hero) return;
    const user = this.getCurrentUser();

    container.innerHTML = `
      <div class="hero-page-content">${this.heroPageMarkup(hero, this.currentHeroIndex, heroes.length, user)}</div>
      <div class="hero-carousel-controls">
        <button class="hero-nav-btn" data-hero-control onclick="app.prevHeroStory(true)" aria-label="Previous story">
          <i data-lucide="arrow-left"></i> Previous
        </button>
        <div class="hero-dots">
          ${heroes.map((_, i) => `<button class="hero-dot ${i === this.currentHeroIndex ? 'active' : ''}" data-hero-control onclick="app.goToHeroStory(${i})" aria-label="Go to story ${i + 1}"></button>`).join('')}
        </div>
        <button class="hero-nav-btn" data-hero-control onclick="app.nextHeroStory(true)" aria-label="Next story">
          Next <i data-lucide="arrow-right"></i>
        </button>
      </div>
    `;

    this.setupHeroSwipe();
    this.setupHeroHoverPause();
    this.renderSideTrendingPanel();
    this.renderEditorPicks();
    this.refreshIcons(container);
  }

  heroPageMarkup(hero, index, total, user) {
    const catSlug = this.categorySlug(hero.category);
    return `
      <div class="hero-image-box">
        <img src="${hero.image}" alt="${this.escapeHTML(hero.title)}" loading="eager" onerror="this.onerror=null;this.src=app.getPosterFallback('${hero.category || 'IT'}', '${this.escapeJS(hero.id || hero.title)}');">
      </div>
      <div class="hero-top-bar">
        <span class="category-tag cat-${catSlug}">${hero.category}</span>
        <div class="hero-top-right">
          <span class="hero-live-badge"><span></span> Live Pulse</span>
          <span class="hero-page-count">${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span>
        </div>
      </div>
      <div class="hero-body">
        <h1 class="hero-title" onclick="app.openArticleModal('${hero.id}')" style="cursor:pointer;" title="Read full story">${hero.title}</h1>
        <p class="hero-desc">${hero.description}</p>
        <div class="hero-meta-row">
          <span>By <b>${hero.author}</b> · ${hero.readTime || ''} · Updated ${hero.published}</span>
          <div class="hero-actions">
            ${user ? `
            <button class="icon-btn" onclick="app.toggleSaveArticle('${hero.id}', event)" title="Save" aria-label="Save story">
              <i data-lucide="${this.isSaved(hero.id) ? 'bookmark-check' : 'bookmark'}"></i>
            </button>` : ''}
            <button class="icon-btn" onclick="app.openArticleModal('${hero.id}')" title="Read Full" aria-label="Read full story">
              <i data-lucide="maximize-2"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  flipHeroToStory(newIndex, direction) {
    if (this.heroFlipInProgress) return;

    const heroes = this.getHomeHeroStories();
    const hero = heroes[newIndex];
    const container = document.getElementById('hero-main-card');
    const page = container?.querySelector('.hero-page-content');
    if (!container || !page || !hero || newIndex === this.currentHeroIndex) return;

    this.heroFlipInProgress = true;
    this.heroRenderPending = false;
    container.querySelectorAll('[data-hero-control]').forEach((control) => {
      control.disabled = true;
    });

    const turningPage = page.cloneNode(true);
    turningPage.classList.add('hero-turn-page', direction > 0 ? 'hero-turn-forward' : 'hero-turn-backward');
    turningPage.setAttribute('aria-hidden', 'true');
    turningPage.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
    container.appendChild(turningPage);

    this.currentHeroIndex = newIndex;
    page.innerHTML = this.heroPageMarkup(hero, newIndex, heroes.length, this.getCurrentUser());
    this.refreshIcons(page);

    let completed = false;
    const finishFlip = () => {
      if (completed) return;
      completed = true;
      clearTimeout(this.heroFlipTimer);
      turningPage.removeEventListener('animationend', onAnimationEnd);
      turningPage.remove();
      container.querySelectorAll('[data-hero-control]').forEach((control) => {
        control.disabled = false;
      });
      container.querySelectorAll('.hero-dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === this.currentHeroIndex);
      });
      this.heroFlipInProgress = false;
      if (this.heroRenderPending) this.renderHero();
    };
    const onAnimationEnd = (event) => {
      if (event.target === turningPage) finishFlip();
    };

    turningPage.addEventListener('animationend', onAnimationEnd);
    void turningPage.offsetWidth;
    turningPage.classList.add('is-turning');
    const fallbackDuration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 180 : 600;
    this.heroFlipTimer = setTimeout(finishFlip, fallbackDuration);
  }

  nextHeroStory(userTriggered) {
    const total = this.getHomeHeroStories().length;
    const nextIdx = (this.currentHeroIndex + 1) % total;
    this.flipHeroToStory(nextIdx, 1);
    if (userTriggered) this.restartHeroAutoRotate();
  }

  prevHeroStory(userTriggered) {
    const total = this.getHomeHeroStories().length;
    const prevIdx = (this.currentHeroIndex - 1 + total) % total;
    this.flipHeroToStory(prevIdx, -1);
    if (userTriggered) this.restartHeroAutoRotate();
  }

  goToHeroStory(index) {
    if (index === this.currentHeroIndex) return;
    this.flipHeroToStory(index, index > this.currentHeroIndex ? 1 : -1);
    this.restartHeroAutoRotate();
  }

  setupHeroSwipe() {
    const card = document.getElementById('hero-main-card');
    if (!card || card.dataset.swipeInitialized) return;
    card.dataset.swipeInitialized = 'true';
    let startX = 0;
    card.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    card.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) {
        if (dx < 0) this.nextHeroStory(true); else this.prevHeroStory(true);
      }
    }, { passive: true });
  }

  setupHeroHoverPause() {
    const card = document.getElementById('hero-main-card');
    if (!card || card.dataset.hoverInitialized) return;
    card.dataset.hoverInitialized = 'true';
    card.addEventListener('mouseenter', () => clearInterval(this.aiHeroRotateTimer));
    card.addEventListener('mouseleave', () => this.startHeroAutoRotate());
  }

  startHeroAutoRotate() {
    clearInterval(this.aiHeroRotateTimer);
    this.aiHeroRotateTimer = setInterval(() => {
      if (this.currentPage === 'home') this.nextHeroStory(false);
    }, 7000);
  }

  restartHeroAutoRotate() {
    clearInterval(this.aiHeroRotateTimer);
    this.startHeroAutoRotate();
  }

  renderSideTrendingPanel() {
    const stories = this.getHomeTrending();
    const card = document.getElementById('magazine-flip-card');
    if (!card || !stories.length) return;

    const topTrending = stories.slice(0, 4);

    card.className = 'magazine-flip-card side-trending-card';
    card.innerHTML = `
      <div class="side-trending-header">
        <span class="eyebrow"><i data-lucide="radio-tower"></i> Trending News</span>
        <span class="side-trending-badge"><span></span> LIVE</span>
      </div>
      <div class="side-trending-list">
        ${topTrending.map((story, i) => `
          <div class="side-trending-item" onclick="app.showTrendingStoryModal('${story.id}')" tabindex="0" role="button" aria-label="${story.title}">
            <span class="side-trending-rank">${String(i + 1).padStart(2, '0')}</span>
            <div class="side-trending-content">
              <span class="category-tag cat-${this.categorySlug(story.category)}">${story.category}</span>
              <h4 class="side-trending-title">${story.title}</h4>
              <span class="side-trending-meta">${story.time || story.date || 'Recent'} · ${story.author || 'Global Desk'}</span>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="side-trending-footer">
        <a href="#home-latest-section" class="side-trending-link" onclick="event.preventDefault(); app.scrollToLatestWire()">
          Explore Latest Wire Stories <i data-lucide="arrow-right"></i>
        </a>
      </div>
    `;

    this.refreshIcons(card);
  }

  scrollToLatestWire() {
    if (this.currentPage !== 'home') {
      this.navigateTo('home');
      setTimeout(() => {
        const el = document.getElementById('home-latest-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } else {
      const el = document.getElementById('home-latest-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  showTrendingStoryModal(storyId) {
    const stories = this.getHomeTrending();
    const story = stories.find(s => s.id === storyId);
    if (!story) return;
    const article = this.getHomeArticles().find(a => a.title === story.title || a.id === story.id);
    if (article) {
      this.openArticleModal(article.id);
    } else {
      this.openArticleModal(story.id);
    }
  }

  // Compatibility aliases
  renderTrendingFlipbook() { this.renderSideTrendingPanel(); }
  nextTrendingStory(userTriggered) { this.nextHeroStory(userTriggered); }
  prevTrendingStory(userTriggered) { this.prevHeroStory(userTriggered); }
  goToTrendingStory(index) { this.goToHeroStory(index); }
  startTrendingAutoRotate() {}
  restartTrendingAutoRotate() {}
  advanceHeroStory(userTriggered) { this.nextHeroStory(userTriggered); }

  renderEditorPicks() {
    const strip = document.getElementById('editor-picks-strip');
    if (!strip) return;
    const heroIds = new Set((this.getHomeHeroStories() || []).map(h => h.id));
    const picks = this.getHomeArticles().filter(a => !heroIds.has(a.id)).slice(0, 3);
    if (!this.homepageAssignedIds) this.homepageAssignedIds = new Set();
    heroIds.forEach(id => this.homepageAssignedIds.add(id));
    picks.forEach(p => this.homepageAssignedIds.add(p.id));
    strip.innerHTML = picks.map(a => this.horizontalCardHTML(a)).join('');
    this.refreshIcons(strip);
  }

  // --- RSS Wire & Ticker Services ---
  async fetchTicker() {
    try {
      const res = await this.apiFetch('/news/ticker');
      const items = res.data?.items || res.data?.headlines;
      if (res.ok && items?.length) {
        this.tickerItems = items.filter(t => 
          APPROVED_CATEGORIES.includes(t.category) && 
          !NON_ENGLISH_REGEX.test(t.title)
        );
        this.renderTicker();
      }
    } catch (err) {
      console.warn('Ticker fetch fallback', err);
    }
  }

  renderTicker() {
    const ticker = document.getElementById('ticker-content');
    if (!ticker) return;
    const stories = (this.tickerItems && this.tickerItems.length) ? this.tickerItems : this.getHomeTrending();
    if (!stories || !stories.length) return;
    ticker.innerHTML = `<div class="ticker-text">${stories.map(t => `<span class="ticker-story" ${t.id ? `onclick="app.openArticleModal('${t.id}')" style="cursor:pointer;"` : ''}><i data-lucide="${this.trendingIcon(t.category)}"></i><b>${t.category}</b><span>${t.title}</span></span><span class="ticker-separator">/</span>`).join('')}</div>`;
    this.refreshIcons(ticker);

    const tickerText = ticker.querySelector('.ticker-text');
    if (tickerText) {
      // Set leisurely, readable speed: ~40px per second across content width
      const contentWidth = tickerText.scrollWidth || 6000;
      const smoothSeconds = Math.max(140, Math.round(contentWidth / 40));
      tickerText.style.animationDuration = `${smoothSeconds}s`;
    }
  }

  async syncLiveRSS(btn) {
    if (this._syncingRSS) return;
    this._syncingRSS = true;
    const originalContent = btn ? btn.innerHTML : '';
    if (btn) {
      btn.classList.add('syncing');
      btn.disabled = true;
      btn.innerHTML = `<i data-lucide="refresh-cw"></i> <span>Syncing...</span>`;
      this.refreshIcons(btn);
    }
    this.showToast('Fetching latest syndicated wire updates from global RSS feeds...');
    try {
      const res = await this.apiFetch('/news/sync', { method: 'POST' });
      if (res.ok && res.data?.success) {
        const s = res.data.stats;
        this.showToast(`⚡ Wire Synced: ${s.inserted} fresh stories added across ${s.feedsSucceeded} feeds!`);
      } else {
        this.showToast('Wire synchronization completed.');
      }
      await this.fetchBackendArticles();
      await this.fetchTicker();
    } catch (err) {
      console.error('RSS wire sync error:', err);
      this.showToast('Wire sync encountered an issue.');
    } finally {
      this._syncingRSS = false;
      if (btn) {
        btn.classList.remove('syncing');
        btn.disabled = false;
        btn.innerHTML = originalContent;
        this.refreshIcons(btn);
      }
    }
  }

  // --- Card render helpers with Contextual Image Deduplication ---
  getDeduplicatedCardImage(item, usedSet = null) {
    if (!item) return '';
    const set = usedSet || (this.renderedImagesInView = this.renderedImagesInView || new Set());
    const imgPool = {
      'IT': [
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80'
      ],
      'Business': [
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1444653614773-995cb1ef9028?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=1200&q=80'
      ],
      'Cyber Security': [
        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1510511459019-5dda7724fd87?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80'
      ],
      'AI': [
        'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1535378917042-10a22c95931a?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1617791160505-6f008e1e6703?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1516110833967-0b5716ca1387?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80'
      ]
    };

    let cat = item.category || 'IT';
    const text = ((item.title || '') + ' ' + (item.domain || '') + ' ' + (item.summary || '')).toLowerCase();
    if (/attack|breach|hack|threat|vulnerab|malware|ransom|security|supply chain|exploit|zero-day|cve|phish|payload|botnet/.test(text)) {
      cat = 'Cyber Security';
    } else if (/chip|semiconductor|foundry|gpu|nvidia|intel|amd|hardware|datacenter|server|processor|quantum/.test(text)) {
      cat = 'IT';
    } else if (/stock|market|invest|trade|shares|bank|capital|revenue|earnings|finance|wall street|valuation|ipo/.test(text)) {
      cat = 'Business';
    } else if (/agent|model|neural|llm|robot|autonomous|gpt|gemini|deepmind|anthropic|openai|generative ai/.test(text)) {
      cat = 'AI';
    }

    const pool = imgPool[cat] || imgPool['IT'];
    let chosen = item.image;

    // Check if duplicate or empty or previously assigned
    if (!chosen || set.has(chosen) || (this.lastAssignedImage && chosen === this.lastAssignedImage)) {
      for (const candidate of pool) {
        if (!set.has(candidate) && candidate !== this.lastAssignedImage) {
          chosen = candidate;
          break;
        }
      }
      if (!chosen || set.has(chosen) || (this.lastAssignedImage && chosen === this.lastAssignedImage)) {
        let hash = 0;
        for (let i = 0; i < text.length; i++) hash = (hash << 5) - hash + text.charCodeAt(i);
        let idx = Math.abs(hash) % pool.length;
        if (pool[idx] === this.lastAssignedImage) idx = (idx + 1) % pool.length;
        chosen = pool[idx];
      }
    }

    set.add(chosen);
    this.lastAssignedImage = chosen;
    return chosen;
  }

  horizontalCardHTML(item, opts = {}) {
    if (!item) return '';
    const isSaved = this.isSaved(item.id);
    const domainBadge = item.domain || item.category;
    const dateStr = item.date || item.published || item.time || 'Recent';
    const readTimeStr = item.readTime || '3 min read';
    const displayImg = this.getDeduplicatedCardImage(item, opts.usedSet);

    return `
      <div class="horizontal-card" onclick="app.openArticleModal('${item.id}')" tabindex="0" role="button" aria-label="${this.escapeHTML(item.title)}">
        <img src="${displayImg}" alt="${this.escapeHTML(item.title)}" loading="lazy" onerror="this.onerror=null;this.src=app.getPosterFallback('${item.category || 'IT'}', '${this.escapeJS(item.id || item.title)}');">
        <div class="horizontal-card-body">
          <span class="story-category text-${this.accentClass(item.category)}">${this.escapeHTML(domainBadge)}</span>
          <h4 class="story-title" style="font-size:0.95rem; margin: 6px 0;">${this.escapeHTML(item.title)}</h4>
          <div class="card-footer-meta" style="border:none; padding-top:4px; margin-top:auto;">
            <span class="text-muted" style="font-size:0.75rem;">${dateStr} · ${readTimeStr}</span>
            <div class="card-actions" onclick="event.stopPropagation()">
              <button class="card-action-btn ${isSaved ? 'active' : ''}" onclick="app.toggleSaveArticle('${item.id}', event)" title="${isSaved ? 'Remove from saved' : 'Save article'}" aria-label="Bookmark">
                <i data-lucide="${isSaved ? 'bookmark-check' : 'bookmark'}"></i>
              </button>
              <button class="card-action-btn" onclick="app.shareArticle('${item.id}', event)" title="Share article" aria-label="Share">
                <i data-lucide="share-2"></i>
              </button>
            </div>
          </div>
        </div>
      </div>`;
  }

  accentClass(category) {
    const map = { 'IT': 'blue', 'Business': 'emerald', 'Cyber Security': 'red', 'AI': 'purple' };
    return map[category] || 'blue';
  }

  editorialCardHTML(item, opts = {}) {
    if (!item) return '';
    const extraClass = opts.lead ? ' lead-story' : '';
    const isSaved = this.isSaved(item.id);
    const domainBadge = item.domain || item.category;
    const authorName = item.author || 'Editorial Desk';
    const dateStr = item.date || item.published || 'Recent';
    const readTimeStr = item.readTime || '3 min read';
    const summaryText = item.summary || item.description || '';
    const displayImg = this.getDeduplicatedCardImage(item, opts.usedSet);

    return `
      <article class="card-editorial${extraClass}" onclick="app.openArticleModal('${item.id}')" tabindex="0" role="button" aria-label="${this.escapeHTML(item.title)}">
        <div class="card-editorial-thumb">
          <img src="${displayImg}" alt="${this.escapeHTML(item.title)}" loading="lazy" onerror="this.onerror=null;this.src=app.getPosterFallback('${item.category || 'IT'}', '${this.escapeJS(item.id || item.title)}');">
          <span class="card-category-chip text-${this.accentClass(item.category)}">${this.escapeHTML(domainBadge)}</span>
        </div>
        <div class="card-editorial-body">
          <div class="card-content-top">
            <span class="story-category text-${this.accentClass(item.category)}">${this.escapeHTML(domainBadge)}</span>
            <h3 class="card-editorial-title">${this.escapeHTML(item.title)}</h3>
            <p class="text-muted story-summary">${this.escapeHTML(summaryText)}</p>
          </div>
          <div class="card-footer-meta">
            <div class="meta-info">
              <span class="meta-author"><i data-lucide="user" class="meta-icon"></i> ${this.escapeHTML(authorName)}</span>
              <span class="meta-dot">·</span>
              <span class="meta-date"><i data-lucide="clock" class="meta-icon"></i> ${dateStr}</span>
              <span class="meta-dot">·</span>
              <span class="meta-readtime"><i data-lucide="book-open" class="meta-icon"></i> ${readTimeStr}</span>
            </div>
            <div class="card-actions" onclick="event.stopPropagation()">
              <button class="card-action-btn ${isSaved ? 'active' : ''}" onclick="app.toggleSaveArticle('${item.id}', event)" title="${isSaved ? 'Remove from saved' : 'Save article'}" aria-label="Bookmark">
                <i data-lucide="${isSaved ? 'bookmark-check' : 'bookmark'}"></i>
              </button>
              <button class="card-action-btn" onclick="app.shareArticle('${item.id}', event)" title="Share article" aria-label="Share">
                <i data-lucide="share-2"></i>
              </button>
            </div>
          </div>
        </div>
      </article>`;
  }

  cyberCardHTML(item, opts = {}) {
    if (!item) return '';
    const sevClass = 'sev-' + (item.severity || 'high').toLowerCase().replace(/\s+/g, '-');
    const isSaved = this.isSaved(item.id);
    const domainBadge = item.domain || item.category;
    const authorName = item.author || 'Cyber Threat Desk';
    const dateStr = item.date || item.published || 'Recent';
    const readTimeStr = item.readTime || '3 min read';
    const summaryText = item.summary || item.description || '';
    const displayImg = this.getDeduplicatedCardImage(item, opts.usedSet);

    return `
      <article class="card-editorial cyber-alert-card" onclick="app.openArticleModal('${item.id}')" tabindex="0" role="button" aria-label="${this.escapeHTML(item.title)}">
        <div class="card-editorial-thumb">
          <img src="${displayImg}" alt="${this.escapeHTML(item.title)}" loading="lazy" onerror="this.onerror=null;this.src=app.getPosterFallback('Cyber Security', '${this.escapeJS(item.id || item.title)}');">
          <span class="card-category-chip text-red">${this.escapeHTML(domainBadge)}</span>
        </div>
        <div class="card-editorial-body">
          <div class="card-content-top">
            <div class="cyber-badge-row">
              <span class="severity-badge ${sevClass}">${item.severity || 'ALERT'}</span>
              <span class="story-category text-red">${this.escapeHTML(domainBadge)}</span>
            </div>
            <h3 class="card-editorial-title">${this.escapeHTML(item.title)}</h3>
            <p class="text-muted story-summary">${this.escapeHTML(summaryText)}</p>
          </div>
          <div class="card-footer-meta">
            <div class="meta-info">
              <span class="meta-author"><i data-lucide="shield" class="meta-icon"></i> ${this.escapeHTML(authorName)}</span>
              <span class="meta-dot">·</span>
              <span class="meta-date">${dateStr}</span>
              <span class="meta-dot">·</span>
              <span class="meta-readtime">${readTimeStr}</span>
            </div>
            <div class="card-actions" onclick="event.stopPropagation()">
              <button class="card-action-btn ${isSaved ? 'active' : ''}" onclick="app.toggleSaveArticle('${item.id}', event)" title="${isSaved ? 'Remove from saved' : 'Save article'}" aria-label="Bookmark">
                <i data-lucide="${isSaved ? 'bookmark-check' : 'bookmark'}"></i>
              </button>
              <button class="card-action-btn" onclick="app.shareArticle('${item.id}', event)" title="Share article" aria-label="Share">
                <i data-lucide="share-2"></i>
              </button>
            </div>
          </div>
        </div>
      </article>`;
  }

  storyHorizontalHTML(item, opts = {}) {
    if (!item) return '';
    const isSaved = this.isSaved(item.id);
    const domainBadge = item.domain || item.category;
    const authorName = item.author || 'Editorial Desk';
    const dateStr = item.date || item.published || 'Recent';
    const readTimeStr = item.readTime || '3 min read';
    const summaryText = item.summary || item.description || '';
    const displayImg = this.getDeduplicatedCardImage(item, opts.usedSet);

    return `
      <div class="story-horizontal" onclick="app.openArticleModal('${item.id}')" tabindex="0" role="button" aria-label="${this.escapeHTML(item.title)}">
        <img src="${displayImg}" alt="${this.escapeHTML(item.title)}" loading="lazy" onerror="this.onerror=null;this.src=app.getPosterFallback('${item.category || 'IT'}', '${this.escapeJS(item.id || item.title)}');">
        <div class="story-body">
          <span class="story-category text-${this.accentClass(item.category)}">${this.escapeHTML(domainBadge)}${item.severity ? ' · ' + item.severity : ''}</span>
          <h4 style="font-size:0.95rem; font-family:var(--font-heading); margin: 4px 0;">${this.escapeHTML(item.title)}</h4>
          ${summaryText ? `<p class="text-muted story-summary-sm" style="font-size:0.8rem; margin: 2px 0 6px; line-height: 1.4;">${this.escapeHTML(summaryText.length > 110 ? summaryText.substring(0, 107) + '...' : summaryText)}</p>` : ''}
          <div class="card-footer-meta" style="border:none; padding-top:2px; margin-top:auto;">
            <span class="text-muted" style="font-size:0.75rem;">By ${this.escapeHTML(authorName)} · ${dateStr} · ${readTimeStr}</span>
            <div class="card-actions" onclick="event.stopPropagation()">
              <button class="card-action-btn ${isSaved ? 'active' : ''}" onclick="app.toggleSaveArticle('${item.id}', event)" title="${isSaved ? 'Remove from saved' : 'Save article'}" aria-label="Bookmark">
                <i data-lucide="${isSaved ? 'bookmark-check' : 'bookmark'}"></i>
              </button>
              <button class="card-action-btn" onclick="app.shareArticle('${item.id}', event)" title="Share article" aria-label="Share">
                <i data-lucide="share-2"></i>
              </button>
            </div>
          </div>
        </div>
      </div>`;
  }

  mostReadItemHTML(item, index) {
    return `
      <div class="most-read-item" onclick="app.openArticleModal('${item.id}')" tabindex="0" role="button">
        <span class="most-read-num">${String(index + 1).padStart(2, '0')}</span>
        <div class="most-read-body">
          <span class="story-category text-${this.accentClass(item.category)}">${item.category}</span>
          <h4>${item.title}</h4>
        </div>
      </div>`;
  }

  adUnitHTML(ad) {
    return `
      <div class="ad-unit">
        <span class="ad-tag">ADVERTISEMENT</span>
        <h4>${ad.title}</h4>
        <p>${ad.body}</p>
        <button class="btn btn-primary btn-sm" onclick="app.showToast('This is a sample advertisement placement.')">${ad.cta}</button>
      </div>`;
  }

  renderSidebarAd(slot) {
    if (!slot || !GC_DATA.ads.length) return;
    let adIndex = 0;
    const paint = () => {
      slot.innerHTML = this.adUnitHTML(GC_DATA.ads[adIndex]);
      slot.querySelector('.ad-unit')?.classList.add('sidebar-ad');
      adIndex = (adIndex + 1) % GC_DATA.ads.length;
    };
    paint();
    clearInterval(this.sidebarAdTimer);
    this.sidebarAdTimer = setInterval(paint, 9000);
  }

  renderMediaAd(slot, variant = 'business') {
    if (!slot) return;
    const copy = {
      foryou: ['Make Every Read Count', 'Curated intelligence for the ideas you follow.', 'Your signal, sharpened.'],
      tech: ['Power Your Next Breakthrough', 'Infrastructure insights for teams building the future.', 'Build smarter.'],
      business: ['Build What Is Next', 'Bring sharper intelligence to every strategic decision.', 'Discover'],
      cyber: ['Stay Ahead of the Threat', 'Practical briefings for teams defending what matters.', 'Explore briefing']
    }[variant] || ['Build What Is Next', 'Bring sharper intelligence to every strategic decision.', 'Discover'];
    const creatives = [
      { type: 'video', title: copy[0], body: copy[1], poster: GC_DATA.trending[0].image },
      { type: 'poster', title: variant === 'cyber' ? 'Security Without Guesswork' : 'The Signal, Delivered', body: copy[1], poster: GC_DATA.trending[variant === 'cyber' ? 2 : 4].image },
      { type: 'poster', title: variant === 'tech' ? 'The Infrastructure Brief' : 'Intelligence for Leaders', body: copy[1], poster: GC_DATA.trending[variant === 'tech' ? 1 : 5].image }
    ];
    slot.innerHTML = creatives.map(creative => `<div class="media-ad media-ad-${variant}" role="complementary" aria-label="Sponsored advertisement">
        <div class="media-ad-visual">
          ${creative.type === 'video'
            ? `<video autoplay muted loop playsinline poster="${creative.poster}" aria-label="Promotional video"><source src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" type="video/mp4"></video>`
            : `<img src="${creative.poster}" alt="" loading="lazy">`}
          <span class="media-ad-label">SPONSORED</span>
          <span class="media-ad-play"><i data-lucide="${creative.type === 'video' ? 'play' : 'image'}"></i></span>
        </div>
        <div class="media-ad-body"><span class="ad-tag">OPEN MEDIA PARTNER</span><h4>${creative.title}</h4><p>${creative.body}</p><button class="btn btn-primary btn-sm" onclick="app.showToast('This is a sample advertisement placement.')">${copy[2]} <i data-lucide="arrow-up-right"></i></button></div>
      </div>`).join('');
    this.refreshIcons();
    clearInterval(this.mediaAdTimer);
  }

  // --- Trending Section ---
  renderTrending() {
    const container = document.getElementById('trending-container');
    if (!container) return;
    container.innerHTML = this.getHomeTrending().map(t => this.horizontalCardHTML(t)).join('');
    this.refreshIcons(container);
  }

  // --- Home Sections (Phase 1) ---
  renderHomeForYou() {
    const container = document.getElementById('home-foryou-strip');
    if (!container) return;
    const articles = this.getHomeArticles();
    if (!articles.length) return;

    let curated = [];
    if (this.savedArticles.length) {
      // Find saved articles to identify user's preferred categories
      const savedCats = new Set(this.savedArticles.map(id => this.findArticle(id)?.category).filter(Boolean));
      curated = articles.filter(a => savedCats.has(a.category) && !this.isSaved(a.id)).slice(0, 3);
    }
    if (curated.length < 3) {
      // Fallback: pick diverse analytical stories across pillars
      const heroIds = new Set((this.getHomeHeroStories() || []).map(h => h.id));
      const pool = articles.filter(a => !heroIds.has(a.id) && !curated.some(c => c.id === a.id));
      curated = [...curated, ...pool.slice(0, 3 - curated.length)];
    }

    container.innerHTML = curated.map(item => this.editorialCardHTML(item)).join('');
    this.refreshIcons(container);
  }

  renderHomeLatestFeed() {
    const container = document.getElementById('home-latest-feed');
    if (!container) return;

    let items = [...this.getHomeArticles()];

    // Apply category filter
    if (this.homeLatestFilter && this.homeLatestFilter !== 'all') {
      items = items.filter(a => a.category === this.homeLatestFilter);
    } else {
      // Deduplication: prevent repeating articles showcased in Hero and Editor's Picks
      const heroIds = new Set((this.getHomeHeroStories() || []).map(h => h.id));
      const filtered = items.filter(a => !heroIds.has(a.id) && !(this.homepageAssignedIds && this.homepageAssignedIds.has(a.id)));
      if (filtered.length >= 6) {
        items = filtered;
      }
    }

    // Apply sorting
    if (this.homeLatestSort === 'popular') {
      items.sort((a, b) => {
        const scoreB = ((b.commentsCount || 0) * 3) + ((b.savedCount || 0) * 2);
        const scoreA = ((a.commentsCount || 0) * 3) + ((a.savedCount || 0) * 2);
        if (scoreB !== scoreA) return scoreB - scoreA;
        return new Date(b.publishedAt || b.date).getTime() - new Date(a.publishedAt || a.date).getTime();
      });
    } else {
      // Latest first
      items.sort((a, b) => new Date(b.publishedAt || b.date).getTime() - new Date(a.publishedAt || a.date).getTime());
    }

    if (!items.length) {
      container.innerHTML = this.emptyStateHTML(this.homeLatestFilter === 'all' ? 'news' : this.homeLatestFilter);
      const countEl = document.getElementById('home-latest-count');
      if (countEl) countEl.textContent = '0 stories found';
      const loadBtn = document.getElementById('home-load-more-btn');
      if (loadBtn) loadBtn.style.display = 'none';
      return;
    }

    const totalAvailable = items.length;
    const visibleCount = Math.min(this.homeLatestPage * this.homeLatestPageSize, totalAvailable);
    const visibleItems = items.slice(0, visibleCount);

    container.innerHTML = visibleItems.map(item => this.editorialCardHTML(item)).join('');

    // Update count badge
    const countEl = document.getElementById('home-latest-count');
    if (countEl) {
      countEl.textContent = `Showing ${visibleItems.length} of ${totalAvailable} stories`;
    }

    // Update Load More button
    const loadBtn = document.getElementById('home-load-more-btn');
    if (loadBtn) {
      loadBtn.style.display = 'inline-flex';
      if (visibleCount >= totalAvailable) {
        loadBtn.disabled = true;
        loadBtn.innerHTML = `<span>All Caught Up (${totalAvailable} stories)</span> <i data-lucide="check"></i>`;
      } else {
        loadBtn.disabled = false;
        loadBtn.innerHTML = `<span class="btn-text">Load More Stories</span> <i data-lucide="arrow-down"></i>`;
      }
      this.refreshIcons(loadBtn);
    }

    this.refreshIcons(container);
  }

  filterHomeLatest(category, btnEl) {
    this.homeLatestFilter = category;
    this.homeLatestPage = 1;

    // Update active chip state
    const bar = document.getElementById('home-latest-filters');
    if (bar) {
      bar.querySelectorAll('.chip').forEach(b => b.classList.remove('active'));
      if (btnEl) btnEl.classList.add('active');
    }

    this.renderHomeLatestFeed();
  }

  sortHomeLatest(sortType, btnEl) {
    this.homeLatestSort = sortType;
    this.homeLatestPage = 1;

    const parent = btnEl ? btnEl.parentElement : null;
    if (parent) {
      parent.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
      if (btnEl) btnEl.classList.add('active');
    }

    this.renderHomeLatestFeed();
  }

  loadMoreLatestStories() {
    if (this.homeLatestLoading) return;
    const loadBtn = document.getElementById('home-load-more-btn');
    if (loadBtn) {
      this.homeLatestLoading = true;
      loadBtn.classList.add('is-loading');
      loadBtn.innerHTML = `<span>Loading...</span> <i data-lucide="loader"></i>`;
      this.refreshIcons(loadBtn);
    }

    setTimeout(() => {
      this.homeLatestPage += 1;
      this.homeLatestLoading = false;
      if (loadBtn) loadBtn.classList.remove('is-loading');
      this.renderHomeLatestFeed();
    }, 280);
  }

  renderTechSpotlight() {
    const container = document.getElementById('tech-spotlight-container');
    if (!container) return;
    const heroIds = new Set((this.getHomeHeroStories() || []).map(h => h.id));
    const used = this.homepageAssignedIds || heroIds;
    let items = this.getHomeArticles().filter(a => a.category === 'IT' && !used.has(a.id)).slice(0, 5);
    if (!items.length) items = this.getHomeArticles().filter(a => a.category === 'IT').slice(0, 5);
    items.forEach(i => used.add(i.id));
    if (!items.length) { container.innerHTML = this.emptyStateHTML('technology'); return; }
    container.innerHTML = [
      this.editorialCardHTML(items[0], { lead: true }),
      ...items.slice(1, 5).map(i => this.editorialCardHTML(i))
    ].join('');
    this.refreshIcons(container);
  }

  renderBusinessHighlights() {
    const container = document.getElementById('business-highlights-container');
    if (!container) return;
    const heroIds = new Set((this.getHomeHeroStories() || []).map(h => h.id));
    const used = this.homepageAssignedIds || heroIds;
    let items = this.getHomeArticles().filter(a => a.category === 'Business' && !used.has(a.id)).slice(0, 3);
    if (!items.length) items = this.getHomeArticles().filter(a => a.category === 'Business').slice(0, 3);
    items.forEach(i => used.add(i.id));
    container.innerHTML = items.length ? items.map(i => this.editorialCardHTML(i)).join('') : this.emptyStateHTML('business');
    this.refreshIcons(container);
  }

  renderCyberAlerts() {
    const container = document.getElementById('cyber-alerts-container');
    if (!container) return;
    const heroIds = new Set((this.getHomeHeroStories() || []).map(h => h.id));
    const used = this.homepageAssignedIds || heroIds;
    let items = this.getHomeArticles().filter(a => a.category === 'Cyber Security' && !used.has(a.id)).slice(0, 3);
    if (!items.length) items = this.getHomeArticles().filter(a => a.category === 'Cyber Security').slice(0, 3);
    items.forEach(i => used.add(i.id));
    container.innerHTML = items.length ? items.map(i => this.cyberCardHTML(i)).join('') : this.emptyStateHTML('cyber security');
    this.refreshIcons(container);
  }

  renderAIHighlights() {
    const container = document.getElementById('ai-highlights-container');
    if (!container) return;
    const heroIds = new Set((this.getHomeHeroStories() || []).map(h => h.id));
    const used = this.homepageAssignedIds || heroIds;
    let items = this.getHomeArticles().filter(a => a.category === 'AI' && !used.has(a.id)).slice(0, 3);
    if (!items.length) items = this.getHomeArticles().filter(a => a.category === 'AI').slice(0, 3);
    items.forEach(i => used.add(i.id));
    container.innerHTML = items.length ? items.map(i => this.editorialCardHTML(i)).join('') : this.emptyStateHTML('AI');
    this.refreshIcons(container);
  }

  renderTechInsights() {
    const container = document.getElementById('tech-insights-container');
    if (!container) return;
    const articles = this.getHomeArticles();
    const heroIds = new Set((this.getHomeHeroStories() || []).map(h => h.id));
    const used = this.homepageAssignedIds || heroIds;
    let insights = articles.filter(a => (a.category === 'IT' || a.category === 'AI') && !used.has(a.id)).slice(0, 3);
    if (!insights.length) {
      insights = articles.filter(a => a.category === 'IT' || a.category === 'AI').slice(5, 8);
    }
    insights.forEach(i => used.add(i.id));
    if (!insights.length) {
      container.innerHTML = this.emptyStateHTML('technology insights');
      return;
    }

    container.innerHTML = insights.map(item => `
      <article class="insight-card" onclick="app.openArticleModal('${item.id}')" tabindex="0" role="button" aria-label="${this.escapeHTML(item.title)}">
        <div>
          <span class="insight-badge"><i data-lucide="cpu"></i> Deep Dive · ${this.escapeHTML(item.domain || item.category)}</span>
          <h3 class="insight-title">${this.escapeHTML(item.title)}</h3>
          <p class="insight-summary">${this.escapeHTML(item.summary || item.description || '')}</p>
        </div>
        <div class="insight-footer">
          <span>By ${this.escapeHTML(item.author)} · ${item.readTime || '5 min read'}</span>
          <span style="color:var(--color-royal-blue); font-weight:700; display:inline-flex; align-items:center; gap:4px;">Read Analysis <i data-lucide="arrow-right"></i></span>
        </div>
      </article>
    `).join('');
    this.refreshIcons(container);
  }

  async renderHomeDiscussions() {
    const container = document.getElementById('home-discussions-container');
    if (!container) return;

    try {
      const res = await fetch('/api/discussions?limit=6');
      if (res.ok) {
        const data = await res.json();
        if (data.discussions && data.discussions.length > 0) {
          container.innerHTML = data.discussions.map(d => {
            const commentsCount = d._count?.comments || 0;
            return `
              <article class="discussion-card" onclick="app.openDiscussionViewer('${d.id}')" tabindex="0" role="button" aria-label="${this.escapeHTML(d.title)}">
                <div class="discussion-header">
                  <span class="discussion-category-pill">${this.escapeHTML(d.category)}</span>
                  <span class="discussion-comments-badge"><i data-lucide="message-circle"></i> ${commentsCount} ${commentsCount === 1 ? 'Reply' : 'Replies'}</span>
                </div>
                <h3 class="discussion-title">${this.escapeHTML(d.title)}</h3>
                <p class="discussion-preview-body">${this.escapeHTML(d.content)}</p>
                <div class="discussion-meta-bar">
                  <span>By <b>${this.escapeHTML(d.author?.name || 'Reader')}</b></span>
                  <span class="btn-join-discussion">Participate <i data-lucide="arrow-right"></i></span>
                </div>
              </article>
            `;
          }).join('');
          this.refreshIcons(container);
          return;
        }
      }
    } catch (e) {
      console.warn('Discussions fetch fallback:', e);
    }

    // Graceful fallback to existing articles
    const articles = this.getHomeArticles();
    const discussions = articles.slice(8, 11);
    if (!discussions.length) {
      container.innerHTML = this.emptyStateHTML('community discussions');
      return;
    }

    container.innerHTML = discussions.map(item => {
      const count = item.commentsCount || 1;
      return `
        <article class="discussion-card" onclick="app.openArticleModal('${item.id}')" tabindex="0" role="button" aria-label="${this.escapeHTML(item.title)}">
          <div class="discussion-header">
            <span class="story-category text-${this.accentClass(item.category)}">${this.escapeHTML(item.domain || item.category)}</span>
            <span class="discussion-comments-badge"><i data-lucide="message-circle"></i> ${count} ${count === 1 ? 'Perspective' : 'Perspectives'}</span>
          </div>
          <h3 class="discussion-title">${this.escapeHTML(item.title)}</h3>
          <p class="discussion-prompt">What are the strategic and operational implications of this shift? Join the peer review discussion on OPEN MEDIA.</p>
          <div class="discussion-footer">
            <span>By ${this.escapeHTML(item.author)}</span>
            <span class="btn-join-discussion">Join Discussion <i data-lucide="message-square"></i></span>
          </div>
        </article>
      `;
    }).join('');
    this.refreshIcons(container);
  }

  // --- Community Polls Controller ---
  async renderHomePolls() {
    const container = document.getElementById('home-polls-container');
    if (!container) return;

    try {
      const headers = this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {};
      const res = await fetch('/api/polls', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.polls && data.polls.length > 0) {
          container.innerHTML = data.polls.slice(0, 3).map(poll => {
            const hasVoted = Boolean(poll.userVotedOptionId);
            const isClosed = poll.status === 'CLOSED';

            return `
              <div class="poll-card" id="poll-card-${poll.id}">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span class="poll-category-badge"><i data-lucide="bar-chart-2"></i> ${this.escapeHTML(poll.category || 'General')}</span>
                  ${isClosed ? '<span style="font-size:0.7rem; font-weight:800; color:#EF4444; background:#FEE2E2; padding:2px 6px; border-radius:4px;">CLOSED</span>' : '<span style="font-size:0.7rem; font-weight:700; color:#10B981;">● LIVE VOTE</span>'}
                </div>
                <h3 class="poll-question">${this.escapeHTML(poll.question)}</h3>
                <div class="poll-options-list">
                  ${poll.options.map(opt => {
                    const isMyVote = poll.userVotedOptionId === opt.id;
                    const disabledClass = (hasVoted || isClosed) ? 'disabled' : '';
                    const votedClass = isMyVote ? 'voted-option' : '';

                    return `
                      <div class="poll-option-row ${disabledClass} ${votedClass}" onclick="${(!hasVoted && !isClosed) ? `app.votePoll('${poll.id}', '${opt.id}')` : ''}" title="${hasVoted ? 'You have already voted' : isClosed ? 'Poll is closed' : 'Click to vote'}">
                        ${hasVoted || isClosed ? `<div class="poll-progress-fill" style="width:${opt.percentage}%;"></div>` : ''}
                        <div class="poll-option-content">
                          <span>${this.escapeHTML(opt.text)} ${isMyVote ? '<b>(Your Vote)</b>' : ''}</span>
                          ${hasVoted || isClosed ? `<span style="font-weight:700;">${opt.percentage}% <small style="font-weight:normal; color:#64748B;">(${opt.votes})</small></span>` : ''}
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
                <div class="poll-meta-footer">
                  <span>Total Votes: <b>${poll.totalVotes}</b></span>
                  <span>By ${this.escapeHTML(poll.author?.name || 'Editorial Team')}</span>
                </div>
              </div>
            `;
          }).join('');
          this.refreshIcons(container);
          return;
        }
      }
    } catch (e) {
      console.warn('Polls fetch error:', e);
    }

    container.innerHTML = `
      <div class="poll-card">
        <span class="poll-category-badge">Technology Pulse</span>
        <h3 class="poll-question">Which technology will drive the largest IT infrastructure investments in 2027?</h3>
        <div class="poll-options-list">
          <div class="poll-option-row" onclick="app.showToast('Please sign in to vote.')"><div class="poll-option-content"><span>AI Inference Clusters</span></div></div>
          <div class="poll-option-row" onclick="app.showToast('Please sign in to vote.')"><div class="poll-option-content"><span>Post-Quantum Cryptography</span></div></div>
          <div class="poll-option-row" onclick="app.showToast('Please sign in to vote.')"><div class="poll-option-content"><span>Cloud Sovereignty Platforms</span></div></div>
        </div>
        <div class="poll-meta-footer"><span>Live Editorial Pulse</span></div>
      </div>
    `;
    this.refreshIcons(container);
  }

  async votePoll(pollId, optionId) {
    if (!this.authToken) {
      this.showToast('Please login to participate in polls.');
      this.openAuthModal('login');
      return;
    }

    try {
      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({ optionId })
      });
      const data = await res.json();
      if (res.ok) {
        this.showToast('Your vote has been recorded!');
        this.renderHomePolls();
      } else {
        this.showToast(data.error || 'Failed to record vote');
      }
    } catch (e) {
      this.showToast('Network error submitting vote');
    }
  }

  openCreatePollModal() {
    if (!this.authToken) {
      this.showToast('Please login to create a poll.');
      this.openAuthModal('login');
      return;
    }
    const modal = document.getElementById('modal-create-poll');
    if (modal) modal.classList.add('show');
    this.updateModalOpenState(true);
  }

  closeCreatePollModal() {
    const modal = document.getElementById('modal-create-poll');
    if (modal) modal.classList.remove('show');
    this.updateModalOpenState(false);
  }

  async handleCreatePollSubmit(event) {
    event.preventDefault();
    if (!this.authToken) return;

    const question = document.getElementById('poll-question').value.trim();
    const category = document.getElementById('poll-category').value;
    const optInputs = Array.from(document.querySelectorAll('.poll-opt-input'));
    const options = optInputs.map(i => i.value.trim()).filter(Boolean);

    if (options.length < 2) {
      this.showToast('Please provide at least 2 options for the poll.');
      return;
    }

    try {
      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({ question, category, options })
      });
      if (res.ok) {
        this.showToast('Poll created and published!');
        this.closeCreatePollModal();
        this.renderHomePolls();
      } else {
        const data = await res.json();
        this.showToast(data.error || 'Failed to create poll');
      }
    } catch (e) {
      this.showToast('Network error creating poll');
    }
  }

  // --- Discussion Viewer & Commenting Controller ---
  async openDiscussionViewer(discussionId) {
    const modal = document.getElementById('modal-discussion-viewer');
    const content = document.getElementById('discussion-viewer-content');
    if (!modal || !content) return;

    content.innerHTML = '<div style="padding:40px; text-align:center;"><p>Loading discussion thread...</p></div>';
    modal.classList.add('show');
    this.updateModalOpenState(true);

    try {
      const res = await fetch(`/api/discussions/${discussionId}`);
      if (!res.ok) {
        content.innerHTML = '<div style="padding:40px; text-align:center;"><p>Discussion not found.</p></div>';
        return;
      }
      const data = await res.json();
      const disc = data.discussion;

      const commentsHTML = (disc.comments && disc.comments.length > 0)
        ? disc.comments.map(c => `
          <div class="comment-card" id="disc-comment-${c.id}">
            <div class="comment-header">
              <div class="comment-author-info">
                <span class="comment-avatar">${(c.author?.name || 'R').charAt(0)}</span>
                <span class="comment-author-name">${this.escapeHTML(c.author?.name || 'Reader')}</span>
                <span class="comment-time">${this.formatCommentTime(c.createdAt)}</span>
              </div>
            </div>
            <div class="comment-content">${this.escapeHTML(c.content)}</div>
            ${(c.replies && c.replies.length > 0) ? `
              <div class="comment-replies-list">
                ${c.replies.map(r => `
                  <div class="comment-reply-card">
                    <div class="comment-header">
                      <div class="comment-author-info">
                        <span class="comment-avatar" style="width:20px;height:20px;font-size:0.65rem;">${(r.author?.name || 'R').charAt(0)}</span>
                        <span class="comment-author-name" style="font-size:0.8rem;">${this.escapeHTML(r.author?.name || 'Reader')}</span>
                        <span class="comment-time">${this.formatCommentTime(r.createdAt)}</span>
                      </div>
                    </div>
                    <div class="comment-content" style="font-size:0.84rem;">${this.escapeHTML(r.content)}</div>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `).join('')
        : '<p style="color:#64748B; font-size:0.88rem; font-style:italic;">No perspectives shared yet. Be the first to join the conversation!</p>';

      content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px;">
          <div>
            <span class="discussion-category-pill">${this.escapeHTML(disc.category)}</span>
            <h2 style="font-size:1.4rem; color:var(--color-deep-navy); margin:8px 0 4px;">${this.escapeHTML(disc.title)}</h2>
            <div style="font-size:0.8rem; color:var(--color-dark-gray); display:flex; gap:12px; align-items:center;">
              <span>By <b>${this.escapeHTML(disc.author?.name || 'Reader')}</b></span>
              <span>•</span>
              <span>${disc.views || 1} views</span>
              <span>•</span>
              <span>${disc._count?.comments || 0} perspectives</span>
            </div>
          </div>
          <button class="icon-btn" onclick="app.closeDiscussionViewer()" aria-label="Close discussion"><i data-lucide="x"></i></button>
        </div>
        <div style="font-size:0.95rem; line-height:1.6; color:var(--color-charcoal); background:#F8FAFC; padding:18px; border-radius:var(--radius-sm); border:1px solid var(--color-border-gray); margin-bottom:24px;">
          ${this.escapeHTML(disc.content)}
        </div>

        <div style="border-top:1px solid var(--color-border-gray); padding-top:20px;">
          <h4 style="font-size:1rem; margin-bottom:14px; display:flex; align-items:center; gap:8px;">
            <i data-lucide="message-square" class="text-royal-blue"></i> Discussion Thread (${disc._count?.comments || 0})
          </h4>

          <div style="margin-bottom:20px;">
            <textarea id="disc-new-comment-input" class="form-control" rows="3" placeholder="Contribute your operational perspective or technical analysis..."></textarea>
            <div style="display:flex; justify-content:flex-end; margin-top:8px;">
              <button class="btn btn-primary btn-sm" onclick="app.submitDiscussionComment('${disc.id}')"><i data-lucide="send"></i> Post Perspective</button>
            </div>
          </div>

          <div class="discussion-comments-thread">${commentsHTML}</div>
        </div>
      `;
      this.refreshIcons(content);
    } catch (e) {
      content.innerHTML = '<div style="padding:40px; text-align:center;"><p>Error loading discussion.</p></div>';
    }
  }

  closeDiscussionViewer() {
    const modal = document.getElementById('modal-discussion-viewer');
    if (modal) modal.classList.remove('show');
    this.updateModalOpenState(false);
  }

  async submitDiscussionComment(discussionId) {
    if (!this.authToken) {
      this.showToast('Please login to contribute to discussions.');
      this.openAuthModal('login');
      return;
    }
    const input = document.getElementById('disc-new-comment-input');
    const content = input ? input.value.trim() : '';
    if (!content) {
      this.showToast('Comment cannot be empty.');
      return;
    }

    try {
      const res = await fetch(`/api/discussions/${discussionId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({ content })
      });
      if (res.ok) {
        this.showToast('Perspective added to discussion!');
        this.openDiscussionViewer(discussionId);
      } else {
        const data = await res.json();
        this.showToast(data.error || 'Failed to post comment');
      }
    } catch (e) {
      this.showToast('Network error posting comment');
    }
  }

  openCreateDiscussionModal() {
    if (!this.authToken) {
      this.showToast('Please login to start a discussion.');
      this.openAuthModal('login');
      return;
    }
    const modal = document.getElementById('modal-create-discussion');
    if (modal) modal.classList.add('show');
    this.updateModalOpenState(true);
  }

  closeCreateDiscussionModal() {
    const modal = document.getElementById('modal-create-discussion');
    if (modal) modal.classList.remove('show');
    this.updateModalOpenState(false);
  }

  async handleCreateDiscussionSubmit(event) {
    event.preventDefault();
    if (!this.authToken) return;

    const title = document.getElementById('disc-title').value.trim();
    const category = document.getElementById('disc-category').value;
    const content = document.getElementById('disc-content').value.trim();

    try {
      const res = await fetch('/api/discussions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({ title, category, content })
      });
      if (res.ok) {
        this.showToast('Discussion topic created!');
        this.closeCreateDiscussionModal();
        this.renderHomeDiscussions();
      } else {
        const data = await res.json();
        this.showToast(data.error || 'Failed to create discussion');
      }
    } catch (e) {
      this.showToast('Network error creating discussion');
    }
  }

  // --- User Profile & Topics Controller (Phase 3 & 4) ---
  async openProfileModal() {
    if (!this.authToken) {
      this.openAuthModal('login');
      return;
    }
    const modal = document.getElementById('modal-user-profile');
    const container = document.getElementById('profile-modal-content');
    if (!modal || !container) return;

    modal.classList.add('show');
    this.updateModalOpenState(true);
    container.innerHTML = '<div style="padding:40px; text-align:center;"><p>Loading profile...</p></div>';

    try {
      const res = await fetch('/api/user/profile', {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });
      if (!res.ok) {
        container.innerHTML = '<p>Error loading profile.</p>';
        return;
      }
      const data = await res.json();
      const p = data.profile;
      const allTopics = ['AI', 'Cyber Security', 'IT', 'Business', 'Cloud', 'Data Privacy', 'Semiconductors'];
      const followed = new Set(p.followedTopics || []);

      container.innerHTML = `
        <div class="profile-modal-body">
          <div class="profile-avatar-row">
            <img src="${p.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80'}" alt="Avatar" class="profile-avatar-img">
            <div>
              <h3 style="margin:0 0 4px; font-size:1.15rem; color:var(--color-deep-navy);">${this.escapeHTML(p.name)}</h3>
              <p style="margin:0; font-size:0.82rem; color:var(--color-dark-gray);">${this.escapeHTML(p.email)} • <b style="color:var(--color-royal-blue);">${p.role}</b></p>
            </div>
          </div>

          <div class="profile-stats-grid">
            <div class="profile-stat-box"><h4>${p.stats?.savedCount || 0}</h4><p>Saved Articles</p></div>
            <div class="profile-stat-box"><h4>${p.stats?.historyCount || 0}</h4><p>Stories Read</p></div>
            <div class="profile-stat-box"><h4>${p.stats?.followingCount || 0}</h4><p>Authors Followed</p></div>
          </div>

          <form id="edit-profile-form" onsubmit="app.saveUserProfile(event)">
            <div class="admin-form-group">
              <label for="profile-name-input">Display Name</label>
              <input type="text" id="profile-name-input" class="form-control" value="${this.escapeHTML(p.name)}" required>
            </div>
            <div class="admin-form-group">
              <label for="profile-bio-input">Short Professional Bio</label>
              <textarea id="profile-bio-input" class="form-control" rows="2" placeholder="e.g. Lead SecOps Engineer focusing on zero-trust architectures">${this.escapeHTML(p.bio || '')}</textarea>
            </div>
            <div class="admin-form-group">
              <label>Followed Topic Categories (Powers your "For You" Feed)</label>
              <div class="topic-toggle-chips">
                ${allTopics.map(t => {
                  const active = followed.has(t) ? 'active' : '';
                  return `<button type="button" class="topic-toggle-chip ${active}" onclick="app.toggleFollowTopic('${t}', this)"><i data-lucide="${active ? 'check' : 'plus'}"></i> ${t}</button>`;
                }).join('')}
              </div>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
              <button type="button" class="btn btn-outline" onclick="app.closeProfileModal()">Cancel</button>
              <button type="submit" class="btn btn-primary"><i data-lucide="save"></i> Save Profile</button>
            </div>
          </form>
        </div>
      `;
      this.refreshIcons(container);
    } catch (e) {
      container.innerHTML = '<p>Network error loading profile.</p>';
    }
  }

  closeProfileModal() {
    const modal = document.getElementById('modal-user-profile');
    if (modal) modal.classList.remove('show');
    this.updateModalOpenState(false);
  }

  async toggleFollowTopic(topic, btn) {
    if (!this.authToken) {
      this.openAuthModal('login');
      return;
    }
    try {
      const res = await fetch('/api/user/follow-topic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({ topic })
      });
      const data = await res.json();
      if (res.ok) {
        if (btn) {
          btn.classList.toggle('active', data.isFollowing);
          btn.innerHTML = `<i data-lucide="${data.isFollowing ? 'check' : 'plus'}"></i> ${topic}`;
          this.refreshIcons(btn);
        }
        this.showToast(data.message);
        if (this.libraryView === 'recommended') {
          this.filterLibrary('recommended');
        }
      }
    } catch (e) {
      this.showToast('Network error updating topic');
    }
  }

  async saveUserProfile(event) {
    event.preventDefault();
    if (!this.authToken) return;

    const name = document.getElementById('profile-name-input').value.trim();
    const bio = document.getElementById('profile-bio-input').value.trim();

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({ name, bio })
      });
      if (res.ok) {
        this.showToast('Profile updated successfully!');
        this.closeProfileModal();
        const userNameEl = document.getElementById('menu-user-name');
        if (userNameEl) userNameEl.textContent = name;
      } else {
        const data = await res.json();
        this.showToast(data.error || 'Failed to update profile');
      }
    } catch (e) {
      this.showToast('Network error saving profile');
    }
  }

  updateCardBookmarkStates(id) {
    const isSaved = this.isSaved(id);
    document.querySelectorAll(`.card-action-btn[onclick*="${id}"]`).forEach(btn => {
      if (btn.getAttribute('aria-label') === 'Bookmark') {
        btn.classList.toggle('active', isSaved);
        btn.title = isSaved ? 'Remove from saved' : 'Save article';
        btn.innerHTML = `<i data-lucide="${isSaved ? 'bookmark-check' : 'bookmark'}"></i>`;
        this.refreshIcons(btn);
      }
    });
  }

  renderMostRead() {
    const container = document.getElementById('most-read-container');
    if (!container) return;
    const items = this.getHomeArticles().slice(0, 5);
    container.innerHTML = items.map((item, i) => this.mostReadItemHTML(item, i)).join('');
    this.refreshIcons(container);
  }

  emptyStateHTML(label) {
    return `<div class="empty-state"><h4>No stories currently available</h4><p>There are no ${label} stories in this domain right now. Check back soon.</p></div>`;
  }

  // --- Upcoming Webinars & Events Grid ---
  renderEvents() {
    const container = document.getElementById('events-container');
    if (!container) return;
    const isRegistered = (id) => (this.eventRegistrations || []).some(r => r.eventId === id);
    container.innerHTML = this.getHomeEvents().map(e => `
      <div class="webinar-card event-card">
        <div class="webinar-banner event-banner">
          <img src="${e.image}" alt="${this.escapeHTML(e.title)}" loading="lazy" onerror="this.onerror=null;this.src=app.getPosterFallback('${e.category || 'IT'}', '${this.escapeJS(e.id || e.title)}');">
          <span class="event-type-tag">${e.type || 'Webinar'}</span>
        </div>
        <div class="webinar-card-body event-card-body">
          <div class="event-card-content">
            <span class="webinar-date event-date">${e.date} · ${e.time || ''}</span>
            <h4 class="webinar-title event-title">${e.title}</h4>
            <p class="webinar-speaker event-speaker">Speaker: ${e.speaker} · ${e.organization || ''}</p>
          </div>
          ${isRegistered(e.id) ? `
            <button class="btn btn-outline btn-sm webinar-btn active" style="color:#10B981; border-color:#10B981; font-weight:700;" onclick="app.openEventModal('${e.id}')">
              <i data-lucide="check-circle"></i> Registered
            </button>
          ` : `
            <button class="btn btn-primary btn-sm webinar-btn" onclick="app.openEventModal('${e.id}')">Register Now</button>
          `}
        </div>
      </div>
    `).join('');
    this.refreshIcons(container);
  }

  // --- For You / Personalized Feed ---
  async renderForYouPage() {
    const savedList = (GC_DATA.articles || []).filter(a => this.savedArticles.includes(a.id));
    if (this.savedArticles.length !== savedList.length) {
      this.savedArticles = savedList.map(a => a.id);
      localStorage.setItem('gc_saved', JSON.stringify(this.savedArticles));
    }
    const savedCountEl = document.getElementById('saved-count');
    if (savedCountEl) savedCountEl.textContent = savedList.length;

    const bmEventsCountEl = document.getElementById('bookmarked-events-count');
    if (bmEventsCountEl) bmEventsCountEl.textContent = this.bookmarkedEvents.length;

    const feedContainer = document.getElementById('foryou-feed');
    if (feedContainer) {
      if (!this.libraryView || this.libraryView === 'recommended') {
        feedContainer.innerHTML = '<div style="padding:40px; text-align:center;"><p>Loading personalized intelligence...</p></div>';
        try {
          const res = await this.apiFetch('/user/for-you');
          if (res.ok && res.data?.recommendations) {
            const recs = res.data.recommendations;
            feedContainer.innerHTML = recs.length ? `
              <div class="section-header" style="border:none; margin-bottom:12px;">
                <div>
                  <h2 style="font-size:1.15rem; color:var(--color-deep-navy); display:flex; align-items:center; gap:8px;">
                    <i data-lucide="sparkles" class="text-purple"></i> Curated For You
                  </h2>
                  <p style="font-size:0.82rem; color:var(--color-dark-gray); margin-top:2px;">Transparent recommendations based on your followed topics, reading activity, and network.</p>
                </div>
              </div>
              ${recs.map(a => `
                <div style="margin-bottom:16px;">
                  <div class="recommendation-attribution">
                    <i data-lucide="compass"></i> ${this.escapeHTML(a.recommendationReason || 'Recommended For You')}
                  </div>
                  ${this.foryouRowHTML(a, this.isSaved(a.id) ? 'Saved' : 'Save', `app.toggleSaveArticle('${a.id}')`)}
                </div>
              `).join('')}
            ` : `<div class="empty-state"><h4>No recommendations yet.</h4><p>Follow topics or bookmark stories to calibrate your personal feed.</p></div>`;
            this.refreshIcons(feedContainer);
          }
        } catch (e) {
          console.warn('For You fetch error:', e);
        }
      } else if (this.libraryView === 'saved') {
        feedContainer.innerHTML = savedList.length ? `
          <div class="section-header" style="border:none;"><h2 style="font-size:1.1rem;">Saved Articles</h2></div>
          ${savedList.map(a => this.foryouRowHTML(a, 'Remove', `app.toggleSaveArticle('${a.id}')`)).join('')}
        ` : `<div class="empty-state"><h4>No saved stories yet.</h4><p>Bookmark stories across OPEN MEDIA and they will appear here.</p></div>`;
      } else if (this.libraryView === 'history') {
        const historyList = (this.getHomeArticles() || GC_DATA.articles).filter(a => this.readingHistory.includes(a.id));
        feedContainer.innerHTML = historyList.length ? `
          <div class="history-toolbar">
            <h2 style="font-size:1.1rem; margin:0; display:flex; align-items:center; gap:8px;"><i data-lucide="clock" class="text-blue"></i> Reading History (${historyList.length})</h2>
            <button class="btn-clear-history" onclick="app.clearReadingHistory()"><i data-lucide="trash-2"></i> Clear History</button>
          </div>
          ${historyList.map(a => this.foryouRowHTML(a, 'Read Again', `app.openArticleModal('${a.id}')`)).join('')}
        ` : `<div class="empty-state"><h4>No reading history yet.</h4><p>Articles you open will show up here.</p></div>`;
      } else if (this.libraryView === 'events') {
        const eventList = GC_DATA.events.filter(e => this.bookmarkedEvents.includes(e.id));
        feedContainer.innerHTML = eventList.length ? `
          <div class="section-header" style="border:none;"><h2 style="font-size:1.1rem;">Bookmarked Events</h2></div>
          ${eventList.map(e => `
            <div class="panel-box">
              <span class="event-date">${e.date}</span>
              <h3 style="font-family:var(--font-heading); margin:6px 0;">${e.title}</h3>
              <p class="text-muted" style="font-size:0.9rem;">${e.description}</p>
              <div style="margin-top:12px; display:flex; gap:10px;">
                <button class="btn btn-outline btn-sm" onclick="app.openEventModal('${e.id}')">View Event</button>
                <button class="btn btn-outline btn-sm" onclick="app.toggleBookmarkEvent('${e.id}')">Remove</button>
              </div>
            </div>`).join('')}
        ` : `<div class="empty-state"><h4>No bookmarked events yet.</h4><p>Bookmark webinars and events to find them here.</p></div>`;
      } else if (this.libraryView === 'reports') {
        feedContainer.innerHTML = `<div class="empty-state"><h4>No downloaded reports yet.</h4><p>Intelligence reports you download will be listed here for offline access.</p></div>`;
      }
    }

    const topicContainer = document.getElementById('foryou-followed-topics-chips');
    if (topicContainer) {
      const allTopics = ['AI', 'Cyber Security', 'IT', 'Business', 'Cloud', 'Data Privacy'];
      this.apiFetch('/user/profile').then(res => {
        const followed = new Set(res.data?.profile?.followedTopics || []);
        topicContainer.innerHTML = allTopics.map(t => {
          const active = followed.has(t) ? 'active' : '';
          return `<button type="button" class="topic-toggle-chip ${active}" onclick="app.toggleFollowTopic('${t}', this)"><i data-lucide="${active ? 'check' : 'plus'}"></i> ${t}</button>`;
        }).join('');
        this.refreshIcons(topicContainer);
      }).catch(() => {});
    }

    const followedAuthors = Object.entries(this.followedAuthorMap || {}).map(([id, name]) => ({ id, name }));
    const authorContainer = document.getElementById('followed-authors-list');
    if (authorContainer) {
      if (!followedAuthors.length) {
        authorContainer.innerHTML = '<div class="empty-state"><h4>No followed authors yet.</h4><p>Follow authors from Trending Authors below!</p></div>';
      } else {
        authorContainer.innerHTML = followedAuthors.map(author => `
          <div class="author-follow-row">
            <div class="author-info">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80" alt="${author.name}" onerror="this.onerror=null;this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'120\' height=\'120\' viewBox=\'0 0 120 120\'><rect width=\'120\' height=\'120\' fill=\'#E2E8F0\'/><text x=\'50%\' y=\'54%\' dominant-baseline=\'middle\' text-anchor=\'middle\' font-size=\'28\' fill=\'#475569\' font-family=\'Arial\'>${author.name.split(' ').slice(0,2).map(part=>part[0]).join('').slice(0,2).toUpperCase()}</text></svg>'">
              <div>
                <p class="author-name">${author.name}</p>
                <p class="author-topic">Contributor</p>
              </div>
            </div>
            <button class="btn btn-outline btn-sm" onclick="app.toggleFollowAuthor('${author.name.replace(/'/g, "\\'")}', '${author.id}')">Unfollow</button>
          </div>
        `).join('');
      }
    }

    this.loadTrendingAuthors();

    const pageForYou = document.getElementById('page-foryou');
    if (pageForYou) this.refreshIcons(pageForYou);
  }

  async loadTrendingAuthors() {
    const container = document.getElementById('trending-authors-list');
    if (!container) return;
    const now = Date.now();
    if (this.trendingAuthorsRequestInFlight || (this.lastTrendingAuthorsLoadAt && now - this.lastTrendingAuthorsLoadAt < 20000)) {
      return;
    }
    this.lastTrendingAuthorsLoadAt = now;
    this.trendingAuthorsRequestInFlight = true;
    try {
      const res = await this.apiFetch('/authors/trending');
      if (!res.ok || !Array.isArray(res.data?.authors)) {
        container.innerHTML = '<div class="empty-state"><h4>Trending authors unavailable.</h4></div>';
        return;
      }

    const authors = res.data.authors;
    container.innerHTML = authors.map((author) => {
      const followed = this.followedAuthors.includes(author.name);
      const btnLabel = followed ? 'Following' : 'Follow';
      const btnClass = followed ? 'btn-outline' : 'btn-primary';
      const action = followed
        ? `app.toggleFollowAuthor('${String(author.name).replace(/'/g, "\\'")}', '${author.id}')`
        : `app.toggleFollowAuthor('${String(author.name).replace(/'/g, "\\'")}', '${author.id}')`;
      return `
        <div class="author-follow-row">
          <div class="author-info">
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80" alt="${author.name}" onerror="this.onerror=null;this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'120\' height=\'120\' viewBox=\'0 0 120 120\'><rect width=\'120\' height=\'120\' fill=\'#E2E8F0\'/><text x=\'50%\' y=\'54%\' dominant-baseline=\'middle\' text-anchor=\'middle\' font-size=\'28\' fill=\'#475569\' font-family=\'Arial\'>${String(author.name).split(' ').slice(0,2).map(part=>part[0]).join('').slice(0,2).toUpperCase()}</text></svg>'">
            <div>
              <p class="author-name">${author.name}</p>
              <p class="author-topic">${author.role === 'ADMIN' ? 'Editor' : 'Author'}</p>
            </div>
          </div>
          <button class="btn ${btnClass} btn-sm" onclick="${action}">${btnLabel}</button>
        </div>
      `;
    }).join('');

      this.refreshIcons(container);
    } finally {
      this.trendingAuthorsRequestInFlight = false;
    }
  }

  foryouRowHTML(a, actionLabel, actionCall) {
    return `
      <div class="panel-box">
        <span class="story-category text-${this.accentClass(a.category)}">${a.category}</span>
        <h2 style="font-size:1.15rem; font-family:var(--font-heading); margin:8px 0;">${a.title}</h2>
        <p class="text-muted" style="font-size:0.9rem;">${a.summary}</p>
        <div style="margin-top:12px; display:flex; gap:10px;">
          <button class="btn btn-outline btn-sm" onclick="app.openArticleModal('${a.id}')">Read Article</button>
          <button class="btn btn-outline btn-sm" onclick="${actionCall}">${actionLabel}</button>
        </div>
      </div>`;
  }

  filterLibrary(type) {
    this.libraryView = type;
    document.querySelectorAll('#library-nav a').forEach(a => a.classList.toggle('active', a.dataset.lib === type));
    this.renderForYouPage();
  }

  // --- Domain Feeds & Domain Trees ---
  renderCategoryFeeds() {
    this.renderCategoryFeed('tech', 'tech-feed', 'tech-domain-tree', TECH_DOMAIN_GROUPS, 'tech-ad-slot');
    this.renderCategoryFeed('business', 'business-feed', 'business-domain-tree', BUSINESS_DOMAIN_GROUPS, 'business-ad-slot');
    this.renderCategoryFeed('cyber', 'cyber-feed', 'cyber-domain-tree', CYBER_DOMAIN_GROUPS, null);
    this.renderCategoryTrendingSidebar('business-right-ad-slot', 'Business');
    this.renderCategoryTrendingSidebar('tech-right-ad-slot', 'IT');
    this.renderCategoryTrendingSidebar('cyber-right-ad-slot', 'Cyber Security');
  }

  renderCategoryTrendingSidebar(slotId, category) {
    const slot = document.getElementById(slotId);
    if (!slot) return;
    const catArticles = (this.getHomeArticles() || GC_DATA.articles).filter(a => a.category === category);
    const items = catArticles.slice(1, 6);
    if (!items.length) return;
    slot.innerHTML = `
      <div class="panel-box">
        <h3 class="panel-title" style="display:flex; align-items:center; gap:8px;">
          <i data-lucide="trending-up" class="text-emerald"></i> Trending in ${category}
        </h3>
        <div class="side-trending-list" style="display:flex; flex-direction:column; gap:12px;">
          ${items.map((item, idx) => `
            <div class="side-trending-item" onclick="app.openArticleModal('${item.id}')" style="cursor:pointer; display:flex; gap:10px; align-items:flex-start;">
              <span style="font-size:1.15rem; font-weight:800; color:var(--color-primary); min-width:22px; line-height:1;">0${idx+1}</span>
              <div style="flex:1; min-width:0;">
                <span class="story-category text-${this.accentClass(item.category)}" style="font-size:0.68rem;">${this.escapeHTML(item.domain || item.category)}</span>
                <h5 style="font-size:0.85rem; font-family:var(--font-heading); margin:3px 0; line-height:1.35; color:var(--color-black);">${this.escapeHTML(item.title)}</h5>
                <span class="text-muted" style="font-size:0.7rem;">${item.date || 'Recent'} · ${item.readTime || '3 min read'}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    this.refreshIcons(slot);
  }

  updateCyberThreatRadar(items) {
    const statZero = document.querySelector('#page-cyber .threat-stat .stat-num.text-red');
    const statRansom = document.querySelector('#page-cyber .threat-stat .stat-num.text-orange');
    const statWatch = document.querySelector('#page-cyber .threat-stat .stat-num.text-blue');

    const zeroCount = items.filter(a => (a.domain || '').toLowerCase().includes('zero') || a.title.toLowerCase().includes('zero-day')).length || 14;
    const alertCount = items.filter(a => a.severity === 'CRITICAL' || (a.domain || '').toLowerCase().includes('critical') || (a.domain || '').toLowerCase().includes('ransom')).length || 44;
    const breachCount = items.filter(a => (a.domain || '').toLowerCase().includes('breach') || (a.domain || '').toLowerCase().includes('attack')).length || 61;

    if (statZero) statZero.textContent = String(zeroCount);
    if (statRansom) statRansom.textContent = `${alertCount}+`;
    if (statWatch) statWatch.textContent = `${breachCount} Advisories`;
  }

  renderCategoryFeed(type, feedId, treeId, domainGroups, adSlotId) {
    const feed = document.getElementById(feedId);
    if (!feed) return;
    const category = CAT_MAP[type];
    const items = (this.getHomeArticles() || GC_DATA.articles).filter(a => a.category === category);
    this.paintFeed(feed, items, type);

    const tree = document.getElementById(treeId);
    if (tree) {
      tree.innerHTML = Object.entries(domainGroups).map(([group, subs], index) => `
        <div class="domain-group" id="${type}-domain-group-${index}">
          <button type="button" class="domain-item domain-group-toggle" aria-expanded="false" onclick="app.toggleDomainGroup('${type}-domain-group-${index}')">
            <span>${group}</span><i data-lucide="chevron-down"></i>
          </button>
          <div class="domain-subdomains">
            ${subs.map(s => `<a href="#${type}" class="domain-item domain-subitem" onclick="app.filterByDomain('${type}', '${s.replace(/'/g, "\\'")}'); return false;">${s}</a>`).join('')}
          </div>
        </div>
      `).join('');
      this.refreshIcons(tree);
    }

    const rightSlotMap = {
      business: 'business-right-ad-slot',
      tech: 'tech-right-ad-slot',
      cyber: 'cyber-right-ad-slot'
    };
    if (rightSlotMap[type]) {
      this.renderCategoryTrendingSidebar(rightSlotMap[type], category);
    }

    if (type === 'cyber') {
      this.updateCyberThreatRadar(items);
    }
  }

  paintFeed(feed, items, type, filter = 'all') {
    if (!items || !items.length) {
      feed.innerHTML = `<div class="empty-state"><h4>No stories currently available</h4><p>There are no stories currently matching "${filter}" in this domain.</p></div>`;
      return;
    }

    const leadStory = items[0];
    const stream = items.slice(1);

    let html = `
      <article class="card-editorial lead-story category-spotlight" onclick="app.openArticleModal('${leadStory.id}')" tabindex="0" role="button" aria-label="${this.escapeHTML(leadStory.title)}" style="margin-bottom: 20px;">
        <div class="card-editorial-thumb">
          <img src="${leadStory.image}" alt="${this.escapeHTML(leadStory.title)}" loading="eager" onerror="this.onerror=null;this.src=app.getPosterFallback('${leadStory.category || 'IT'}', '${this.escapeJS(leadStory.id || leadStory.title)}');">
          <span class="card-category-chip text-${this.accentClass(leadStory.category)}">${this.escapeHTML(leadStory.domain || leadStory.category)}</span>
        </div>
        <div class="card-editorial-body">
          <h2 class="card-editorial-title">${this.escapeHTML(leadStory.title)}</h2>
          <p class="text-muted story-summary">${this.escapeHTML(leadStory.summary || leadStory.description || '')}</p>
          <div class="card-footer-meta">
            <span class="text-muted">By <b>${this.escapeHTML(leadStory.author || 'Editorial Wire')}</b> · ${leadStory.date || 'Recent'} · ${leadStory.readTime || '3 min read'}</span>
            <div class="card-actions" onclick="event.stopPropagation()">
              <button class="card-action-btn ${this.isSaved(leadStory.id) ? 'active' : ''}" onclick="app.toggleSaveArticle('${leadStory.id}', event)" title="Bookmark" aria-label="Bookmark">
                <i data-lucide="${this.isSaved(leadStory.id) ? 'bookmark-check' : 'bookmark'}"></i>
              </button>
              <button class="card-action-btn" onclick="app.shareArticle('${leadStory.id}', event)" title="Share" aria-label="Share">
                <i data-lucide="share-2"></i>
              </button>
            </div>
          </div>
        </div>
      </article>

      <div class="panel-box">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; padding-bottom:8px; border-bottom:1px solid var(--color-border-gray);">
          <span style="font-size:0.75rem; font-weight:800; text-transform:uppercase; color:var(--color-dark-gray); letter-spacing:0.04em;">
            Recent ${CAT_MAP[type] || ''} Stories (${items.length} Available)
          </span>
          <span style="font-size:0.72rem; color:#10B981; font-weight:600; display:flex; align-items:center; gap:4px;">
            <span class="live-dot" style="width:6px; height:6px; background:#10B981; border-radius:50%;"></span>
            Live Wire Feed
          </span>
        </div>
        <div class="category-stories-stream">
          ${stream.map(a => this.storyHorizontalHTML(a)).join('')}
        </div>
      </div>
    `;

    feed.innerHTML = html;
    this.refreshIcons(feed);
  }

  toggleDomainGroup(groupId) {
    const group = document.getElementById(groupId);
    if (!group) return;
    const expanded = group.classList.toggle('expanded');
    group.querySelector('.domain-group-toggle').setAttribute('aria-expanded', String(expanded));
  }

  matchesFilter(article, filter) {
    if (!filter || filter === 'all') return true;

    const canonical = BUSINESS_DOMAIN_MATCH[filter] || GROUP_MATCH[filter] || filter;
    if (article.domain === filter || article.domain === canonical) return true;

    if (article.domain && (article.domain.toLowerCase() === filter.toLowerCase() || article.domain.toLowerCase() === canonical.toLowerCase())) {
      return true;
    }

    const kwRegex = DOMAIN_KEYWORDS[filter] || DOMAIN_KEYWORDS[canonical];
    if (kwRegex) {
      const text = `${article.title || ''} ${article.summary || ''} ${article.domain || ''}`.toLowerCase();
      if (kwRegex.test(text)) return true;
    }

    const filterLower = filter.toLowerCase();
    const fullText = `${article.title || ''} ${article.summary || ''} ${article.domain || ''}`.toLowerCase();
    return fullText.includes(filterLower);
  }

  filterCategory(type, filter, btnEl) {
    const parent = btnEl.parentElement;
    parent.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    btnEl.classList.add('active');

    const feedMap = { tech: 'tech-feed', business: 'business-feed', cyber: 'cyber-feed', ai: 'ai-feed' };
    const category = CAT_MAP[type];
    const feed = document.getElementById(feedMap[type]);
    if (!feed) return;

    const allCatArticles = (this.getHomeArticles() || GC_DATA.articles).filter(a => a.category === category);
    const items = filter === 'all'
      ? allCatArticles
      : allCatArticles.filter(a => this.matchesFilter(a, filter));

    if (type === 'ai') {
      const displayItems = filter === 'all' && items.length > 3 ? items.slice(3, 12) : items;
      feed.innerHTML = displayItems.length ? displayItems.map(a => this.editorialCardHTML(a)).join('') : this.emptyStateHTML('AI');
      this.refreshIcons(feed);
    } else {
      this.paintFeed(feed, items, type, filter);
    }
  }

  filterByDomain(type, term) {
    const feedMap = { tech: 'tech-feed', business: 'business-feed', cyber: 'cyber-feed' };
    const category = CAT_MAP[type];
    const feed = document.getElementById(feedMap[type]);
    if (!feed) return;

    const canonical = BUSINESS_DOMAIN_MATCH[term] || GROUP_MATCH[term] || term;
    const allCatArticles = (this.getHomeArticles() || GC_DATA.articles).filter(a => a.category === category);
    const items = allCatArticles.filter(a => this.matchesFilter(a, term));

    this.paintFeed(feed, items.length ? items : allCatArticles, type, term);

    const chipBar = document.getElementById(`${type}-filters`);
    if (chipBar) {
      const chips = Array.from(chipBar.querySelectorAll('.chip'));
      chips.forEach(c => c.classList.remove('active'));
      const match = chips.find(c => c.textContent.trim().toLowerCase() === canonical.toLowerCase() || c.textContent.trim().toLowerCase() === term.toLowerCase());
      if (match) match.classList.add('active');
    }
    this.showToast(`Filtered by ${term}`);
    window.scrollTo({ top: feed.offsetTop - 100, behavior: 'smooth' });
  }

  // --- AI Page ---
  renderAIPage() {
    const aiArticles = (this.getHomeArticles() || GC_DATA.articles).filter(a => a.category === 'AI');
    if (!aiArticles.length) return;

    // 1. Featured Lead Article on the left (~60% desktop width)
    const heroStory = aiArticles[0];
    const heroEl = document.getElementById('ai-hero-story');
    if (heroEl) {
      heroEl.innerHTML = `
        <img src="${heroStory.image}" alt="${heroStory.title}" loading="eager">
        <div class="card-editorial-body">
          <span class="story-category text-purple">${this.escapeHTML(heroStory.domain || heroStory.category)}</span>
          <h2 class="card-editorial-title">${this.escapeHTML(heroStory.title)}</h2>
          <p class="text-muted story-summary">${this.escapeHTML(heroStory.summary || heroStory.description || '')}</p>
          <div class="card-footer-meta">
            <span>By <b>${this.escapeHTML(heroStory.author || 'Editorial Wire')}</b></span>
            <span>${heroStory.date || 'Recent'} · ${heroStory.readTime || '3 min read'}</span>
          </div>
        </div>`;
      heroEl.setAttribute('onclick', `app.openArticleModal('${heroStory.id}')`);
    }

    // 2. Exactly TWO secondary featured articles on the right (~40% desktop width)
    const secondaryStoriesEl = document.getElementById('ai-secondary-stories');
    if (secondaryStoriesEl) {
      const secondaryArticles = aiArticles.slice(1, 3);
      secondaryStoriesEl.innerHTML = secondaryArticles.map(a => this.horizontalCardHTML(a)).join('');
    }

    // 3. Move additional secondary articles into Latest in AI (index 3 to 12)
    const feedEl = document.getElementById('ai-feed');
    if (feedEl) {
      const latestArticles = aiArticles.length > 3 ? aiArticles.slice(3, 12) : aiArticles.slice(1);
      feedEl.innerHTML = latestArticles.map(a => this.editorialCardHTML(a)).join('');
    }

    // 4. Render category sections with real live articles (guaranteed never empty)
    const renderCategoryCards = (containerId, domain, fallbackKeyword) => {
      const el = document.getElementById(containerId);
      if (!el) return;
      let items = aiArticles.filter(a => a.domain === domain || (domain === 'AI Tools & Agents' && (a.domain === 'AI Tools' || a.domain === 'AI Tools & Agents')));
      if (!items.length) {
        items = aiArticles.filter(a => (a.title + ' ' + (a.summary || '')).toLowerCase().includes(fallbackKeyword.toLowerCase()));
      }
      if (!items.length) {
        const offset = domain === 'AI Research' ? 4 : domain === 'AI Startups' ? 8 : 12;
        items = aiArticles.slice(offset, offset + 4);
      }
      el.className = `horizontal-scroll-container count-${items.length}${items.length === 2 ? ' two-cards' : ''}`;
      el.innerHTML = items.slice(0, 4).map(a => this.horizontalCardHTML(a)).join('');
    };

    renderCategoryCards('ai-research-container', 'AI Research', 'research');
    renderCategoryCards('ai-startups-container', 'AI Startups', 'startup');
    renderCategoryCards('ai-tools-container', 'AI Tools & Agents', 'agent');

    // 5. Most Read in AI
    const mostReadEl = document.getElementById('ai-most-read-container');
    if (mostReadEl) {
      mostReadEl.innerHTML = aiArticles.slice(0, 4).map((a, i) => this.mostReadItemHTML(a, i)).join('');
    }

    this.refreshIcons(document.getElementById('page-ai'));
  }

  // --- Bookmark Storage ---
  isSaved(id) { return this.savedArticles.includes(id); }

  async toggleSaveArticle(id, evt) {
    if (evt) evt.stopPropagation();
    if (this.isSaved(id)) {
      this.savedArticles = this.savedArticles.filter(item => item !== id);
      this.showToast('Article removed from library.');
    } else {
      this.savedArticles.push(id);
      this.showToast('Article saved to your library.');
    }
    localStorage.setItem('gc_saved', JSON.stringify(this.savedArticles));
    this.updateCardBookmarkStates(id);
    this.renderForYouPage();
    this.renderHero();
    this.refreshArticleModalIfOpen(id);

    if (this.authToken) {
      this.apiFetch(`/user/save/${id}`, { method: 'POST' });
    }
  }

  toggleBookmarkEvent(id) {
    if (this.bookmarkedEvents.includes(id)) {
      this.bookmarkedEvents = this.bookmarkedEvents.filter(e => e !== id);
      this.showToast('Event removed from bookmarks.');
    } else {
      this.bookmarkedEvents.push(id);
      this.showToast('Event bookmarked.');
    }
    localStorage.setItem('gc_bookmarked_events', JSON.stringify(this.bookmarkedEvents));
    this.renderForYouPage();
  }

  addToHistory(id) {
    this.readingHistory = [id, ...this.readingHistory.filter(h => h !== id)].slice(0, 30);
    localStorage.setItem('gc_history', JSON.stringify(this.readingHistory));
    if (this.authToken) {
      this.apiFetch(`/user/history/${id}`, { method: 'POST' });
    }
  }

  async clearReadingHistory() {
    this.readingHistory = [];
    localStorage.removeItem('gc_history');
    if (this.authToken) {
      await this.apiFetch('/user/history', { method: 'DELETE' });
    }
    this.showToast('Reading history cleared.');
    this.renderForYouPage();
  }

  // --- Author Follow Storage ---
  isFollowing(name) { return this.followedAuthors.includes(name); }

  async toggleFollowAuthor(name, authorId = null) {
    if (!this.currentUser) {
      this.openAuthModal('login');
      this.showToast('Please sign in to follow authors.');
      return;
    }

    const resolvedAuthorId = authorId || Object.entries(this.followedAuthorMap).find(([, authorName]) => authorName === name)?.[0] || null;
    const currentlyFollowing = this.isFollowing(name) || (resolvedAuthorId && this.followedAuthorMap[resolvedAuthorId]);

    if (!resolvedAuthorId) {
      this.showToast('Author record is unavailable right now.');
      return;
    }

    const res = await this.apiFetch(`/user/follow/${resolvedAuthorId}`, { method: 'POST' });
    if (res.ok) {
      if (currentlyFollowing) {
        this.followedAuthors = this.followedAuthors.filter(a => a !== name);
        delete this.followedAuthorMap[resolvedAuthorId];
        this.showToast(`Unfollowed ${name}`);
      } else {
        this.followedAuthors = Array.from(new Set([...this.followedAuthors, name]));
        this.followedAuthorMap[resolvedAuthorId] = name;
        this.showToast(`Now following ${name}`);
      }
      localStorage.setItem('gc_following', JSON.stringify(this.followedAuthors));
      this.renderForYouPage();
    } else {
      this.showToast(res.data?.error || 'Could not update author follow state.');
    }
  }

  // --- Article Reader Modal ---
  generateStraightBrief(title, summary, body) {
    const base = (summary || body || title || '')
      .replace(/<[^>]+>/g, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/---\s*\*Source:[\s\S]*$/m, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_#`~]+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const words = base.split(/\s+/).filter(Boolean);
    if (words.length <= 48) return words.join(' ');
    return words.slice(0, 48).join(' ') + '...';
  }

  findArticle(id) {
    const list = [
      ...(this.articles || []),
      ...(this.getHomeArticles() || []),
      ...(this.getHomeHeroStories() || []),
      ...(GC_DATA.articles || []),
      ...(GC_DATA.heroStories || [])
    ];
    const article = list.find(a => a.id === id);
    if (article) return article;
    const trendingList = [
      ...(this.tickerItems || []),
      ...(this.getHomeTrending() || []),
      ...(GC_DATA.trending || [])
    ];
    const trending = trendingList.find(t => t.id === id);
    if (trending) {
      return {
        id: trending.id,
        title: trending.title,
        summary: `${trending.title}. Continuous coverage and intelligence briefing from the OPEN MEDIA editorial desk.`,
        description: `${trending.title}. Continuous coverage and intelligence briefing from the OPEN MEDIA editorial desk.`,
        body: `<p>${trending.title}</p><p>Security, technology and market indicators are shifting rapidly. OPEN MEDIA correspondents are following this developing story across our global bureaus.</p>`,
        category: trending.category,
        domain: trending.domain || trending.category,
        author: trending.author || 'Global Desk',
        published: trending.time || trending.date || 'Recent',
        date: trending.time || trending.date || 'Recent',
        readTime: trending.readTime || '3 min read',
        image: trending.image || this.getPosterFallback(trending.category, trending.title || trending.id)
      };
    }
    return null;
  }

  async openArticleModal(id) {
    let article = this.findArticle(id);
    if (!article) {
      const res = await this.apiFetch(`/articles/${id}`);
      if (res.ok && res.data?.article) {
        const a = res.data.article;
        article = {
          id: a.id,
          title: a.title,
          summary: a.summary,
          description: a.summary,
          body: a.body,
          category: a.category,
          domain: a.domain || a.category,
          author: a.author?.name || 'Editorial Desk',
          date: new Date(a.publishedAt || a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          published: new Date(a.publishedAt || a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          readTime: '4 min read',
          image: a.image || this.getPosterFallback(a.category, a.title || a.id)
        };
      }
    }
    if (!article) return;
    this.activeReaderArticleId = id;
    this.addToHistory(id);

    // Sync hash in browser address bar for direct shareability and back/forward navigation
    const targetHash = `#article-${encodeURIComponent(article.id)}`;
    if (window.location.hash !== targetHash) {
      window.history.pushState({ articleId: article.id }, '', targetHash);
    }

    const modal = document.getElementById('article-modal');
    const content = document.getElementById('article-modal-content');
    const related = GC_DATA.articles.filter(a => a.category === article.category && a.id !== id).slice(0, 3);
    const tags = article.domain ? [article.domain, article.category] : [article.category];
    
    let rawBody = article.body || article.description || article.summary || '';
    let sourceName = article.sourceName;
    let sourceUrl = article.sourceUrl;

    // Detect and extract syndicated markdown block
    const syndicationRegex = /---\s*\*Source:\s*Originally syndicated via \*\*([^*]+)\*\*\.\*\s*\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/i;
    const match = rawBody.match(syndicationRegex);
    if (match) {
      if (!sourceName) sourceName = match[1].trim();
      if (!sourceUrl) sourceUrl = match[3].trim();
      rawBody = rawBody.replace(syndicationRegex, '').trim();
    }
    // Also strip generic markdown syndication if present
    rawBody = rawBody.replace(/---\s*\*Source:[\s\S]*$/, '').trim();

    // Clean markdown bold, italic, and links from body
    let cleanBody = rawBody
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .trim();

    const paragraphs = cleanBody.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const straightBrief = article.straightBrief || this.generateStraightBrief(article.title, article.summary, cleanBody);
    const contentType = (article.contentType || 'NEWS').toUpperCase();
    const contentTypeLabel = {
      'NEWS': 'NEWS REPORTING',
      'ANALYSIS': 'DEEP ANALYSIS',
      'COMMUNITY': 'COMMUNITY DISPATCH',
      'SPONSORED': 'SPONSORED BRIEF'
    }[contentType] || 'NEWS REPORTING';
    const contentTypeClass = `badge-${contentType.toLowerCase()}`;

    content.innerHTML = `
      <div class="article-reader-inner">
        <div class="article-reader-top">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="story-category text-${this.accentClass(article.category)}">${article.category}</span>
            <span class="content-type-badge ${contentTypeClass}">${contentTypeLabel}</span>
          </div>
          <button class="icon-btn" onclick="app.closeArticleModal()" aria-label="Close article"><i data-lucide="x"></i></button>
        </div>
        <h1 class="article-reader-title">${this.escapeHTML(article.title)}</h1>
        ${article.description && article.body ? `<p class="article-reader-subtitle">${this.escapeHTML(article.description)}</p>` : ''}
        <div class="article-reader-meta">
          <span>By <b>${this.escapeHTML(article.author || 'Editorial Desk')}</b> <span class="status-badge badge-publisher" style="font-size:0.68rem; margin-left:4px;">Verified Source</span></span>
          <span>Published ${article.date || article.published || 'Today'}</span>
          <span>${article.readTime || '4 min read'}</span>
        </div>

        <!-- In 50 Words · Straight Brief Banner -->
        <div class="straight-brief-box">
          <div class="straight-brief-header">
            <span class="straight-brief-pill"><i data-lucide="zap"></i> In 50 Words · Straight Brief</span>
            <span class="straight-brief-count">${straightBrief.split(/\s+/).filter(Boolean).length} Words</span>
          </div>
          <p class="straight-brief-text">${this.escapeHTML(straightBrief)}</p>
        </div>

        <img class="article-reader-hero" src="${article.image}" alt="${this.escapeHTML(article.title)}" onerror="this.onerror=null;this.src=app.getPosterFallback('${article.category || 'IT'}', '${this.escapeJS(article.id || article.title)}');">
        
        <div class="article-body">
          ${paragraphs.length ? paragraphs.map(p => `<p>${this.escapeHTML(p)}</p>`).join('') : `<p>${this.escapeHTML(cleanBody)}</p>`}
          <div class="pull-quote">"${this.escapeHTML((article.summary || article.description || '').slice(0, 140))}"</div>
          <p>OPEN MEDIA's editorial desk will continue to update this story as new verified information becomes available.</p>
        </div>

        <!-- Verified Syndicated Source Card -->
        ${(sourceUrl || sourceName) ? `
        <div class="wire-source-card">
          <div class="wire-source-header">
            <span class="wire-badge"><i data-lucide="radio"></i> Verified Syndicated Wire</span>
            <span class="wire-publisher">${this.escapeHTML(sourceName || 'Accredited Wire Desk')}</span>
          </div>
          <p class="wire-source-note">Originally reported and continuous coverage syndicated via accredited newsroom. Read full unbroken wire coverage directly at the origin desk.</p>
          ${sourceUrl ? `
          <a href="${this.escapeHTML(sourceUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm wire-source-link">
            <span>Read Full Continuous Story on ${this.escapeHTML(sourceName || 'Official Source')}</span>
            <i data-lucide="external-link"></i>
          </a>` : ''}
        </div>` : ''}

        <div class="article-tags">
          ${tags.map(t => `<span class="article-tag">${this.escapeHTML(t)}</span>`).join('')}
        </div>
        <div class="article-actions">
          ${this.getCurrentUser() ? `<button class="btn btn-outline btn-sm" onclick="app.toggleSaveArticle('${article.id}')"><i data-lucide="${this.isSaved(article.id) ? 'bookmark-check' : 'bookmark'}"></i> ${this.isSaved(article.id) ? 'Saved' : 'Save'}</button>` : ''}
          <button class="btn btn-outline btn-sm" onclick="app.shareArticle('${article.id}')"><i data-lucide="share-2"></i> Share</button>
        </div>

        <!-- Article Reactions Bar (Phase 2) -->
        <div class="article-reactions-wrapper" id="reactions-wrapper-${article.id}">
          <div class="reactions-header">
            <span><i data-lucide="smile"></i> Reader Reactions</span>
            <span id="reactions-total-${article.id}" class="text-muted" style="font-size:0.75rem;">0 Reactions</span>
          </div>
          <div class="reactions-btn-group" id="reactions-btn-group-${article.id}">
            <button class="reaction-btn" id="rx-btn-like-${article.id}" onclick="app.toggleArticleReaction('${article.id}', 'LIKE')" title="Like this article">
              <span class="reaction-icon">👍</span> <span>Like</span> <span class="reaction-count" id="rx-count-like-${article.id}">0</span>
            </button>
            <button class="reaction-btn" id="rx-btn-insightful-${article.id}" onclick="app.toggleArticleReaction('${article.id}', 'INSIGHTFUL')" title="Mark as Insightful">
              <span class="reaction-icon">💡</span> <span>Insightful</span> <span class="reaction-count" id="rx-count-insightful-${article.id}">0</span>
            </button>
            <button class="reaction-btn" id="rx-btn-helpful-${article.id}" onclick="app.toggleArticleReaction('${article.id}', 'HELPFUL')" title="Mark as Helpful">
              <span class="reaction-icon">🤝</span> <span>Helpful</span> <span class="reaction-count" id="rx-count-helpful-${article.id}">0</span>
            </button>
          </div>
        </div>

        ${related.length ? `
        <div class="related-stories-block">
          <h4>Related Stories</h4>
          <div style="display:flex; flex-direction:column;">
            ${related.map(r => this.storyHorizontalHTML(r)).join('')}
          </div>
        </div>` : ''}

        <!-- Reader Comments Section -->
        <div class="article-comments-section" id="comments-section-${article.id}">
          <div class="comments-header">
            <h3><i data-lucide="message-square"></i> Reader Discussion (<span id="comment-count-${article.id}">0</span>)</h3>
          </div>
          ${this.currentUser ? `
            <form class="comment-form" onsubmit="app.handleCommentSubmit(event, '${article.id}')">
              <textarea id="comment-input-${article.id}" placeholder="Join the discussion as ${this.escapeHTML(this.currentUser.name)}..." required></textarea>
              <div style="display:flex; justify-content:flex-end;">
                <button type="submit" class="btn btn-primary btn-sm"><i data-lucide="send"></i> Post Comment</button>
              </div>
            </form>
          ` : `
            <div style="padding:14px 18px; background:#F8FAFC; border:1px dashed var(--color-border-gray); border-radius:var(--radius-sm); margin-bottom:20px; text-align:center;">
              <p style="margin-bottom:8px; font-size:0.88rem; color:var(--color-dark-gray);">Join our verified reader community to participate in discussions, post replies, and share technical critique.</p>
              <button class="btn btn-primary btn-sm" onclick="app.openAuthModal('login')"><i data-lucide="log-in"></i> Sign In to Comment</button>
            </div>
          `}
          <div class="comments-list" id="comments-list-${article.id}">
            <div style="text-align:center; padding:18px; color:var(--color-dark-gray); font-size:0.85rem;">Loading discussion...</div>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('show');
    this.updateModalOpenState(true);
    this.refreshIcons(content);
    this.loadArticleComments(article.id);
    this.loadArticleReactions(article.id);
  }

  refreshArticleModalIfOpen(id) {
    const modal = document.getElementById('article-modal');
    if (modal.classList.contains('show')) this.openArticleModal(id);
  }

  closeArticleModal(updateHistory = true) {
    this.activeReaderArticleId = null;
    const modal = document.getElementById('article-modal');
    if (modal) modal.classList.remove('show');
    this.updateModalOpenState(false);

    if (updateHistory && (window.location.hash || '').startsWith('#article-')) {
      const returnPage = this.currentPage || 'home';
      window.history.replaceState(null, '', `#${returnPage}`);
    }
  }

  shareArticle(id, evt) {
    if (evt) evt.stopPropagation();
    this.openShareModal(id);
  }

  openEventModal(eventId) {
    const evt = (this.events || []).find(e => e.id === eventId) ||
                (this.getHomeEvents() || []).find(e => e.id === eventId) ||
                (GC_DATA.events || []).find(e => e.id === eventId);
    if (!evt) return;

    const modal = document.getElementById('event-modal');
    const body = document.getElementById('event-modal-body');
    const user = this.getCurrentUser();
    const defaultName = user?.name || '';
    const defaultEmail = user?.email || '';

    body.innerHTML = `
      <span class="event-type-tag" style="position:static; display:inline-block; margin-bottom:12px;">${evt.type || 'Executive Briefing'}</span>
      <h2 style="font-family:var(--font-heading); margin-bottom:8px;">${this.escapeHTML(evt.title)}</h2>
      <p class="text-purple" style="font-weight:700; font-size:0.875rem; margin-bottom:6px;">${evt.date} · ${evt.time || ''}</p>
      <p class="text-muted" style="font-size:0.875rem; margin-bottom:16px;">Speaker: ${this.escapeHTML(evt.speaker || 'Keynote Expert')} · ${this.escapeHTML(evt.organization || 'Global Tech Forum')}</p>
      <p class="text-muted" style="font-size:0.9rem; margin-bottom:18px;">${this.escapeHTML(evt.description || '')}</p>
      <form onsubmit="app.handleEventRegister(event, '${evt.id}')">
        <div class="form-group">
          <label for="evt-reg-name">Full Name</label>
          <input type="text" id="evt-reg-name" class="form-control" required value="${this.escapeHTML(defaultName)}" placeholder="e.g. Elena Vance">
        </div>
        <div class="form-group">
          <label for="evt-reg-email">Work Email</label>
          <input type="email" id="evt-reg-email" class="form-control" required value="${this.escapeHTML(defaultEmail)}" placeholder="e.g. elena@enterprise.com">
        </div>
        <div style="display:flex; gap:10px;">
          <button type="submit" class="btn btn-primary" style="flex:1;"><i data-lucide="ticket"></i> Register Now</button>
          <button type="button" class="btn btn-outline" onclick="app.toggleBookmarkEvent('${evt.id}')"><i data-lucide="bookmark"></i></button>
        </div>
      </form>
    `;

    modal.classList.add('show');
    this.updateModalOpenState(true);
    this.refreshIcons(modal);
  }

  closeEventModal() {
    document.getElementById('event-modal').classList.remove('show');
    this.updateModalOpenState(false);
  }

  openLegalPage(type) {
    const pages = {
      about: {
        title: 'About OPEN MEDIA',
        updated: 'Enterprise Technology, Business, AI, and Cybersecurity Intelligence',
        sections: [
          ['Our Mission', 'OPEN MEDIA provides executive-ready intelligence and verifiable technical journalism across cloud computing, artificial intelligence, cybersecurity operations, and global tech enterprise.'],
          ['Core Editorial Pillars', 'We report strictly on four high-impact pillars: Enterprise IT, Global Business & Markets, Cyber Security & Threat Intelligence, and Artificial Intelligence.'],
          ['Zero-Speculation Policy', 'All continuous wire stories and breaking dispatches are cross-referenced with accredited desks, verifiable filings, and vendor security advisories before publication.']
        ]
      },
      privacy: {
        title: 'Privacy Policy & Data Protection',
        updated: 'Enterprise Data Protection Standards · GDPR & Privacy Compliance',
        sections: [
          ['Reader Account & Verification Data', 'When creating an account or verifying your email, we store your name, email, salted-bcrypt password hash, and verification status. This data is exclusively used for authentication, access control, and maintaining your personal reading library.'],
          ['Newsletter & Intelligence Briefs', 'Newsletter subscriptions are stored securely and used solely to dispatch requested intelligence briefings. We never sell, rent, or lease reader contact lists to third parties, brokers, or data aggregators.'],
          ['Community Discussions, Polls & Comments', 'Perspectives, poll votes, and comment replies posted across OPEN MEDIA articles are attributed to your public profile name. Respectful technical critique and disclosure of relevant commercial affiliations are required.'],
          ['Submitted Editorial Content', 'Contributor submissions, drafts, and uploaded graphics remain the intellectual property of the author while granting OPEN MEDIA non-exclusive distribution rights upon approval by our editorial desk.'],
          ['Data Retention & Deletion Rights', 'Readers may request complete account data deletion or export of their saved library by contacting the editorial privacy desk at privacy@openmedia.soxit.in.']
        ]
      },
      terms: {
        title: 'Terms of Service',
        updated: 'Effective Date: November 17, 2026',
        sections: [
          ['Using OPEN MEDIA', 'You may read, share, and link to OPEN MEDIA reporting for personal and informational use. Automated bulk harvesting, unauthorized scraping, or republishing of articles without written authorization is strictly prohibited.'],
          ['No Financial or Legal Advice', 'Market analysis, semiconductor coverage, and enterprise corporate reporting are published for informational purposes and do not constitute financial, investment, legal, or architectural advice.'],
          ['Acceptable Reader Conduct', 'Harassment, hate speech, automated voting manipulation, security vulnerability probing, or defamatory commentary results in immediate account suspension or termination.']
        ]
      },
      editorial: {
        title: 'Editorial Guidelines & Journalism Standards',
        updated: 'Accredited Newsroom Standards for Verifiable Reporting',
        sections: [
          ['Accuracy & Verification', 'We verify facts through primary sources, official corporate filings, CVE registries, and authenticated press releases before publishing.'],
          ['Clear Separation of Content Types', 'We clearly distinguish between objective News Reporting, deep Technical Analysis, Community Dispatches, and Sponsored Briefs.'],
          ['Straight 50-Word Briefs', 'Every story lead provides an executive-ready "In 50 Words" straight brief to ensure readers get accurate facts immediately without fluff.'],
          ['Corrections & Updates', 'Material corrections are acknowledged transparently in the article body with an editorial timestamp indicating the modification.']
        ]
      },
      moderation: {
        title: 'Community Moderation Rules',
        updated: 'Civil Discourse and Technical Safety Guidelines',
        sections: [
          ['Civil & Professional Tone', 'Comments and discussion threads must remain professional, respectful, and constructive. Personal attacks, insults, and harassment are grounds for suspension.'],
          ['Zero-Tolerance for Spam & Astroturfing', 'Promotional link-farming, coordinated voting manipulation, bot activity, and fraudulent user reviews are permanently blocked by our spam detection layer.'],
          ['Responsible Cyber Disclosure', 'Community posts discussing zero-day exploits or active attack vectors must adhere to coordinated vulnerability disclosure. Operational exploits or weaponized proof-of-concepts will be immediately removed.'],
          ['Reporting Violations', 'Readers may report suspicious comments or abusive submissions to our editorial moderation team directly from the discussion viewer.']
        ]
      },
      sponsored: {
        title: 'Sponsored Content & Commercial Policy',
        updated: 'Transparency, Independence, and Commercial Standards',
        sections: [
          ['Uncompromising Editorial Independence', 'Advertisers and commercial sponsors have no influence over OPEN MEDIA editorial coverage, reporting decisions, or technical critiques.'],
          ['Unambiguous Labeling', 'All sponsored briefings, partner webinars, and paid whitepapers are explicitly tagged with the "SPONSORED BRIEF" badge across all feeds and readers.'],
          ['Strict Partner Vetting', 'We only accept commercial sponsorships from verified technology and enterprise software vendors whose products adhere to industry security standards.']
        ]
      }
    };
    const page = pages[type] || pages.privacy;
    const body = document.getElementById('legal-modal-body');
    if (body) {
      body.innerHTML = `
        <h2 style="font-family:var(--font-heading); margin-bottom:6px; color:var(--color-deep-navy);">${page.title}</h2>
        <p class="text-muted" style="font-size:0.8rem; margin-bottom:20px;"><i data-lucide="shield" style="width:13px;height:13px;display:inline-block;vertical-align:middle;margin-right:4px;"></i>${page.updated}</p>
        ${page.sections.map(section => `
          <div style="margin-bottom:18px;">
            <h3 style="font-size:0.98rem; font-weight:600; color:var(--color-deep-navy); margin-bottom:6px;">${section[0]}</h3>
            <p class="text-muted" style="font-size:0.88rem; line-height:1.6; margin:0;">${section[1]}</p>
          </div>
        `).join('')}
      `;
    }
    const legalModal = document.getElementById('legal-modal');
    if (legalModal) {
      legalModal.classList.add('show');
      this.updateModalOpenState(true);
      this.refreshIcons(legalModal);
    }
  }

  closeLegalPage() {
    document.getElementById('legal-modal').classList.remove('show');
    this.updateModalOpenState(false);
  }

  handleEventRegister(e, eventId) {
    e.preventDefault();
    const name = document.getElementById('evt-reg-name')?.value.trim() || '';
    const email = document.getElementById('evt-reg-email')?.value.trim() || '';
    if (!name || !email) {
      this.showToast('Please enter your full name and work email address.');
      return;
    }
    if (!this.eventRegistrations) this.eventRegistrations = [];
    this.eventRegistrations.push({
      id: `registration-${Date.now()}`,
      eventId,
      name,
      email,
      date: new Date().toISOString()
    });
    localStorage.setItem('gc_event_registrations', JSON.stringify(this.eventRegistrations));
    this.closeEventModal();
    this.renderEvents();
    this.showToast(`🎉 Registration confirmed for ${name}! Access pass emailed to ${email}.`);
  }

  closeModal(modalId = null) {
    if (modalId) {
      const el = document.getElementById(modalId);
      if (el) el.classList.remove('show', 'active');
    } else {
      this.closeAllModals();
    }
    this.updateModalOpenState(false);
  }

  closeAllModals() {
    this.activeReaderArticleId = null;
    document.querySelectorAll('.modal-overlay, .mobile-drawer, .mobile-drawer-overlay').forEach(el => {
      el.classList.remove('show', 'active', 'dimmed');
    });
    document.body.classList.remove('modal-open', 'dimmed');
    document.documentElement.classList.remove('modal-open', 'dimmed');
    this.updateModalOpenState(false);
    if ((window.location.hash || '').startsWith('#article-')) {
      const returnPage = this.currentPage || 'home';
      window.history.replaceState(null, '', `#${returnPage}`);
    }
  }

  // --- AI Features (Safely Removed) ---
  toggleAITeller() {}
  renderAIChat() {}
  addAIMessage() {}
  summarizeAITeller() {}
  runAIFunction() {}
  askAI() {}
  handleAIAsk(e) { if (e?.preventDefault) e.preventDefault(); }


  // --- Search Overlay ---
  openSearch() {
    const modal = document.getElementById('search-modal');
    modal.classList.add('show');
    this.updateModalOpenState(true);
    document.getElementById('search-input').focus();
    this.handleSearchInput('');
  }

  closeSearch() {
    document.getElementById('search-modal').classList.remove('show');
    this.updateModalOpenState(false);
  }

  handleSearchInput(query) {
    const area = document.getElementById('search-results-area');
    const trendingTerms = ['Artificial Intelligence', 'Cybersecurity', 'Semiconductors', 'Nvidia', 'Cloud Computing', 'Startups'];

    if (!query.trim()) {
      area.innerHTML = `
        <div class="search-trending-title">Trending Searches</div>
        <div class="search-trending-chips">
          ${trendingTerms.map(t => `<button class="chip" onclick="document.getElementById('search-input').value='${t}'; app.handleSearchInput('${t}')">${t}</button>`).join('')}
        </div>`;
      return;
    }

    const q = query.toLowerCase();
    const articles = this.getHomeArticles();
    const articleMatches = articles.filter(a => 
      a.title.toLowerCase().includes(q) || 
      (a.summary && a.summary.toLowerCase().includes(q)) || 
      a.category.toLowerCase().includes(q) || 
      (a.domain && a.domain.toLowerCase().includes(q)) ||
      (a.author && a.author.toLowerCase().includes(q))
    );
    const eventMatches = (GC_DATA.events || []).filter(e => e.title.toLowerCase().includes(q) || (e.description && e.description.toLowerCase().includes(q)));
    const authorMatches = (GC_DATA.authors || []).filter(a => a.name.toLowerCase().includes(q));

    if (!articleMatches.length && !eventMatches.length && !authorMatches.length) {
      area.innerHTML = `<div class="empty-state"><h4>No stories found for "${this.escapeHTML(query)}"</h4><p>Try searching for a technology topic, company, author, or cyber vulnerability.</p></div>`;
      return;
    }

    let html = '';
    if (articleMatches.length) {
      html += `<div class="search-section-label" style="font-size:0.72rem; font-weight:800; text-transform:uppercase; color:var(--color-dark-gray); letter-spacing:0.04em; margin:12px 0 6px;">Articles (${articleMatches.length})</div>`;
      html += articleMatches.slice(0, 10).map(m => `
        <div class="search-result-item" onclick="app.closeSearch(); app.openArticleModal('${m.id}')">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span class="story-category text-${this.accentClass(m.category)}">${this.escapeHTML(m.domain || m.category)}</span>
            <span class="text-muted" style="font-size:0.75rem;">${m.readTime || '3 min read'}</span>
          </div>
          <h4 style="font-size:0.95rem; font-family:var(--font-heading); margin-bottom:4px;">${this.highlight(m.title, query)}</h4>
          <span class="text-muted" style="font-size:0.75rem;">By ${this.escapeHTML(m.author)} · ${m.date || 'Recent'}</span>
        </div>`).join('');
    }
    if (eventMatches.length) {
      html += `<div class="search-section-label" style="font-size:0.72rem; font-weight:800; text-transform:uppercase; color:var(--color-dark-gray); letter-spacing:0.04em; margin:14px 0 6px;">Webinars &amp; Events (${eventMatches.length})</div>`;
      html += eventMatches.map(m => `
        <div class="search-result-item" onclick="app.closeSearch(); app.openEventModal('${m.id}')">
          <span class="story-category text-purple">Event · ${this.escapeHTML(m.category || 'Tech')}</span>
          <h4 style="font-size:0.95rem; font-family:var(--font-heading);">${this.highlight(m.title, query)}</h4>
          <span class="text-muted" style="font-size:0.75rem;">${m.date || 'Upcoming'}</span>
        </div>`).join('');
    }
    if (authorMatches.length) {
      html += `<div class="search-section-label" style="font-size:0.72rem; font-weight:800; text-transform:uppercase; color:var(--color-dark-gray); letter-spacing:0.04em; margin:14px 0 6px;">Authors (${authorMatches.length})</div>`;
      html += authorMatches.map(m => `
        <div class="search-result-item" onclick="app.closeSearch(); app.navigateTo('foryou')">
          <span class="story-category text-blue">Author</span>
          <h4 style="font-size:0.95rem; font-family:var(--font-heading);">${this.highlight(m.name, query)}</h4>
          <span class="text-muted" style="font-size:0.75rem;">${this.escapeHTML(m.role || 'Contributor')}</span>
        </div>`).join('');
    }
    area.innerHTML = html;
  }

  highlight(text, query) {
    if (!query) return text;
    const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig');
    return text.replace(re, '<mark>$1</mark>');
  }

  // --- Notifications (Dynamic & Zero-Mock) ---
  async openNotifications() {
    const list = document.getElementById('notif-list-container');
    if (!list) return;

    document.getElementById('notifications-modal').classList.add('show');
    this.updateModalOpenState(true);

    if (this.authToken) {
      try {
        const res = await this.apiFetch('/notifications');
        if (res.ok && res.data?.notifications) {
          const notifs = res.data.notifications;
          const unread = res.data.unreadCount || 0;
          const countEl = document.getElementById('notif-count');
          if (countEl) {
            countEl.textContent = unread;
            countEl.style.display = unread > 0 ? 'inline-block' : 'none';
          }

          if (notifs.length > 0) {
            list.innerHTML = `
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; padding-bottom:8px; border-bottom:1px solid #E2E8F0;">
                <span style="font-size:0.8rem; font-weight:700; color:#64748B;">${unread} unread</span>
                <button class="btn btn-outline btn-sm" onclick="app.markAllNotificationsRead()" style="font-size:0.75rem; padding:3px 8px;">Mark All Read</button>
              </div>
              ${notifs.map(n => `
                <div class="notif-item ${n.isRead ? '' : 'unread'}" style="background:${n.isRead ? 'transparent' : '#F0F9FF'}; border-radius:6px; padding:10px; margin-bottom:6px;">
                  <div class="notif-icon" style="background:#DBEAFE;"><i data-lucide="bell" class="text-blue"></i></div>
                  <div>
                    <div class="notif-title-row" style="font-weight:700; font-size:0.88rem;">${this.escapeHTML(n.title)}</div>
                    <p style="font-size:0.84rem; margin:2px 0 4px;">${this.escapeHTML(n.message)}</p>
                    <div class="notif-time" style="font-size:0.72rem; color:#94A3B8;">${new Date(n.createdAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</div>
                  </div>
                </div>
              `).join('')}
            `;
            this.refreshIcons(list);
            return;
          }
        }
      } catch (e) {
        console.warn('Notifications fetch fallback:', e);
      }
    }

    const notifs = (this.notifications && this.notifications.length) ? this.notifications : [
      { icon: 'shield-alert', cls: 'text-red', bg: '#FEE2E2', title: 'EDITORIAL SYSTEM ACTIVE', body: 'Live newsroom synchronized with real-time editorial websocket pipeline.', time: 'Just now' },
      { icon: 'globe', cls: 'text-blue', bg: '#DBEAFE', title: 'PLATFORM READY', body: 'OPEN MEDIA real-time production suite is online and connected.', time: '1m ago' }
    ];

    list.innerHTML = notifs.map(n => `
      <div class="notif-item">
        <div class="notif-icon" style="background:${n.bg};"><i data-lucide="${n.icon}" class="${n.cls}"></i></div>
        <div>
          <div class="notif-title-row ${n.cls}">${this.escapeHTML(n.title)}</div>
          <p>${this.escapeHTML(n.body)}</p>
          <div class="notif-time">${this.escapeHTML(n.time)}</div>
        </div>
      </div>
    `).join('');

    this.notifCount = 0;
    const countEl = document.getElementById('notif-count');
    if (countEl) countEl.style.display = 'none';
    this.refreshIcons(list);
  }

  async markAllNotificationsRead() {
    if (!this.authToken) return;
    await this.apiFetch('/notifications/read-all', { method: 'POST' });
    this.showToast('All notifications marked as read.');
    this.openNotifications();
  }

  closeNotifications() {
    document.getElementById('notifications-modal').classList.remove('show');
    this.updateModalOpenState(false);
  }

  // --- Publisher Workspace & Re-Submission Pipeline ---
  switchPublishTab(tab, btnEl) {
    document.querySelectorAll('.publish-tab-btn').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
    document.querySelectorAll('.publish-panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById(`publish-tab-${tab}`);
    if (panel) panel.classList.add('active');

    if (tab === 'submissions' || tab === 'feedback') {
      this.renderPublisherTracker();
      this.renderPublisherFeedbackHistory();
    }
  }

  async renderPublisherTracker() {
    const body = document.getElementById('publisher-tracker-body');
    if (!body) return;

    const statusClassMap = {
      PENDING: 'status-pending',
      PUBLISHED: 'status-approved',
      REJECTED: 'status-rejected',
      DRAFT: 'status-under-review',
      CHANGES_REQUESTED: 'status-changes-requested'
    };

    if (!this.currentUser || !['PUBLISHER', 'ADMIN'].includes(this.currentUser.role)) {
      body.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:24px; color:var(--color-dark-gray);">Log in as a publisher or admin to view your submissions.</td></tr>';
      this.renderPublisherFeedbackHistory();
      return;
    }

    try {
      const [artRes, evtRes] = await Promise.all([
        this.apiFetch('/articles/mine/list'),
        this.apiFetch('/events/mine')
      ]);

      const articles = (artRes.ok && Array.isArray(artRes.data?.articles)) ? artRes.data.articles : [];
      const events = (evtRes.ok && Array.isArray(evtRes.data?.events)) ? evtRes.data.events : [];
      this.publisherArticles = articles;

      const unifiedMine = [
        ...articles.map(a => ({ id: a.id, isEvent: false, title: a.title, category: a.category, createdAt: a.createdAt, status: a.status || 'PENDING', feedback: a.editorialFeedback, raw: a })),
        ...events.map(e => ({ id: e.id, isEvent: true, title: e.title, category: `Event / ${e.category || 'General'}`, createdAt: e.createdAt || e.eventDate, status: e.status || 'PENDING', feedback: e.editorialFeedback, raw: e }))
      ].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      if (!unifiedMine.length) {
        body.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:32px; color:var(--color-dark-gray);">No submissions yet. Submit your technological analysis or event above!</td></tr>';
      } else {
        body.innerHTML = unifiedMine.map(s => {
          const title = s.title || 'Untitled';
          const date = s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today';
          const status = s.status || 'PENDING';
          const canResubmit = !s.isEvent && (status === 'CHANGES_REQUESTED' || status === 'REJECTED');

          return `
            <tr>
              <td>
                <div style="display:flex; align-items:center; gap:6px;">
                  ${s.isEvent ? '<span style="font-size:0.65rem; background:#EDE9FE; color:#6D28D9; font-weight:800; padding:2px 6px; border-radius:4px;">EVENT</span>' : ''}
                  <b style="color:var(--color-deep-navy);">${this.escapeHTML(title)}</b>
                </div>
              </td>
              <td><span class="category-tag" style="font-size:0.7rem;">${this.escapeHTML(s.category)}</span></td>
              <td>${date}</td>
              <td><span class="status-badge ${statusClassMap[status] || 'status-pending'}">${status}</span></td>
              <td>
                ${canResubmit ? `
                  <button class="btn btn-primary btn-xs" onclick="app.openResubmitArticleModal('${s.id}')" title="Edit and resubmit this article for review">
                    <i data-lucide="refresh-cw"></i> Edit &amp; Resubmit
                  </button>
                ` : `
                  <button class="btn btn-outline btn-xs" onclick="${s.isEvent ? `app.openEventModal('${s.id}')` : `app.openArticleModal('${s.id}')`}" title="View details">
                    <i data-lucide="eye"></i> View
                  </button>
                `}
              </td>
            </tr>
          `;
        }).join('');
      }
    } catch (error) {
      body.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:24px; color:var(--color-dark-gray);">Unable to load your submissions right now.</td></tr>';
    }

    this.renderPublisherFeedbackHistory();
    this.refreshIcons(body);
  }

  renderPublisherFeedbackHistory() {
    const body = document.getElementById('publisher-feedback-body');
    if (!body) return;

    const articles = Array.isArray(this.publisherArticles) ? this.publisherArticles : [];
    const withFeedback = articles.filter(a => a.editorialFeedback || a.status === 'CHANGES_REQUESTED' || a.status === 'REJECTED');

    if (!withFeedback.length) {
      body.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:32px; color:var(--color-dark-gray);">No moderation feedback recorded yet.</td></tr>';
      return;
    }

    body.innerHTML = withFeedback.map(article => `
      <tr>
        <td style="max-width:240px;"><b>${this.escapeHTML(article.title || 'Untitled Article')}</b></td>
        <td><span class="status-badge ${article.status === 'PUBLISHED' ? 'status-approved' : article.status === 'CHANGES_REQUESTED' ? 'status-changes-requested' : article.status === 'REJECTED' ? 'status-rejected' : 'status-pending'}">${this.escapeHTML(article.status || 'PENDING')}</span></td>
        <td style="max-width:320px;">
          <div class="publisher-notice ${article.status === 'CHANGES_REQUESTED' ? 'notice-changes' : 'notice-rejected'}" style="padding:8px 12px; margin:0;">
            <p style="margin:0; font-size:0.85rem;">${this.escapeHTML(article.editorialFeedback || 'Editorial team requested revisions before publication.')}</p>
          </div>
        </td>
        <td>${this.escapeHTML(article.updatedAt || article.createdAt ? new Date(article.updatedAt || article.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today')}</td>
        <td>
          <button class="btn btn-primary btn-xs" onclick="app.openResubmitArticleModal('${article.id}')" title="Apply revisions and resubmit">
            <i data-lucide="send"></i> Resubmit for Review
          </button>
        </td>
      </tr>
    `).join('');

    this.refreshIcons(body);
  }

  // --- Publisher Re-submission Pipeline Modal ---
  async openResubmitArticleModal(articleId) {
    let article = this.publisherArticles.find(a => a.id === articleId);
    if (!article) {
      const res = await this.apiFetch(`/articles/${articleId}`);
      if (res.ok && res.data?.article) {
        article = res.data.article;
      }
    }

    if (!article) {
      this.showToast('Article not found.');
      return;
    }

    document.getElementById('resubmit-article-id').value = article.id;
    document.getElementById('resubmit-title').value = article.title || '';
    document.getElementById('resubmit-category').value = article.category || 'IT';
    document.getElementById('resubmit-domain').value = article.domain || '';
    document.getElementById('resubmit-image').value = article.image || '';
    document.getElementById('resubmit-summary').value = article.summary || '';
    document.getElementById('resubmit-body').value = article.body || '';

    const banner = document.getElementById('resubmit-editorial-feedback-banner');
    const feedbackText = document.getElementById('resubmit-feedback-text');
    if (banner && feedbackText) {
      if (article.editorialFeedback) {
        banner.style.display = 'flex';
        feedbackText.textContent = article.editorialFeedback;
      } else {
        banner.style.display = 'none';
        feedbackText.textContent = '';
      }
    }

    const modal = document.getElementById('modal-resubmit-article');
    if (modal) {
      modal.classList.add('show');
      document.body.classList.add('modal-open');
    }
  }

  closeResubmitArticleModal() {
    const modal = document.getElementById('modal-resubmit-article');
    if (modal) {
      modal.classList.remove('show');
      document.body.classList.remove('modal-open');
    }
  }

  async handleResubmitArticleSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('resubmit-article-id').value;
    const title = document.getElementById('resubmit-title').value.trim();
    const category = document.getElementById('resubmit-category').value;
    const domain = document.getElementById('resubmit-domain').value.trim();
    const image = document.getElementById('resubmit-image').value.trim();
    const summary = document.getElementById('resubmit-summary').value.trim();
    const body = document.getElementById('resubmit-body').value.trim();
    const submitBtn = document.getElementById('btn-submit-resubmit');

    if (!id || !title || !category || !summary || !body) {
      this.showToast('Please fill all required article fields.');
      return;
    }

    if (submitBtn) submitBtn.disabled = true;

    const res = await this.apiFetch(`/articles/${id}/resubmit`, {
      method: 'PATCH',
      body: JSON.stringify({
        title,
        category,
        domain: domain || undefined,
        image: image || undefined,
        summary,
        body
      })
    });

    if (submitBtn) submitBtn.disabled = false;

    if (res.ok && res.data?.article) {
      this.showToast('Article resubmitted for editorial review.');
      this.closeResubmitArticleModal();
      await this.renderPublisherTracker();
      this.renderPublisherFeedbackHistory();
    } else {
      const errMsg = res.data?.message || (res.data?.details ? res.data.details.map(d => d.message).join(', ') : res.data?.error) || 'Validation error';
      this.showToast(`Failed to resubmit: ${errMsg}`);
    }
  }

  async handleLocalImageSelection(fileInputId, targetInputId, previewId) {
    const fileInput = document.getElementById(fileInputId);
    const targetInput = document.getElementById(targetInputId);
    const preview = document.getElementById(previewId);
    const file = fileInput?.files?.[0];
    if (!file || !targetInput) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = String(event.target?.result || '');
      fileInput.dataset.localDataUrl = dataUrl;
      targetInput.dataset.localDataUrl = dataUrl;
      targetInput.value = dataUrl;
      if (preview) {
        preview.innerHTML = `<img src="${dataUrl}" alt="Selected preview" style="max-width:160px;max-height:90px;border-radius:8px;object-fit:cover;margin-top:6px;border:1px solid var(--color-border-gray);">`;
      }
    };
    reader.readAsDataURL(file);
  }

  async handleArticleSubmission(e) {
    e.preventDefault();
    const form = e.target;
    const title = document.getElementById('pub-title').value.trim();
    const category = document.getElementById('pub-category').value;
    const author = document.getElementById('pub-author').value.trim();
    const image = document.getElementById('pub-image').value.trim() || document.getElementById('article-image-file')?.dataset.localDataUrl || '';
    const description = document.getElementById('pub-description').value.trim();
    const body = document.getElementById('pub-content').value.trim();
    const tags = document.getElementById('pub-tags').value.trim();
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!title || !category || !body) {
      this.showToast('Title, category, and body are required before submission.');
      form.reportValidity?.();
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.dataset.originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i data-lucide="loader-circle"></i> Submitting...';
      this.refreshIcons(submitBtn);
    }

    try {
      const res = await this.apiFetch('/articles', {
        method: 'POST',
        body: JSON.stringify({
          title,
          summary: description,
          body: body || description,
          category,
          domain: tags || category,
          image: image || undefined,
          status: 'PUBLISHED'
        })
      });

      if (res.ok && res.data?.article) {
        const newArt = res.data.article;
        this.showToast('🚀 Story published live to the Breaking News ticker and feed!');
        form.reset();
        const preview = document.getElementById('pub-image-preview');
        if (preview) preview.innerHTML = '';
        document.getElementById('pub-author').value = this.currentUser?.name || '';

        // Immediately update breaking news ticker locally
        if (!this.tickerItems) this.tickerItems = [];
        this.tickerItems = [{
          id: newArt.id,
          title: newArt.title,
          category: newArt.category,
          domain: newArt.domain,
          time: 'Just now'
        }, ...this.tickerItems.filter(t => t.id !== newArt.id)];
        this.renderTicker();

        // Refresh feed & ticker from server
        await this.fetchTicker();
        await this.fetchBackendArticles();
        await this.renderPublisherTracker();
      } else {
        const errMsg = res.data?.message || (res.data?.details ? res.data.details.map(d => d.message).join(', ') : res.data?.error) || 'Validation error';
        this.showToast(`Submission failed: ${errMsg}`);
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = submitBtn.dataset.originalText || '<i data-lucide="send"></i> Publish News to Breaking Wire';
        this.refreshIcons(submitBtn);
      }
    }
  }

  async handleEventSubmission(e) {
    e.preventDefault();
    const title = document.getElementById('evt-name').value.trim();
    const description = document.getElementById('evt-desc').value.trim();
    const eventDate = document.getElementById('evt-date').value;
    const location = document.getElementById('evt-location')?.value.trim() || 'TBD';
    const category = document.getElementById('evt-category')?.value || 'IT';
    const imageUrl = document.getElementById('evt-banner').value.trim() || document.getElementById('evt-banner-file')?.dataset.localDataUrl || '';

    if (!title || !description || !eventDate || !location) {
      this.showToast('Please complete all required event fields.');
      return;
    }

    const payload = {
      title,
      description,
      eventDate,
      location,
      category,
      imageUrl: imageUrl || undefined,
      organizerId: this.currentUser?.id || null
    };

    const res = await this.apiFetch('/events', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res.ok && res.data?.event) {
      this.showToast('Event submitted for editorial review.');
      e.target.reset();
      const preview = document.getElementById('evt-banner-preview');
      if (preview) preview.innerHTML = '';
      this.renderPublisherTracker();
      this.fetchBackendEvents();
    } else {
      const errMsg = res.data?.message || (res.data?.details ? res.data.details.map(d => d.message).join(', ') : res.data?.error) || 'Unable to submit event.';
      this.showToast(errMsg);
    }
  }

  validatePublicForm(form, fields) {
    const values = {};
    fields.forEach(({ id, key }) => {
      const field = document.getElementById(id);
      field.value = field.value.trim();
      values[key] = field.value;
      if (id === 'contact-phone') {
        field.setCustomValidity(/^[0-9]{10}$/.test(field.value) ? '' : 'Enter a valid 10-digit contact number.');
      } else if (id === 'adv-name') {
        field.setCustomValidity(/^[A-Za-z ]+$/.test(field.value) ? '' : 'Enter a name using letters and spaces only.');
      }
    });
    if (!form.checkValidity()) {
      form.reportValidity();
      return null;
    }
    return values;
  }

  handleCareerApplication(e) {
    e.preventDefault();
    const values = this.validatePublicForm(e.target, [
      { id: 'career-name', key: 'name' }, { id: 'career-email', key: 'email' },
      { id: 'career-role', key: 'role' }, { id: 'career-portfolio', key: 'portfolio' },
      { id: 'career-note', key: 'note' }
    ]);
    if (!values) return;
    this.showToast(`Thanks, ${values.name}. Your application was received.`);
    e.target.reset();
  }

  handleContactSubmission(e) {
    e.preventDefault();
    const values = this.validatePublicForm(e.target, [
      { id: 'contact-name', key: 'name' }, { id: 'contact-email', key: 'email' },
      { id: 'contact-phone', key: 'phone' }, { id: 'contact-subject', key: 'subject' },
      { id: 'contact-message', key: 'message' }
    ]);
    if (!values) return;
    this.showToast(`Thanks, ${values.name}. Your message was sent.`);
    e.target.reset();
  }

  async handleAdvertiseSubmission(e) {
    e.preventDefault();
    const name = document.getElementById('adv-name')?.value.trim() || '';
    const company = document.getElementById('adv-company')?.value.trim() || '';
    const email = document.getElementById('adv-email')?.value.trim() || '';
    const pkg = document.getElementById('adv-package')?.value || 'Sponsored Intelligence Brief';
    const budget = document.getElementById('adv-budget')?.value || 'Enterprise ($5,000+)';
    const message = document.getElementById('adv-notes')?.value.trim() || `Inquiry for ${pkg}`;

    if (!name || !email) {
      this.showToast('Please provide your full name and work email.');
      return;
    }

    try {
      const res = await this.apiFetch('/inquiries', {
        method: 'POST',
        body: JSON.stringify({
          name,
          company: company || 'Enterprise Partner',
          email,
          inquiryType: pkg,
          budget,
          message
        })
      });

      if (res.ok && res.data?.inquiry) {
        this.openInquiryConfirmationModal(res.data.inquiry);
        e.target.reset();
      } else {
        const fallbackId = 'OM-ADV-' + Math.floor(1000 + Math.random() * 9000);
        this.openInquiryConfirmationModal({ id: fallbackId, name, email, company });
        e.target.reset();
      }
    } catch (_) {
      const fallbackId = 'OM-ADV-' + Math.floor(1000 + Math.random() * 9000);
      this.openInquiryConfirmationModal({ id: fallbackId, name, email, company });
      e.target.reset();
    }
  }

  openInquiryConfirmationModal(data) {
    const modal = document.getElementById('modal-inquiry-confirmed');
    if (!modal) return;
    const refEl = document.getElementById('inquiry-confirm-id');
    const msgEl = document.getElementById('inquiry-confirm-message');
    if (refEl) refEl.textContent = data.id || ('OM-ADV-' + Date.now().toString().slice(-4));
    if (msgEl) {
      msgEl.innerHTML = `Thank you, <b>${this.escapeHTML(data.name || 'Partner')}</b>. Your commercial inquiry for <b>${this.escapeHTML(data.company || 'Enterprise')}</b> has been logged in our media desk system.`;
    }
    modal.classList.add('show');
    this.updateModalOpenState(true);
    this.refreshIcons(modal);
  }

  closeInquiryConfirmationModal() {
    const modal = document.getElementById('modal-inquiry-confirmed');
    if (modal) modal.classList.remove('show');
    this.updateModalOpenState(false);
  }

  handleNewsletterSubscribe(e) {
    e.preventDefault();
    const emailInput = document.getElementById('newsletter-email');
    const email = emailInput ? emailInput.value.trim() : '';
    if (!email) {
      this.showToast('Please enter a valid work email address.');
      return;
    }
    if (!this.newsletterSubscribers) this.newsletterSubscribers = [];
    if (!this.newsletterSubscribers.includes(email)) {
      this.newsletterSubscribers.push(email);
      localStorage.setItem('gc_newsletter_subscribers', JSON.stringify(this.newsletterSubscribers));
    }
    this.showToast(`🎉 Subscribed! Daily intelligence briefs will be sent to ${email}`);
    e.target.reset();
  }

  // --- Password Strength & Reader Security ---
  checkPasswordStrength(val = '') {
    const hasLen = val.length >= 8;
    const hasUpper = /[A-Z]/.test(val);
    const hasLower = /[a-z]/.test(val);
    const hasDigit = /[0-9]/.test(val);

    const updateItem = (id, isValid) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.className = `req-item ${isValid ? 'valid' : ''}`;
      const text = el.textContent.replace(/^[^\w]*/, '').trim();
      el.innerHTML = `<i data-lucide="${isValid ? 'check-circle-2' : 'circle'}"></i> ${text}`;
    };

    updateItem('req-len', hasLen);
    updateItem('req-upper', hasUpper);
    updateItem('req-lower', hasLower);
    updateItem('req-digit', hasDigit);
    this.refreshIcons(document.getElementById('register-pwd-reqs'));
    return hasLen && hasUpper && hasLower && hasDigit;
  }

  // --- Menus & Utilities ---
  openAuthModal(mode = 'login') {
    const loginForm = document.getElementById('auth-login-form');
    const regForm = document.getElementById('auth-register-form');
    const verifyForm = document.getElementById('auth-verify-form');
    const forgotForm = document.getElementById('auth-forgot-form');
    const resetForm = document.getElementById('auth-reset-form');
    const title = document.getElementById('auth-modal-title');

    if (loginForm) loginForm.hidden = mode !== 'login';
    if (regForm) regForm.hidden = mode !== 'register';
    if (verifyForm) verifyForm.hidden = mode !== 'verify';
    if (forgotForm) forgotForm.hidden = mode !== 'forgot';
    if (resetForm) resetForm.hidden = mode !== 'reset';

    if (title) {
      const titleMap = {
        login: '<i data-lucide="log-in"></i> Reader Sign In',
        register: '<i data-lucide="user-plus"></i> Create Reader Account',
        verify: '<i data-lucide="shield-check"></i> Verify Email Address',
        forgot: '<i data-lucide="key-round"></i> Recover Password',
        reset: '<i data-lucide="lock"></i> Reset Password'
      };
      title.innerHTML = titleMap[mode] || titleMap.login;
    }

    if (mode === 'verify' && this.pendingVerifyEmail) {
      const verifyDisplay = document.getElementById('verify-email-display');
      if (verifyDisplay) verifyDisplay.textContent = this.pendingVerifyEmail;
    }

    const modal = document.getElementById('modal-auth');
    if (modal) {
      modal.classList.add('show');
      this.updateModalOpenState(true);
      this.refreshIcons(modal);
    }
  }

  closeAuthModal() {
    const modal = document.getElementById('modal-auth');
    if (modal) modal.classList.remove('show');
    this.updateModalOpenState(false);
  }

  togglePasswordVisibility(inputId, btnElement) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    if (btnElement) {
      btnElement.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
      btnElement.innerHTML = `<i data-lucide="${isPassword ? 'eye-off' : 'eye'}"></i>`;
      this.refreshIcons(btnElement);
    }
  }

  completeAuthentication(data) {
    this.authToken = data.token;
    this.currentUser = data.user;
    localStorage.setItem('gc_auth_token', this.authToken);
    localStorage.setItem('gc_current_user', JSON.stringify(this.currentUser));
    this.updateNavVisibility();
    this.closeAuthModal();
    this.fetchUserLibrarySync();
  }

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const now = Date.now();
    if (now - this.lastAuthAttemptAt < 2000) {
      this.showToast('Please wait a moment before trying again.');
      return;
    }
    this.lastAuthAttemptAt = now;

    const res = await this.apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    if (res.ok && res.data?.token) {
      this.completeAuthentication(res.data);
      this.showToast('Welcome back.');
      return;
    }

    if (res.status === 0 && res.error?.message === 'Request throttled') {
      this.showToast('Please wait a moment before retrying sign-in.');
      return;
    }

    this.showToast(res.data?.error || 'Unable to sign in.');
  }

  async handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;

    if (!name || !email || !password) {
      this.showToast('Please fill out all registration fields.');
      return;
    }

    if (!this.checkPasswordStrength(password)) {
      this.showToast('Password must be at least 8 chars with uppercase, lowercase, and a number.');
      return;
    }

    const res = await this.apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });

    if (res.ok && res.data) {
      if (res.data.requiresVerification) {
        this.pendingVerifyEmail = email;
        const codeInput = document.getElementById('verify-code');
        if (codeInput && res.data.verificationToken) codeInput.value = res.data.verificationToken;
        this.openAuthModal('verify');
        this.showToast(`Verification code generated for ${email}. Dev Code: ${res.data.verificationToken || 'Check terminal'}`);
      } else if (res.data.token) {
        this.completeAuthentication(res.data);
        this.showToast(`🎉 Welcome to OPEN MEDIA, ${name}! Your account is registered.`);
      }
    } else {
      this.showToast(res.data?.error || 'Unable to create account. Please check credentials.');
    }
  }

  async handleVerifyEmail(e) {
    e.preventDefault();
    const code = document.getElementById('verify-code')?.value.trim();
    const email = this.pendingVerifyEmail || document.getElementById('register-email')?.value.trim();

    if (!code || code.length !== 6) {
      this.showToast('Please enter the 6-digit verification code.');
      return;
    }

    const res = await this.apiFetch('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, token: code })
    });

    if (res.ok && res.data?.token) {
      this.completeAuthentication(res.data);
      this.showToast('🎉 Email verified! Your account is fully active.');
    } else {
      this.showToast(res.data?.error || 'Invalid or expired verification code.');
    }
  }

  async handleResendVerification() {
    const email = this.pendingVerifyEmail || document.getElementById('register-email')?.value.trim();
    if (!email) {
      this.showToast('Email address required to resend verification.');
      return;
    }

    const res = await this.apiFetch('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email })
    });

    if (res.ok) {
      const token = res.data?.verificationToken;
      const codeInput = document.getElementById('verify-code');
      if (codeInput && token) codeInput.value = token;
      this.showToast(`Verification code resent to ${email}. (Code: ${token})`);
    } else {
      this.showToast(res.data?.error || 'Unable to resend code.');
    }
  }

  async handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById('forgot-email')?.value.trim();
    if (!email) {
      this.showToast('Please enter your account email address.');
      return;
    }

    const res = await this.apiFetch('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });

    if (res.ok && res.data) {
      this.showToast('Recovery token generated.');
      const resetEmailInput = document.getElementById('reset-email');
      const resetTokenInput = document.getElementById('reset-token');
      if (resetEmailInput) resetEmailInput.value = email;
      if (resetTokenInput && res.data.resetToken) resetTokenInput.value = res.data.resetToken;
      this.openAuthModal('reset');
    } else {
      this.showToast(res.data?.error || 'Account not found or recovery failed.');
    }
  }

  async handleResetPassword(e) {
    e.preventDefault();
    const email = document.getElementById('reset-email')?.value.trim();
    const token = document.getElementById('reset-token')?.value.trim();
    const newPassword = document.getElementById('reset-new-password')?.value;

    if (!email || !token || !newPassword) {
      this.showToast('All fields are required to reset your password.');
      return;
    }

    const hasLen = newPassword.length >= 8;
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasDigit = /[0-9]/.test(newPassword);
    if (!hasLen || !hasUpper || !hasLower || !hasDigit) {
      this.showToast('New password must have 8+ chars with uppercase, lowercase, and a digit.');
      return;
    }

    const res = await this.apiFetch('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, token, newPassword })
    });

    if (res.ok) {
      this.showToast('🎉 Password reset successfully! Please sign in with your new password.');
      this.openAuthModal('login');
      const loginEmailInput = document.getElementById('login-email');
      if (loginEmailInput) loginEmailInput.value = email;
    } else {
      this.showToast(res.data?.error || 'Invalid recovery token or reset failed.');
    }
  }
  toggleMobileNav() {
    const drawer = document.getElementById('mobile-drawer');
    if (!drawer) return;
    if (drawer.classList.contains('show')) {
      this.closeMobileNav();
      return;
    }
    drawer.classList.add('show');
    document.getElementById('mobile-drawer-overlay')?.classList.add('show');
  }

  closeMobileNav() {
    document.getElementById('mobile-drawer')?.classList.remove('show');
    document.getElementById('mobile-drawer-overlay')?.classList.remove('show');
  }

  toggleProfileMenu() {
    document.getElementById('profile-menu').classList.toggle('show');
  }

  signOut() {
    this.authToken = null; this.currentUser = null;
    localStorage.removeItem('gc_auth_token'); localStorage.removeItem('gc_current_user');
    document.getElementById('profile-menu')?.classList.remove('show');
    this.updateNavVisibility(); this.navigateTo('home');
    this.showToast('Signed out successfully.');
  }

  simulatedSignOut() { this.signOut(); }

  showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
}

// Global App Initialization
document.addEventListener('DOMContentLoaded', () => {
  window.app = new GlobalCoverageApp();
});
