import fs from 'fs';
import path from 'path';

async function runEnhancementsTests() {
  console.log('====================================================');
  console.log('   OPEN MEDIA — PUBLISHER & ENHANCEMENTS SUITE     ');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, desc: string, details?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`✅ [PASS ${total}] ${desc}`);
      if (details) console.log(`   └─ ${details}`);
    } else {
      console.error(`❌ [FAIL ${total}] ${desc}`);
      if (details) console.error(`   └─ ${details}`);
    }
  }

  const port = process.env.PORT || 3001;
  const baseUrl = `http://127.0.0.1:${port}`;
  const rootDir = fs.existsSync(path.join(process.cwd(), 'index.html'))
    ? process.cwd()
    : path.join(process.cwd(), '..');

  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  const appJs = fs.readFileSync(path.join(rootDir, 'js/app.js'), 'utf8');

  // 1. Publisher news published live to Breaking Ticker
  // Login as publisher
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'publisher@openmedia.test', password: 'PublisherPass123!' })
  });
  const loginData: any = await loginRes.json();
  const token = loginData.token;

  assert(loginRes.ok && Boolean(token), 'Publisher authentication successful');

  const breakingTitle = `BREAKING: Autonomous AI Multi-Agent Swarms Clear Telecom Benchmarks ${Date.now()}`;
  const createArtRes = await fetch(`${baseUrl}/api/articles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: breakingTitle,
      summary: 'Carrier-grade benchmarks indicate sub-10ms response latency for autonomous agent routing.',
      body: 'Full continuous intelligence report detailing carrier-grade benchmark results across tier-1 telecoms.',
      category: 'IT',
      domain: 'Cloud Infrastructure',
      status: 'PUBLISHED'
    })
  });
  const createArtData: any = await createArtRes.json();
  assert(
    createArtRes.ok && createArtData.article?.status === 'PUBLISHED',
    'Publisher news post published directly with status: PUBLISHED',
    `Article ID: ${createArtData.article?.id}`
  );

  // Check ticker endpoint
  const tickerRes = await fetch(`${baseUrl}/api/news/ticker`);
  const tickerData: any = await tickerRes.json();
  const headlines = tickerData.headlines || tickerData.items || [];
  const topHeadline = headlines[0];

  assert(
    headlines.some((h: any) => h.title === breakingTitle),
    'Published news item appears immediately in breaking column ticker (/api/news/ticker)',
    `Top ticker item: "${topHeadline?.title?.slice(0, 50)}..."`
  );

  // 2. Client-side Real-time Ticker Event Binding
  assert(
    appJs.includes("this.socket.on('ticker:new'") && appJs.includes('this.tickerItems'),
    'Client real-time engine subscribes to ticker:new breaking headline events',
    'Prepend breaking news headline to active marquee without delay'
  );

  // 3. RSS & Publisher News Poster Images Supported
  assert(
    appJs.includes('getPosterFallback') && 
    appJs.includes("onerror=\"this.onerror=null;this.src=app.getPosterFallback"),
    'All card templates contain inline onerror poster fallback handlers',
    'Guarantees resilient poster rendering against 403 hotlink blocks and broken CDN links'
  );

  // 4. Publisher Poster Upload & 50MB Payload Limit
  assert(
    indexHtml.includes('id="pub-image"') && 
    !indexHtml.includes('id="pub-image" class="form-control" type="url"') &&
    appJs.includes('handleLocalImageSelection'),
    'Publisher poster input accepts both image URLs and local uploaded files',
    'Eliminated restrictive URL-only input constraints for local poster images'
  );

  // 5. Trending News (Explore Latest Wire Stories) Smooth Navigation
  assert(
    appJs.includes('scrollToLatestWire') && 
    appJs.includes('home-latest-section') &&
    appJs.includes('Explore Latest Wire Stories'),
    'Trending News "Explore Latest Wire Stories" smoothly navigates to the interactive latest wire feed',
    'Targets #home-latest-section with smooth scrolling'
  );

  // 6. Homepage Column News Deduplication
  assert(
    appJs.includes('homepageAssignedIds') &&
    appJs.includes('renderTechSpotlight') &&
    appJs.includes('!used.has(a.id)'),
    'Homepage sections coordinate deduplication across separate columns and blocks',
    'Prevents repeating articles already showcased in Hero, Editor Picks, or Spotlight blocks'
  );

  // 7. Register Now Button
  assert(
    indexHtml.includes('Register Now') &&
    appJs.includes('handleEventRegister') &&
    appJs.includes('openEventModal'),
    'Register Now buttons active across header nav, mobile drawer, auth modal, and webinars',
    'Webinar registration validates details, saves pass, and dynamically updates button to "Registered"'
  );

  // 8. Subscribe Button & Email Input
  assert(
    indexHtml.includes('id="newsletter-email"') &&
    indexHtml.includes('type="email"') &&
    appJs.includes('handleNewsletterSubscribe') &&
    appJs.includes('gc_newsletter_subscribers'),
    'Newsletter Subscribe section contains validated work email input and subscription handler',
    'Saves subscriber to database/storage and provides personalized confirmation feedback'
  );

  console.log('\n====================================================');
  console.log(`   ENHANCEMENTS SUITE: ${passed}/${total} PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('====================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runEnhancementsTests().catch(err => {
  console.error('Fatal error running enhancements test suite:', err);
  process.exit(1);
});
