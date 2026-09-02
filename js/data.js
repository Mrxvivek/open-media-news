/**
 * OPEN MEDIA — DATA ARCHITECTURE
 * Consolidated news data, webinars, authors, publisher tracking.
 * Seed editorial content used when the platform database is unavailable,
 * not live verified reporting.
 */

const IMG = {
  ai: [
    "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1591453089816-0fbb971b454c?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1555255707-c07966088b7b?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1620121692029-d088224ddc74?auto=format&fit=crop&w=900&q=80"
  ],
  it: [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=900&q=80"
  ],
  business: [
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1554774853-b415df9eeb92?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80"
  ],
  cyber: [
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1614028674026-a65e31bfd27c?auto=format&fit=crop&w=900&q=80"
  ]
};

function art(o, i, pool) {
  return Object.assign({
    id: `art-${i}`,
    image: pool[i % pool.length],
    readTime: `${3 + (i % 6)} min read`,
    body: o.body || `${o.summary} OPEN MEDIA's editorial desk continues to track this development as it unfolds, with further analysis expected as new details are confirmed by sources familiar with the matter.`
  }, o);
}

let _id = 100;
const nextId = () => `art-${_id++}`;

const IT_SPEC = [
  ["Artificial Intelligence", "Enterprise Copilot Adoption Crosses Tipping Point in Fortune 500 Rollouts", "New survey data shows generative assistants are now embedded in daily workflows across finance, legal, and engineering teams.", "Priya Nair", "Aug 20, 2026"],
  ["Artificial Intelligence", "Open-Weight Models Narrow the Gap With Closed Frontier Systems", "Benchmark results suggest openly licensed models are closing performance gaps in reasoning and coding tasks.", "Meera Rao", "Aug 19, 2026"],
  ["Cloud Computing", "Hyperscalers Race to Add Liquid-Cooled Capacity for AI Workloads", "Major cloud providers are retrofitting data centers to handle the thermal demands of dense accelerator clusters.", "Wei Zhang", "Aug 18, 2026"],
  ["Cloud Computing", "Multi-Cloud Spending Overtakes Single-Vendor Contracts for First Time", "Enterprises are increasingly splitting workloads across providers to manage cost and reduce lock-in risk.", "Tom Whitfield", "Aug 17, 2026"],
  ["Semiconductors", "Next-Generation Chip Packaging Promises Sharp Efficiency Gains", "Advanced packaging techniques are helping manufacturers pack more compute into the same thermal envelope.", "Wei Zhang", "Aug 20, 2026"],
  ["Semiconductors", "Foundries Report Record Bookings as AI Accelerator Demand Persists", "Order backlogs for advanced-node capacity stretch well into next year, industry filings show.", "Daniel Osei", "Aug 16, 2026"],
  ["Enterprise IT", "Legacy Modernization Budgets Rise as Mainframe Talent Shortage Deepens", "CIOs are accelerating migration timelines to reduce dependency on a shrinking pool of specialized engineers.", "Priya Nair", "Aug 15, 2026"],
  ["Startups", "Infrastructure Startups Attract Fresh Capital Amid AI Buildout", "Venture investment is flowing toward companies solving power, cooling, and networking bottlenecks.", "Tom Whitfield", "Aug 19, 2026"],
  ["SaaS", "Usage-Based Pricing Gains Ground Over Traditional Seat Licensing", "Software vendors are rethinking pricing models as AI features change how customers derive value.", "Meera Rao", "Aug 14, 2026"],
  ["FinTech", "Embedded Finance Tools Expand Into Supply Chain Platforms", "B2B software providers are layering payments and lending directly into procurement workflows.", "Daniel Osei", "Aug 13, 2026"],
  ["Product Launches", "Developer Platform Ships Native Agent Orchestration Toolkit", "The release lets engineering teams compose multi-step automated workflows without custom glue code.", "Priya Nair", "Aug 12, 2026"],
  ["Founder Stories", "From Campus Project to Global Platform: One Founder's Decade-Long Build", "A profile of the long, unglamorous path between an early prototype and enterprise-scale adoption.", "Tom Whitfield", "Aug 11, 2026"]
];

const BUSINESS_SPEC = [
  ["Companies", "Global Retailer Unveils Logistics Overhaul to Cut Delivery Times", "The multi-year investment targets same-day delivery in dozens of new metro markets.", "Amara Chen", "Aug 20, 2026"],
  ["Companies", "Consumer Electronics Maker Diversifies Manufacturing Footprint", "The move spreads production risk across multiple regions following recent supply disruptions.", "Tom Whitfield", "Aug 18, 2026"],
  ["Earnings", "Enterprise Software Vendor Beats Estimates on Strong Renewal Rates", "Quarterly results point to resilient demand despite broader budget scrutiny.", "Amara Chen", "Aug 19, 2026"],
  ["Earnings", "Industrial Conglomerate Posts Mixed Results as Margins Compress", "Management points to input costs and currency headwinds weighing on profitability.", "Tom Whitfield", "Aug 17, 2026"],
  ["M&A", "Mid-Market Software Firms Consolidate in Wave of Roll-Up Deals", "Private equity-backed buyers are combining niche vendors to build broader platforms.", "Amara Chen", "Aug 16, 2026"],
  ["M&A", "Cross-Border Deal Activity Rebounds as Financing Conditions Ease", "Dealmakers report renewed appetite for strategic acquisitions after a slow prior year.", "Daniel Osei", "Aug 15, 2026"],
  ["Strategy", "Retailers Lean Into Loyalty Programs to Offset Slowing Growth", "Personalized rewards are becoming a central lever for customer retention.", "Amara Chen", "Aug 14, 2026"],
  ["Leadership", "Boardrooms Rethink Succession Planning Amid Executive Turnover", "Governance experts say formalized succession pipelines are becoming a competitive advantage.", "Tom Whitfield", "Aug 13, 2026"],
  ["Leadership", "New Chief Executive Outlines Turnaround Plan for Struggling Division", "The strategy centers on cost discipline and a narrower product portfolio.", "Amara Chen", "Aug 12, 2026"],
  ["Expansion", "Regional Bank Expands Digital-First Branch Model Nationwide", "The rollout follows a successful pilot that cut operating costs per branch significantly.", "Daniel Osei", "Aug 11, 2026"],
  ["Partnerships", "Automaker and Battery Supplier Deepen Manufacturing Alliance", "The expanded partnership secures long-term supply for upcoming electric vehicle lines.", "Tom Whitfield", "Aug 10, 2026"],
  ["Partnerships", "Airlines Form Joint Loyalty Alliance Spanning Three Continents", "Members will be able to earn and redeem points across a shared partner network.", "Amara Chen", "Aug 9, 2026"],
  ["Companies", "Global Manufacturer Opens Regional Innovation Hub for New Products", "The new center will bring product design, customer research, and local operations teams under one roof.", "Amara Chen", "Aug 8, 2026"],
  ["Earnings", "Digital Payments Group Raises Full-Year Revenue Outlook", "Higher transaction volume and improving margins lead management to lift its guidance for the year.", "Daniel Osei", "Aug 7, 2026"],
  ["M&A", "Logistics Technology Provider Acquires Warehouse Automation Specialist", "The deal combines route planning software with robotics capabilities for large distribution networks.", "Tom Whitfield", "Aug 6, 2026"],
  ["Strategy", "Chief Strategy Officers Prioritize Resilient Supply Networks", "New operating plans emphasize supplier visibility, regional capacity, and faster scenario planning.", "Amara Chen", "Aug 5, 2026"],
  ["Leadership", "Companies Add Customer Experience Leaders to Executive Teams", "The expanded roles reflect a push to connect product decisions with measurable customer outcomes.", "Tom Whitfield", "Aug 4, 2026"],
  ["Expansion", "Energy Services Firm Targets Five New Markets in Growth Plan", "The expansion will focus on regions where industrial customers are accelerating clean-energy investments.", "Daniel Osei", "Aug 3, 2026"],
  ["Partnerships", "Universities and Employers Create Shared Workforce Development Network", "The program connects employers with practical training pathways for high-demand business technology roles.", "Amara Chen", "Aug 2, 2026"]
];

const CYBER_SPEC = [
  ["Critical", "CRITICAL", "Remote Code Execution Flaw Confirmed in Widely Used VPN Appliance", "Vendors urge immediate patching as proof-of-concept exploit code circulates publicly.", "Daniel Osei", "Aug 20, 2026"],
  ["Critical", "CRITICAL", "Coordinated Intrusion Campaign Targets Energy Sector Operators", "Investigators say the campaign has been active for several weeks before detection.", "Wei Zhang", "Aug 19, 2026"],
  ["Global Attacks", "ACTIVE THREAT", "Nation-State Group Linked to Wave of Telecom Network Intrusions", "Researchers attribute the campaign to an advanced persistent threat group with a long intrusion history.", "Daniel Osei", "Aug 18, 2026"],
  ["Zero-Day", "ZERO-DAY", "Unpatched Flaw in Popular Browser Engine Under Active Exploitation", "The vendor has confirmed the issue and is preparing an emergency out-of-band update.", "Wei Zhang", "Aug 17, 2026"],
  ["Zero-Day", "PATCH AVAILABLE", "Enterprise Backup Software Vendor Ships Fix for Authentication Bypass", "Administrators are advised to apply the update immediately given the severity rating.", "Daniel Osei", "Aug 16, 2026"],
  ["Ransomware", "HIGH", "Ransomware Group Claims Breach of Regional Healthcare Network", "The group says it has exfiltrated patient records and is threatening public release.", "Wei Zhang", "Aug 15, 2026"],
  ["Ransomware", "ACTIVE THREAT", "Manufacturing Firms Warned of Fresh Ransomware Affiliate Activity", "Analysts note a resurgence in double-extortion tactics targeting industrial control networks.", "Daniel Osei", "Aug 14, 2026"],
  ["Privacy", "HIGH", "Regulators Fine Adtech Firm Over Cross-Border Data Transfer Violations", "The penalty is among the largest issued under the region's updated privacy framework.", "Wei Zhang", "Aug 13, 2026"],
  ["Security Research", "PATCH AVAILABLE", "Researchers Disclose Chain of Bugs Allowing Full Device Takeover", "The vendor credits the responsible disclosure process for a coordinated fix timeline.", "Daniel Osei", "Aug 12, 2026"],
  ["Data Breaches", "HIGH", "Retail Chain Confirms Payment Card Data Exposure at Point-of-Sale", "The company says it has notified affected customers and engaged an outside forensics firm.", "Wei Zhang", "Aug 11, 2026"]
];

const AI_SPEC = [
  ["Generative AI", "Multimodal Models Move From Demos to Production Pipelines", "Enterprises report growing use of multimodal systems for document, image, and audio workflows together.", "Meera Rao", "Aug 20, 2026"],
  ["Generative AI", "Long-Context Models Change How Teams Approach Document Review", "Legal and compliance teams say expanded context windows are reshaping review workflows.", "Elena Rostova", "Aug 19, 2026"],
  ["AI Research", "New Benchmark Suite Targets Reasoning Over Rote Recall", "Researchers argue current leaderboards overstate real-world reasoning capability.", "Elena Rostova", "Aug 18, 2026"],
  ["AI Research", "Study Finds Diminishing Returns From Pure Scale Beyond Certain Thresholds", "The findings add to a growing debate over where the next performance gains will come from.", "Meera Rao", "Aug 17, 2026"],
  ["AI Startups", "Vertical AI Startups Outpace Horizontal Platforms in Retention", "Founders say narrow, workflow-specific products are proving stickier with enterprise buyers.", "Priya Nair", "Aug 16, 2026"],
  ["AI Startups", "Seed-Stage AI Funding Concentrates Around Applied Tooling", "Investors say infrastructure and evaluation tooling are attracting outsized early interest.", "Tom Whitfield", "Aug 15, 2026"],
  ["AI Security", "Prompt Injection Remains Top Concern for Agentic Deployments", "Security teams are building new testing layers specifically for autonomous agent behavior.", "Daniel Osei", "Aug 14, 2026"],
  ["AI Security", "Model Watermarking Standards Advance Toward Industry Consensus", "A coalition of vendors is aligning on shared provenance and detection standards.", "Wei Zhang", "Aug 13, 2026"],
  ["AI Tools & Agents", "Autonomous Coding Agents Take on Larger, Multi-File Refactors", "Early enterprise pilots show promise alongside continued need for human review.", "Priya Nair", "Aug 12, 2026"],
  ["AI Tools & Agents", "Browser-Native Agents Expand Beyond Simple Task Automation", "New releases let agents complete multi-step workflows across web applications.", "Meera Rao", "Aug 11, 2026"],
  ["Enterprise AI", "Chief Data Officers Push for Centralized Model Governance", "Organizations are consolidating scattered pilots under a single evaluation and risk framework.", "Elena Rostova", "Aug 10, 2026"],
  ["Enterprise AI", "Internal AI Platforms Emerge as Competitive Differentiator", "Large enterprises increasingly build shared internal tooling rather than relying solely on vendors.", "Priya Nair", "Aug 9, 2026"],
  ["AI Policy", "Regulators Publish Draft Guidance on High-Risk AI Use Cases", "The proposal would introduce new disclosure requirements for automated decision systems.", "Elena Rostova", "Aug 8, 2026"],
  ["AI Policy", "Cross-Border Coalition Proposes Shared AI Incident Reporting Standard", "Officials say a common reporting baseline could speed coordinated responses to AI-related incidents.", "Meera Rao", "Aug 7, 2026"]
];

function buildArticles(spec, category, pool, hasSeverity) {
  return spec.map((row, i) => {
    if (hasSeverity) {
      const [domain, severity, title, summary, author, date] = row;
      return art({ id: nextId(), category, domain, severity, title, summary, author, date }, i, pool);
    }
    const [domain, title, summary, author, date] = row;
    return art({ id: nextId(), category, domain, title, summary, author, date }, i, pool);
  });
}

const GC_DATA = {
  heroStories: [
    {
      id: "hero-1",
      category: "IT",
      title: "World Leaders Reach Framework Agreement on Artificial Intelligence Safety",
      description: "A landmark multi-nation accord establishes safety standards, auditing procedures, and risk thresholds for frontier AI models.",
      author: "Meera Rao",
      published: "12 min ago",
      readTime: "6 min read",
      image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1400&q=80",
      pages: [
        { title: "Page 1 · Introduction", content: "Delegates from 28 nations have signed a landmark agreement establishing global safety guardrails for advanced AI systems, marking one of the most significant coordinated policy actions in the sector's history." },
        { title: "Page 2 · Key Insights", content: "• Mandated third-party audits prior to model deployment.\n• Threshold limits on autonomous compute scaling.\n• A global registry for frontier AI training clusters." },
        { title: "Page 3 · Expert Opinion", content: "\u201cThis agreement represents a concrete step toward proactive governance of increasingly autonomous systems,\u201d said one policy adviser involved in the negotiations." },
        { title: "Page 4 · Related Intelligence", content: "Related coverage: semiconductor export protocols, regional AI enforcement directives, and ongoing debate over compute-threshold regulation." }
      ]
    },
    {
      id: "hero-2",
      category: "Cyber Security",
      title: "Zero-Day Exploit Targets Critical Infrastructure Systems Worldwide",
      description: "Security researchers detect active exploitation of an unpatched remote code execution vulnerability in industrial routers.",
      author: "Daniel Osei",
      published: "35 min ago",
      readTime: "5 min read",
      image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1400&q=80",
      pages: [
        { title: "Page 1 · Attack Overview", content: "Threat actors are actively targeting edge networking hardware across power grids and municipal facilities in multiple regions." },
        { title: "Page 2 · Technical Vectors", content: "The exploit targets an unauthenticated remote code execution flaw, allowing attackers to gain root-level access via crafted network packets." },
        { title: "Page 3 · Mitigation Steps", content: "Administrators are advised to apply vendor-issued firmware updates immediately and isolate legacy management interfaces from public networks." },
        { title: "Page 4 · IOC Directory", content: "Indicators of compromise, including relevant hashes and IP ranges, have been published to the OPEN MEDIA Threat Radar for defenders." }
      ]
    },
    {
      id: "hero-3",
      category: "AI",
      title: "Enterprise AI Spending Set to Double as Agentic Workflows Mature",
      description: "New research points to a sharp acceleration in enterprise budgets as autonomous agents move from pilots into core operations.",
      author: "Elena Rostova",
      published: "1 hour ago",
      readTime: "4 min read",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80",
      pages: [
        { title: "Page 1 · Introduction", content: "Enterprise budgets allocated to AI initiatives are on track to roughly double over the next fiscal year, according to newly released industry research." },
        { title: "Page 2 · Key Insights", content: "• Agentic workflows are moving beyond customer support into finance and operations.\n• Governance and evaluation tooling are the fastest-growing budget lines.\n• Mid-market adoption is accelerating faster than large-enterprise adoption." },
        { title: "Page 3 · Expert Opinion", content: "\u201cThe center of gravity is shifting from experimentation to accountable, measurable deployment,\u201d noted one enterprise architect surveyed for the report." },
        { title: "Page 4 · Related Intelligence", content: "Related coverage: model governance frameworks, autonomous coding agents, and enterprise data platform investment trends." }
      ]
    }
  ],

  trending: [
    { id: "trend-1", category: "Business", title: "NVIDIA Announces Next-Gen Architecture for Accelerated Computing", time: "1 hour ago", image: IMG.business[0] },
    { id: "trend-2", category: "IT", title: "Quantum-Assisted Simulation Speeds Up Battery Chemistry Research", time: "2 hours ago", image: IMG.it[6] },
    { id: "trend-3", category: "Cyber Security", title: "Global Banking Consortium Disrupts Ransomware Payment Network", time: "3 hours ago", image: IMG.cyber[1] },
    { id: "trend-4", category: "AI", title: "Autonomous Research Agents Begin Assisting in Drug Discovery Pipelines", time: "3 hours ago", image: IMG.ai[3] },
    { id: "trend-5", category: "Business", title: "Global Tech M&A Volume Surges 40% in the Third Quarter", time: "4 hours ago", image: IMG.business[1] },
    { id: "trend-6", category: "IT", title: "Semiconductor Export Rules Tighten Across Three Major Markets", time: "5 hours ago", image: IMG.it[4] }
  ],

  articles: [
    ...buildArticles(IT_SPEC, "IT", IMG.it, false),
    ...buildArticles(BUSINESS_SPEC, "Business", IMG.business, false),
    ...buildArticles(CYBER_SPEC, "Cyber Security", IMG.cyber, true),
    ...buildArticles(AI_SPEC, "AI", IMG.ai, false)
  ],

  events: [
    {
      id: "evt-1",
      title: "Global Cyber Defense Summit 2026",
      type: "Conference",
      date: "Sep 15, 2026",
      time: "9:00 AM GMT",
      speaker: "Dr. Sarah Jenkins",
      organization: "Independent CISO Council",
      description: "An interactive briefing on proactive ransomware mitigation and zero-trust framework execution.",
      category: "Cyber Security",
      registrationUrl: "#",
      image: IMG.cyber[2]
    },
    {
      id: "evt-2",
      title: "Enterprise AI Architecture Keynote",
      type: "Webinar",
      date: "Oct 02, 2026",
      time: "3:00 PM GMT",
      speaker: "Marcus Vance",
      organization: "Vance Cloud Systems",
      description: "Scaling private large language models within enterprise data centers efficiently.",
      category: "AI",
      registrationUrl: "#",
      image: IMG.ai[5]
    },
    {
      id: "evt-3",
      title: "Capital Markets & Digital Transformation Forum",
      type: "Forum",
      date: "Oct 09, 2026",
      time: "11:00 AM GMT",
      speaker: "Renata Alvez",
      organization: "Alvez Partners",
      description: "Senior finance leaders discuss the next phase of enterprise digital transformation.",
      category: "Business",
      registrationUrl: "#",
      image: IMG.business[3]
    },
    {
      id: "evt-4",
      title: "Zero-Day Response Training Intensive",
      type: "Training",
      date: "Oct 21, 2026",
      time: "10:00 AM GMT",
      speaker: "Kenji Watanabe",
      organization: "Threat Research Collective",
      description: "A hands-on session covering triage, containment, and disclosure for critical vulnerabilities.",
      category: "Cyber Security",
      registrationUrl: "#",
      image: IMG.cyber[4]
    }
  ],

  authors: [
    { name: "Meera Rao", topic: "AI Safety & Policy", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=80" },
    { name: "Daniel Osei", topic: "Threat Intelligence", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80" },
    { name: "Wei Zhang", topic: "Cloud & Infrastructure", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80" },
    { name: "Priya Nair", topic: "Enterprise IT", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=100&q=80" },
    { name: "Elena Rostova", topic: "AI Research", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=100&q=80" },
    { name: "Amara Chen", topic: "Corporate & Markets", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80" },
    { name: "Tom Whitfield", topic: "Business Strategy", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=100&q=80" }
  ],

  ads: [
    { id: "ad-1", title: "Cloud Infrastructure Summit 2026", body: "Join global technology leaders in San Francisco this October.", cta: "Register Now" },
    { id: "ad-2", title: "OPEN MEDIA Intelligence Reports", body: "In-depth quarterly briefings on AI, cybersecurity, and enterprise technology.", cta: "Explore Reports" },
    { id: "ad-3", title: "Executive Cybersecurity Briefing Series", body: "Private sessions for CISOs and security leadership teams.", cta: "Request Invite" },
    { id: "ad-4", title: "OPEN MEDIA for Teams", body: "Bring curated intelligence briefings to your whole organization.", cta: "Learn More" }
  ]
};

// Master immutable arrays to prevent in-place mutation edge cases
GC_DATA.master = Object.freeze({
  heroStories: Object.freeze([...GC_DATA.heroStories]),
  trending: Object.freeze([...GC_DATA.trending]),
  articles: Object.freeze([...GC_DATA.articles]),
  events: Object.freeze([...GC_DATA.events])
});
