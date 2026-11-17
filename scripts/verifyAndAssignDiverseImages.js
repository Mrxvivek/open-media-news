import fs from 'fs';
import path from 'path';
import { prisma } from '../server/dist/prisma.js';

// Curated collections of verified high-res Unsplash photo IDs categorized by pillar and sub-domain
const CATEGORY_IMAGE_COLLECTIONS = {
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

function generateStraightBrief(title, summary, body) {
  const base = (summary || body || title || '')
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

function getContextualDiverseImage(category, title, id, previousImage) {
  const str = (title + ' ' + (id || '')).toLowerCase();
  let catKey = category in CATEGORY_IMAGE_COLLECTIONS ? category : 'IT';

  // Contextual topic matching
  if (/attack|breach|hack|threat|vulnerab|malware|ransom|security|supply chain|exploit|zero-day|cve|phish|payload|botnet/.test(str)) {
    catKey = 'Cyber Security';
  } else if (/chip|semiconductor|foundry|gpu|nvidia|intel|amd|hardware|datacenter|server|processor|quantum/.test(str)) {
    catKey = 'IT';
  } else if (/stock|market|invest|trade|shares|bank|capital|revenue|earnings|finance|wall street|valuation|ipo/.test(str)) {
    catKey = 'Business';
  } else if (/agent|model|neural|llm|robot|autonomous|gpt|gemini|deepmind|anthropic|openai|generative ai/.test(str)) {
    catKey = 'AI';
  }

  const collection = CATEGORY_IMAGE_COLLECTIONS[catKey] || CATEGORY_IMAGE_COLLECTIONS['IT'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }

  let index = Math.abs(hash) % collection.length;
  let candidate = `https://images.unsplash.com/${collection[index]}?auto=format&fit=crop&w=1200&q=80`;

  // Avoid consecutive duplicate
  if (previousImage && candidate === previousImage) {
    index = (index + 1) % collection.length;
    candidate = `https://images.unsplash.com/${collection[index]}?auto=format&fit=crop&w=1200&q=80`;
  }
  return candidate;
}

async function run() {
  console.log('🔄 Updating database articles with Contextual Images, 50-Word Straight Briefs, and Source Attribution...');
  const articles = await prisma.article.findMany({
    orderBy: { publishedAt: 'desc' },
    select: { id: true, category: true, title: true, summary: true, body: true, image: true, sourceName: true, sourceUrl: true, straightBrief: true }
  });

  console.log(`Found ${articles.length} articles in database.`);

  let lastImage = null;
  const updates = [];

  for (const art of articles) {
    const canonicalMatch = art.body.match(/<!--\s*canonical_url:\s*([^\s>]+)\s*-->/) ||
                           art.body.match(/\[Read the full continuous story on official wire source →\]\(([^)]+)\)/);
    const sourceMatch = art.body.match(/Originally syndicated via \*\*([^*]+)\*\*/);

    const sourceUrl = art.sourceUrl || (canonicalMatch ? canonicalMatch[1] : null);
    const sourceName = art.sourceName || (sourceMatch ? sourceMatch[1] : art.category + ' Wire');
    const straightBrief = art.straightBrief || generateStraightBrief(art.title, art.summary, art.body);

    const distinctImage = getContextualDiverseImage(art.category, art.title, art.id, lastImage);
    lastImage = distinctImage;

    updates.push(
      prisma.article.update({
        where: { id: art.id },
        data: {
          image: distinctImage,
          sourceName,
          sourceUrl,
          straightBrief,
          contentType: 'NEWS'
        }
      })
    );
  }

  console.log(`Applying contextual updates across ${updates.length} articles...`);
  // Process in chunks of 50
  for (let i = 0; i < updates.length; i += 50) {
    const chunk = updates.slice(i, i + 50);
    await Promise.all(chunk);
    process.stdout.write(`.`);
  }

  console.log('\n✅ All database articles updated with contextual images, straight briefs, and source links!');
}

run().catch(console.error).finally(() => process.exit(0));
