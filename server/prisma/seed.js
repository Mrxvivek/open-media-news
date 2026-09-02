"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seed...');
    // Clean existing data
    await prisma.comment.deleteMany();
    await prisma.savedArticle.deleteMany();
    await prisma.authorFollow.deleteMany();
    await prisma.article.deleteMany();
    await prisma.user.deleteMany();
    const rootAdminPassword = 'AdminPass123!';
    const publisherPassword = 'PublisherPass123!';
    const readerPassword = 'UserPass123!';
    const [readerPasswordHash, publisherPasswordHash, adminPasswordHash] = await Promise.all([
        bcryptjs_1.default.hash(readerPassword, 10),
        bcryptjs_1.default.hash(publisherPassword, 10),
        bcryptjs_1.default.hash(rootAdminPassword, 10)
    ]);
    // 1. Create Core Accounts with Root Admin
    const user = await prisma.user.create({
        data: {
            name: 'Reader Account',
            email: 'user@openmedia.test',
            passwordHash: readerPasswordHash,
            role: 'USER',
            isRootAdmin: false
        }
    });
    const publisher = await prisma.user.create({
        data: {
            name: 'Default Publisher',
            email: 'publisher@openmedia.test',
            passwordHash: publisherPasswordHash,
            role: 'PUBLISHER',
            isRootAdmin: false
        }
    });
    const admin = await prisma.user.create({
        data: {
            name: 'Editorial Lead',
            email: 'admin@openmedia.test',
            passwordHash: adminPasswordHash,
            role: 'ADMIN',
            isRootAdmin: true,
            rootAdminMarker: 'PRIMARY_ROOT_ADMIN'
        }
    });
    console.log('Clean production credentials ready:');
    console.log(`  Root Admin: admin@openmedia.test | ${rootAdminPassword}`);
    console.log(`  Default Publisher: publisher@openmedia.test | ${publisherPassword}`);
    console.log(`  Default Reader: user@openmedia.test | ${readerPassword}`);
    console.log('Created 3 core accounts with Root Admin');
    // 2. Create Published Articles across all categories
    const publishedArticles = [
        {
            title: 'Enterprise Copilot Adoption Crosses Tipping Point in Fortune 500 Rollouts',
            slug: 'enterprise-copilot-adoption-tipping-point-893fa',
            summary: 'New survey data shows generative assistants are now embedded in daily workflows across finance, legal, and engineering teams.',
            body: 'Enterprise rollouts of generative AI assistants have transitioned from pilot stages to full operational deployment. Surveying over 300 Fortune 500 IT directors, researchers noted unprecedented productivity gains alongside new compliance frameworks designed to protect proprietary corporate code and customer data.',
            category: 'IT',
            domain: 'Artificial Intelligence',
            image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80',
            status: 'PUBLISHED',
            authorId: publisher.id,
            publishedAt: new Date(Date.now() - 3600000 * 2)
        },
        {
            title: 'Hyperscalers Race to Add Liquid-Cooled Capacity for Next-Gen Accelerator Clusters',
            slug: 'hyperscalers-race-liquid-cooled-capacity-27bc1',
            summary: 'Major cloud providers are retrofitting data centers to handle the thermal demands of high-density AI clusters.',
            body: 'Thermal design power ratings on modern GPU nodes have pushed traditional air cooling to physical limits. Cloud infrastructure titans are investing billions in direct-to-chip liquid cooling retrofits to ensure steady uptime across high-density AI clusters.',
            category: 'IT',
            domain: 'Cloud Computing',
            image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=900&q=80',
            status: 'PUBLISHED',
            authorId: publisher.id,
            publishedAt: new Date(Date.now() - 3600000 * 6)
        },
        {
            title: 'Global Chipmakers Announce $14B Consortium for Advanced Packaging Facilities',
            slug: 'chipmakers-14b-advanced-packaging-consortium-51e9b',
            summary: 'Semiconductor manufacturers unite to build next-generation packaging hubs across North America and Europe.',
            body: 'Advanced packaging has become the primary bottleneck in scaling chip performance. The new joint initiative aims to deploy high-density interconnect substrates and 3D stacking solutions by late 2027.',
            category: 'IT',
            domain: 'Semiconductors',
            image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=900&q=80',
            status: 'PUBLISHED',
            authorId: publisher.id,
            publishedAt: new Date(Date.now() - 3600000 * 12)
        },
        {
            title: 'Zero-Day Vulnerability in Popular Gateway Firmware Exploited in State-Sponsored Campaign',
            slug: 'zero-day-gateway-firmware-state-sponsored-c918a',
            summary: 'Security agencies issue emergency directives following active targeting of perimeter edge appliances.',
            body: 'CISA and partner international cybersecurity centers have published joint guidance urging immediate disconnection or patching of vulnerable edge devices after forensic evidence tied active exploitations to nation-state threat groups.',
            category: 'Cyber Security',
            domain: 'Zero-Day Radar',
            image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=900&q=80',
            status: 'PUBLISHED',
            authorId: publisher.id,
            publishedAt: new Date(Date.now() - 3600000 * 4)
        },
        {
            title: 'Ransomware Cartels Adopt Rust-Based Encryptors to Bypass Legacy Endpoint Detection',
            slug: 'ransomware-cartels-adopt-rust-encryptors-67a3f',
            summary: 'Threat research confirms rapid shift towards cross-platform memory-safe languages to evade heuristics.',
            body: 'Multiple ransomware syndicates have rewritten their payload generators in Rust, leveraging memory safety and lower signature detection rates on standard endpoint detection and response (EDR) platforms.',
            category: 'Cyber Security',
            domain: 'Ransomware Files',
            image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=900&q=80',
            status: 'PUBLISHED',
            authorId: publisher.id,
            publishedAt: new Date(Date.now() - 3600000 * 7)
        },
        {
            title: 'Open-Source Agent Framework Enables Autonomous Data Pipeline Orchestration',
            slug: 'open-source-agent-autonomous-data-pipeline-89ef2',
            summary: 'Developers report significant reduction in pipeline maintenance with self-healing AI agents.',
            body: 'A new Apache-licensed agent framework autonomously detects schema drift, synthesizes transformation scripts, and recovers broken ETL pipelines without manual engineering intervention.',
            category: 'AI',
            domain: 'AI Tools & Agents',
            image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=900&q=80',
            status: 'PUBLISHED',
            authorId: publisher.id,
            publishedAt: new Date(Date.now() - 3600000 * 1)
        },
        {
            title: 'Frontier AI Labs Commit to Standardized Incident Reporting Guidelines',
            slug: 'frontier-ai-labs-standardized-incident-reporting-33df1',
            summary: 'Consortium of leading model builders aligns on automated red-teaming disclosures and safety evaluations.',
            body: 'Leading AI research institutions have agreed upon a shared protocol for reporting safety anomalies, jailbreak patterns, and biosecurity guardrail bypasses directly to independent auditing consortiums.',
            category: 'AI',
            domain: 'AI Policy',
            image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=900&q=80',
            status: 'PUBLISHED',
            authorId: publisher.id,
            publishedAt: new Date(Date.now() - 3600000 * 3)
        },
        {
            title: 'Global M&A Activity in Enterprise Cloud Rebounds as Valuations Settle',
            slug: 'global-ma-cloud-rebounds-valuations-45a2c',
            summary: 'Private equity and strategic acquirers accelerate deals following stabilizing interest rate forecasts.',
            body: 'Corporate deals across cloud data security and vertical software surged 28% quarter-over-quarter as valuation multiples aligned with long-term macroeconomic models.',
            category: 'Business',
            domain: 'Mergers, Acquisitions & Deals',
            image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80',
            status: 'PUBLISHED',
            authorId: publisher.id,
            publishedAt: new Date(Date.now() - 3600000 * 8)
        },
        {
            title: 'Fortune 100 CFOs Reprioritize Discretionary Spend Toward Digital Efficiency Programs',
            slug: 'fortune-100-cfos-digital-efficiency-reprioritization-19bb2',
            summary: 'Executive earnings calls indicate corporate finance leaders demand proven operational returns on software renewals.',
            body: 'Financial leadership teams across multinational enterprises are enforcing stringent ROI hurdles before approving software expansions, favoring unified platform offerings over point solution sprawl.',
            category: 'Business',
            domain: 'Corporate Finance & Earnings',
            image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80',
            status: 'PUBLISHED',
            authorId: publisher.id,
            publishedAt: new Date(Date.now() - 3600000 * 10)
        }
    ];
    for (const art of publishedArticles) {
        await prisma.article.create({ data: art });
    }
    // 3. Create Pending Submissions for Admin Review Panel
    const pendingArticles = [
        {
            title: 'Evaluating Agentic AI Vendors: A Buyer’s Security Checklist',
            slug: 'evaluating-agentic-ai-vendors-checklist-98cb1',
            summary: 'A deep-dive checklist for enterprise security teams evaluating third-party autonomous AI agents.',
            body: 'As autonomous AI agents receive expanded permissions to access databases and execute shell scripts, CISOs must demand clear containment boundaries and audit logging from enterprise AI providers.',
            category: 'AI',
            domain: 'AI Policy',
            image: 'https://images.unsplash.com/photo-1591453089816-0fbb971b454c?auto=format&fit=crop&w=900&q=80',
            status: 'PENDING',
            authorId: publisher.id
        },
        {
            title: 'Zero Trust Implementation Guide for Regional Financial Institutions',
            slug: 'zero-trust-guide-financial-institutions-17b2f',
            summary: 'Practical roadmap for community banks and regional lenders migrating legacy perimeter systems.',
            body: 'Migrating legacy banking cores to zero-trust architecture requires a staged identity-first approach. We outline the phases and common pitfalls observed across ten community banking implementations.',
            category: 'Cyber Security',
            domain: 'Threat Insights',
            image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=900&q=80',
            status: 'PENDING',
            authorId: publisher.id
        },
        {
            title: 'What the Latest Quarterly Earnings Tell Us About 2027 IT Infrastructure Budgets',
            slug: 'latest-earnings-it-budgets-2027-44bc9',
            summary: 'Analysis of corporate CAPEX commentary highlights sustained prioritization of computational hardware.',
            body: 'Despite cost containment across discretionary marketing budgets, capital expenditures dedicated to high-bandwidth memory and custom silicon remain at record heights.',
            category: 'Business',
            domain: 'Corporate Finance & Earnings',
            image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80',
            status: 'PENDING',
            authorId: publisher.id
        }
    ];
    for (const art of pendingArticles) {
        await prisma.article.create({ data: art });
    }
    // 4. Sample Comments & Saved Articles
    const firstArticle = await prisma.article.findFirst({ where: { status: 'PUBLISHED' } });
    if (firstArticle) {
        await prisma.comment.create({
            data: {
                content: 'Crucial perspective on enterprise Copilot scaling. We observed similar compliance hurdles during our Q2 rollout.',
                articleId: firstArticle.id,
                userId: user.id
            }
        });
        await prisma.savedArticle.create({
            data: {
                userId: user.id,
                articleId: firstArticle.id
            }
        });
    }
    // 5. Follow publisher
    await prisma.authorFollow.create({
        data: {
            followerId: user.id,
            authorId: publisher.id
        }
    });
    console.log('✅ Seed completed successfully with Root Admin, multi-category articles, pending reviews, and comments.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
