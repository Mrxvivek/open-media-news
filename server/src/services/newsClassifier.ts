/**
 * OPEN MEDIA — News Classification & Filtering Engine
 * 
 * Strict filtering exclusively into 4 approved pillars:
 * 1. Business
 * 2. IT & Technology ('IT')
 * 3. Cyber Security
 * 4. Artificial Intelligence ('AI')
 * 
 * Enforces English-only headlines/descriptions, excludes unrelated news
 * (politics, cinema, sports, crimes, weather, local accidents, lifestyle),
 * allows genuine tech/business developments regardless of geography,
 * and handles canonical duplicate prevention.
 */

export type ApprovedCategory = 'Business' | 'IT' | 'Cyber Security' | 'AI';

export function resolveCategory(cat?: string): ApprovedCategory | null {
  if (!cat) return null;
  const lower = cat.toLowerCase().trim();
  if (lower === 'business') return 'Business';
  if (lower === 'it' || lower === 'tech' || lower === 'technology') return 'IT';
  if (lower === 'cs' || lower === 'cyber' || lower === 'cybersecurity' || lower === 'cyber security') return 'Cyber Security';
  if (lower === 'ai' || lower === 'artificial intelligence') return 'AI';
  return null;
}

export interface ClassificationResult {
  approved: boolean;
  category: ApprovedCategory | null;
  confidence: number;
  reason: string;
  matchedKeywords: string[];
}

// Detection for Indic / Non-Latin scripts (Telugu, Devanagari, Tamil, Kannada, Malayalam, Arabic, etc.)
const NON_LATIN_SCRIPT_REGEX = /[\u0C00-\u0C7F\u0900-\u0D7F\u0E00-\u0E7F\u3040-\u30FF\u4E00-\u9FFF\u0600-\u06FF]/;

/**
 * Checks if text is primarily English and free of non-Latin Indic/foreign scripts
 */
export function isEnglishText(text?: string): boolean {
  if (!text || !text.trim()) return false;
  // If text contains non-Latin scripts (e.g. Telugu \u0C00-\u0C7F), it is not English
  if (NON_LATIN_SCRIPT_REGEX.test(text)) {
    return false;
  }
  // Check ASCII/Latin character ratio
  const latinOrPunctuation = text.match(/[\w\s.,!?'"()-;:&$%@#+/\\–—]/g) || [];
  return (latinOrPunctuation.length / text.length) >= 0.85;
}

/**
 * Translates non-English text to English using reliable translation API
 * Returns null if translation fails, is unreliable, or still contains non-Latin scripts.
 */
export async function translateToEnglish(text: string): Promise<string | null> {
  if (!text || !text.trim()) return null;
  if (isEnglishText(text)) return text.trim();

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text.trim())}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data: any = await res.json();
    if (!Array.isArray(data) || !Array.isArray(data[0])) return null;

    const translated = data[0].map((chunk: any) => chunk[0] || '').join('').trim();
    if (translated && isEnglishText(translated)) {
      return translated;
    }
    return null;
  } catch (err) {
    // Unreliable / network issue: return null so article is skipped rather than published untranslated
    return null;
  }
}

/**
 * Negative exclusion patterns — completely unrelated to Business, IT, Cyber Security, or AI
 */
const EXCLUSION_PATTERNS: Array<{ regex: RegExp; topic: string }> = [
  // Cinema, Entertainment & Celebrities
  {
    regex: /\b(box office|trailer|teaser|blockbuster|movie review|film review|cinema hall|bollywood|tollywood|hollywood|actress|actor\b|celebrities|celebrity gossip|paparazzi|red carpet|song release|soundtrack|ott release|reality show|bigg boss|koffee with karan|oscar nomination|grammy award|wedding photos|divorce rumor)\b/i,
    topic: 'Entertainment / Cinema'
  },
  // Sports & Athletics
  {
    regex: /\b(cricket|ipl|bcci|wicket|batsman|bowler|half-century|t20 world cup|test match|odi match|football league|premier league|champions league|fifa world cup|la liga|nba finals|nfl touchdown|super bowl|tennis grand slam|wimbledon|badminton tournament|formula 1|f1 grand prix|olympic medal|scorecard|athletics)\b/i,
    topic: 'Sports'
  },
  // Physical Crime & Accidents (not cybercrime)
  {
    regex: /\b(murdered|homicide|kidnapped|gang rape|sexual assault|road accident|bus collision|car crash|train derailment|drowned in river|dead body found|suicide note|gold chain snatching|liquor seized|drug peddler arrested|theft in house|police lathicharge|mob lynching)\b/i,
    topic: 'Physical Crime / Accident'
  },
  // Weather, Disasters & Traffic
  {
    regex: /\b(cyclone warning|landfall of storm|heavy rainfall alert|flood situation|flooding in|waterlogging on road|monsoon rains|earthquake hits|tsunami alert|heatwave warning|storm warning|weather forecast for today|highway submerged|traffic jam on flyover|roads inundated)\b/i,
    topic: 'Weather / Traffic / Disaster'
  },
  // Local Party Politics, Municipalities & Rallies
  {
    regex: /\b(election campaign|lok sabha election|assembly election|by-election|polling booth|voter turnout|political rally|protest march|hunger strike|chalo delhi|party high command|opposition party protest|cabinet reshuffle|political squabble|mla disqualified|corporator election|panchayat poll)\b/i,
    topic: 'Local Politics / Rallies'
  },
  // Astrology, Horoscope & General Lifestyle
  {
    regex: /\b(horoscope today|zodiac sign|astrological prediction|daily rasiphalalu|weight loss diet|belly fat tips|skincare routine|easy dinner recipe|lottery winning numbers)\b/i,
    topic: 'Astrology / Lifestyle'
  }
];

/**
 * Category-specific positive dictionaries with keyword weights
 */
const CATEGORY_DICTIONARIES: Record<ApprovedCategory, Array<{ term: RegExp; weight: number }>> = {
  'AI': [
    { term: /\b(artificial intelligence|generative ai|genai|llm|llms|large language model|large language models)\b/i, weight: 5 },
    { term: /\b(chatgpt|openai|anthropic|claude|gemini 1\.5|gemini 2|deepseek|mistral ai|perplexity ai|copilot)\b/i, weight: 5 },
    { term: /\b(machine learning|deep learning|neural network|neural networks|transformer model|diffusion model)\b/i, weight: 4 },
    { term: /\b(ai agent|ai agents|autonomous agent|autonomous agents|agentic ai|multi-agent)\b/i, weight: 4 },
    { term: /\b(computer vision|natural language processing|nlp|ai model|ai models|ai safety|ai governance)\b/i, weight: 4 },
    { term: /\b(ai startup|ai chip|ai chips|ai server|ai cluster|ai automation|robotics|humanoid robot)\b/i, weight: 3 },
    { term: /\b(hugging face|fine-tuning|prompt engineering|synthetic data|reinforcement learning|vector database)\b/i, weight: 3 },
    { term: /\b(ai adoption|ai tool|ai tools|ai platform|ai research|ai breakthrough)\b/i, weight: 3 }
  ],
  'Cyber Security': [
    { term: /\b(cybersecurity|cyber security|cyberattack|cyberattacks|cyber attack|cyber attacks)\b/i, weight: 5 },
    { term: /\b(ransomware|data breach|data breaches|zero-day|0-day|cve-\d{4}-\d+|patch tuesday)\b/i, weight: 5 },
    { term: /\b(malware|trojan|spyware|botnet|ddos attack|keylogger|rootkit|backdoor|credential stuffing)\b/i, weight: 4 },
    { term: /\b(infosec|information security|threat actor|apt group|security vulnerability|security vulnerabilities)\b/i, weight: 4 },
    { term: /\b(phishing|spear-phishing|penetration testing|ethical hacking|bug bounty|security researcher|ciso)\b/i, weight: 4 },
    { term: /\b(endpoint security|soc analyst|firewall|network security|encryption flaw|decryption)\b/i, weight: 3 },
    { term: /\b(security advisory|exploit kit|compromised accounts|unauthorized access|stolen credentials)\b/i, weight: 3 },
    { term: /\b(hacker|hackers|hacking group|dark web forum)\b/i, weight: 3 }
  ],
  'IT': [
    { term: /\b(software development|semiconductor|semiconductors|cloud computing|microprocessor)\b/i, weight: 5 },
    { term: /\b(aws|microsoft azure|google cloud|datacenter|data center|data centers|kubernetes|docker container)\b/i, weight: 4 },
    { term: /\b(intel|amd|nvidia|qualcomm|tsmc|arm architecture|apple silicon|snapdragon)\b/i, weight: 4 },
    { term: /\b(operating system|macos|windows 11|linux kernel|open source software|github)\b/i, weight: 4 },
    { term: /\b(programming language|typescript|javascript|python 3|rust lang|golang|database system|postgresql)\b/i, weight: 4 },
    { term: /\b(5g network|6g wireless|telecom infrastructure|broadband network|fiber optic|quantum computing)\b/i, weight: 4 },
    { term: /\b(devops|ci\/cd|api gateway|enterprise it|technology infrastructure|saas platform|cloud platform)\b/i, weight: 3 },
    { term: /\b(laptop|smartphone|display tech|oled display|firmware update|processor architecture)\b/i, weight: 3 }
  ],
  'Business': [
    { term: /\b(mergers and acquisitions|merger and acquisition|acquired by|acquires|acquisition of)\b/i, weight: 5 },
    { term: /\b(venture capital|vc fund|funding round|series a|series b|series c|seed funding|raised \$\d+)\b/i, weight: 5 },
    { term: /\b(initial public offering|ipo filing|quarterly earnings|earnings call|q[1-4] profit|q[1-4] revenue)\b/i, weight: 5 },
    { term: /\b(stock market|nasdaq|s&p 500|wall street|sensex|nifty|market capitalization|market cap)\b/i, weight: 4 },
    { term: /\b(fintech|private equity|startup funding|valuation reaches|revenue growth|profit margin)\b/i, weight: 4 },
    { term: /\b(shares surged|shares plunged|shares rally|stocks rally|markets rally|trading volume|dividend)\b/i, weight: 3 },
    { term: /\b(central bank|interest rates|inflation rate|corporate governance|commercial contract)\b/i, weight: 3 },
    { term: /\b(ceo appointed|cfo resigned|layoffs announce|workforce reduction|enterprise expansion)\b/i, weight: 3 }
  ]
};

/**
 * Classifies an article into one of the 4 strict categories or rejects it.
 */
export function classifyNews(
  title: string,
  summary: string,
  feedCategory?: ApprovedCategory | string
): ClassificationResult {
  const combinedText = `${title} ${summary}`.toLowerCase();

  // 1. Check Exclusion Patterns
  for (const { regex, topic } of EXCLUSION_PATTERNS) {
    if (regex.test(combinedText)) {
      // Exception: If article is clearly Cyber Security (e.g. hacker arrested or breach reported) or AI,
      // verify if Cyber Security or AI terms are strongly present
      const isCyberContext = /\b(cyber|ransomware|hacker|breach|malware|vulnerability|exploit)\b/i.test(combinedText);
      const isAIContext = /\b(artificial intelligence|ai model|chatgpt|openai|llm)\b/i.test(combinedText);
      const isBusinessMNA = /\b(acquired|acquisition|funding|shares rally|markets rally)\b/i.test(combinedText);

      // If topic is entertainment, sports, or astrology, reject outright
      if (['Entertainment / Cinema', 'Sports', 'Astrology / Lifestyle', 'Weather / Traffic / Disaster'].includes(topic)) {
        return {
          approved: false,
          category: null,
          confidence: 0,
          reason: `Rejected: Matches exclusion filter [${topic}]`,
          matchedKeywords: [topic]
        };
      }

      // For Crime / Politics: Only allow if explicitly Cyber Security, AI, or corporate tech business
      if (!isCyberContext && !isAIContext && !isBusinessMNA) {
        return {
          approved: false,
          category: null,
          confidence: 0,
          reason: `Rejected: Matches exclusion filter [${topic}]`,
          matchedKeywords: [topic]
        };
      }
    }
  }

  // 2. Score across the 4 Approved Categories
  const scores: Record<ApprovedCategory, number> = {
    'AI': 0,
    'Cyber Security': 0,
    'IT': 0,
    'Business': 0
  };
  const matched: Record<ApprovedCategory, string[]> = {
    'AI': [],
    'Cyber Security': [],
    'IT': [],
    'Business': []
  };

  for (const [catKey, rules] of Object.entries(CATEGORY_DICTIONARIES) as [ApprovedCategory, Array<{ term: RegExp; weight: number }>][]) {
    for (const rule of rules) {
      const match = combinedText.match(rule.term);
      if (match) {
        scores[catKey] += rule.weight;
        matched[catKey].push(match[0]);
      }
    }
  }

  // Dedicated feed baseline boost
  if (feedCategory === 'AI') scores['AI'] += 2;
  else if (feedCategory === 'Cyber Security') scores['Cyber Security'] += 2;
  else if (feedCategory === 'IT') scores['IT'] += 1;
  else if (feedCategory === 'Business') scores['Business'] += 1;

  // 3. Find Category with Highest Score
  let bestCategory: ApprovedCategory | null = null;
  let highestScore = 0;

  // Hierarchy prioritization when scores are close: AI & Cyber Security are high-specificity
  const categoryPriority: ApprovedCategory[] = ['AI', 'Cyber Security', 'IT', 'Business'];

  for (const cat of categoryPriority) {
    if (scores[cat] > highestScore) {
      highestScore = scores[cat];
      bestCategory = cat;
    }
  }

  // 4. Threshold Check (Reject ambiguous or low-relevance articles)
  // At least 3 points required (or 2 points if from an approved dedicated industry feed)
  const minRequiredScore = (feedCategory && ['AI', 'Cyber Security', 'IT', 'Business'].includes(feedCategory)) ? 2 : 3;

  if (!bestCategory || highestScore < minRequiredScore) {
    return {
      approved: false,
      category: null,
      confidence: highestScore,
      reason: 'Rejected: Below relevance threshold for approved categories (Business, IT, Cyber Security, AI)',
      matchedKeywords: []
    };
  }

  return {
    approved: true,
    category: bestCategory,
    confidence: highestScore,
    reason: `Approved under ${bestCategory} (Score: ${highestScore})`,
    matchedKeywords: matched[bestCategory]
  };
}

/**
 * Normalizes title for canonical duplicate detection
 */
export function normalizeHeadline(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/&amp;/g, '&')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\b(the|a|an|in|on|at|for|to|of|and|with|by|from|about)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Canonicalizes external URL to prevent duplicate syndication
 */
export function canonicalizeUrl(link?: string): string {
  if (!link) return '';
  try {
    const url = new URL(link);
    const tracking = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'gclid', 'fbclid', 'ocid', 'ref', 'source', 'taid'
    ];
    tracking.forEach(p => url.searchParams.delete(p));
    let cleaned = url.origin + url.pathname;
    if (cleaned.endsWith('/')) cleaned = cleaned.slice(0, -1);
    return cleaned.toLowerCase();
  } catch {
    return link.split('?')[0].trim().toLowerCase();
  }
}

/**
 * Classifies an article into a precise tab domain matching tab filter chips and trees
 */
export function classifyDomain(
  category: ApprovedCategory,
  title: string,
  summary: string,
  feedDomain?: string
): string {
  const combined = `${title} ${summary}`.toLowerCase();

  if (category === 'Business') {
    if (/\b(earning|earnings|revenue|profit|profits|quarterly|quarter|q[1-4]|fiscal|results|guidance|shares|stock|stocks|stock market|wall street|valuation|dividend|margins|nasdaq|s&p|sensex|nifty|market cap)\b/i.test(combined)) {
      return 'Earnings';
    }
    if (/\b(m&a|merger|mergers|acquire|acquires|acquired|acquisition|acquisitions|deal|deals|buyout|takeover|joint venture|alliance|purchase)\b/i.test(combined)) {
      return 'M&A';
    }
    if (/\b(ceo|cfo|cto|coo|chief executive|executive|executives|board|founder|leadership|director|appointed|appoints|resigns|steps down|oust)\b/i.test(combined)) {
      return 'Leadership';
    }
    if (/\b(expansion|expand|expands|expanding|growth|new market|nationwide|offices|hiring|scaling|rollout)\b/i.test(combined)) {
      return 'Expansion';
    }
    if (/\b(partnership|partnerships|partner|partners|collaboration|collaborate|pact|tie-up)\b/i.test(combined)) {
      return 'Partnerships';
    }
    if (/\b(strategy|strategic|transformation|compete|competition|pivot|restructuring|innovation|overhaul|outlook)\b/i.test(combined)) {
      return 'Strategy';
    }
    return 'Companies';
  }

  if (category === 'IT') {
    if (/\b(semiconductor|semiconductors|chip|chips|nvidia|intel|amd|tsmc|qualcomm|arm|hardware|processor|gpu|cpu|foundry|silicon)\b/i.test(combined)) {
      return 'Semiconductors';
    }
    if (/\b(cloud|aws|amazon web services|azure|google cloud|data center|datacenter|kubernetes|docker|container|server|servers|multi-cloud|infrastructure|devops)\b/i.test(combined)) {
      return 'Cloud Computing';
    }
    if (/\b(artificial intelligence|generative ai|genai|llm|chatgpt|openai|anthropic|claude|gemini|machine learning|deep learning|copilot|model)\b/i.test(combined)) {
      return 'Artificial Intelligence';
    }
    if (/\b(startup|startups|venture|vc|vcs|funding|fundraise|seed|series a|series b|raised|founder|unicorn|valuation)\b/i.test(combined)) {
      return 'Startups';
    }
    if (/\b(fintech|payments|payment|banking|crypto|bitcoin|blockchain|digital finance|wallet|lending)\b/i.test(combined)) {
      return 'FinTech';
    }
    if (/\b(saas|software as a service|subscription|b2b|platform|cloud software|license|crm)\b/i.test(combined)) {
      return 'SaaS';
    }
    return 'Enterprise IT';
  }

  if (category === 'Cyber Security') {
    if (/\b(ransomware|extortion|encrypt|decrypted|ransom|leak site|lockbit|blackcat|clop)\b/i.test(combined)) {
      return 'Ransomware';
    }
    if (/\b(zero-day|zero day|0-day|unpatched|cve|cve-[0-9-]+|exploit|vulnerability|vulnerabilities|flaw|patch tuesday)\b/i.test(combined)) {
      return 'Zero-Day';
    }
    if (/\b(data breach|data breaches|breach|breached|leak|leaked|stolen credentials|credentials|passwords|compromise|identity theft)\b/i.test(combined)) {
      return 'Data Breaches';
    }
    if (/\b(critical|urgent|alert|emergency|severe|severity|remote code execution|rce|patch now)\b/i.test(combined)) {
      return 'Critical';
    }
    if (/\b(privacy|data privacy|surveillance|tracking|gdpr|regulation|fine|compliance|personal data)\b/i.test(combined)) {
      return 'Privacy';
    }
    if (/\b(attack|attacks|global attack|cyberattack|campaign|nation-state|apt|intrusion|threat actor|espionage)\b/i.test(combined)) {
      return 'Global Attacks';
    }
    return 'Security Research';
  }

  if (category === 'AI') {
    if (/\b(policy|regulation|governance|compliance|standard|law|framework|act)\b/i.test(combined)) {
      return 'AI Policy';
    }
    if (/\b(research|paper|benchmark|reasoning|study|algorithm)\b/i.test(combined)) {
      return 'AI Research';
    }
    if (/\b(startup|startups|funding|seed|raised|vc)\b/i.test(combined)) {
      return 'AI Startups';
    }
    if (/\b(agent|agents|agentic|workflow|copilot|coding agent|tools|tooling)\b/i.test(combined)) {
      return 'AI Tools & Agents';
    }
    if (/\b(security|injection|safety|jailbreak|watermarking|guardrail)\b/i.test(combined)) {
      return 'AI Security';
    }
    if (/\b(enterprise|business|adoption|deployment|internal platform|cdo)\b/i.test(combined)) {
      return 'Enterprise AI';
    }
    return 'Generative AI';
  }

  return feedDomain || category;
}
