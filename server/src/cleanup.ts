import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  isEnglishText,
  classifyNews,
  ApprovedCategory
} from './services/newsClassifier.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../prisma/dev.db').replace(/\\/g, '/');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL?.startsWith('file:/')
        ? process.env.DATABASE_URL
        : `file:${dbPath}`
    }
  }
});

async function runCleanup() {
  console.log('--- Starting Safe News Cleanup & English Language Optimization ---');
  const allArticles = await prisma.article.findMany({
    orderBy: { publishedAt: 'desc' }
  });

  console.log(`Total database articles: ${allArticles.length}`);

  let archivedTeluguCount = 0;
  let archivedUnrelatedCount = 0;
  let approvedCount = 0;

  const categoryCounts: Record<ApprovedCategory, number> = {
    'Business': 0,
    'IT': 0,
    'Cyber Security': 0,
    'AI': 0
  };

  const toArchiveIds: string[] = [];
  const toUpdateCategory: Array<{ id: string; category: ApprovedCategory }> = [];

  for (let i = 0; i < allArticles.length; i++) {
    const article = allArticles[i];
    const title = article.title || '';
    const summary = article.summary || '';

    // 0. Legacy regional feeds check (disabled regional feeds)
    if (['Eenadu', 'Sakshi', 'BBC Telugu', 'Telugu News'].includes(article.domain || '')) {
      toArchiveIds.push(article.id);
      archivedTeluguCount++;
      continue;
    }

    // 1. Language Check: If non-English (Telugu/etc.)
    if (!isEnglishText(title) || !isEnglishText(summary)) {
      toArchiveIds.push(article.id);
      archivedTeluguCount++;
      continue;
    }

    // 2. Category & Exclusion Classification
    const classification = classifyNews(title, summary, article.category);

    if (!classification.approved || !classification.category) {
      toArchiveIds.push(article.id);
      archivedUnrelatedCount++;
      continue;
    }

    // 3. Approved Article
    const finalCategory = classification.category;
    categoryCounts[finalCategory]++;
    approvedCount++;

    if (article.category !== finalCategory || article.status !== 'PUBLISHED') {
      toUpdateCategory.push({ id: article.id, category: finalCategory });
    }
  }

  console.log(`Batch updating ${toArchiveIds.length} articles to status: ARCHIVED...`);
  // Batch update archived articles
  const batchSize = 50;
  for (let i = 0; i < toArchiveIds.length; i += batchSize) {
    const batch = toArchiveIds.slice(i, i + batchSize);
    await prisma.article.updateMany({
      where: { id: { in: batch } },
      data: {
        status: 'ARCHIVED',
        editorialFeedback: 'Archived: Filtered out to maintain English-only 4 pillars focus'
      }
    });
  }

  console.log(`Updating ${toUpdateCategory.length} approved articles with exact pillar category & PUBLISHED status...`);
  for (const item of toUpdateCategory) {
    await prisma.article.update({
      where: { id: item.id },
      data: {
        category: item.category,
        status: 'PUBLISHED',
        editorialFeedback: null
      }
    });
  }

  console.log('\n--- Cleanup Summary ---');
  console.log(`Approved & Published Articles: ${approvedCount}`);
  console.log(`  - Business: ${categoryCounts['Business']}`);
  console.log(`  - IT & Technology: ${categoryCounts['IT']}`);
  console.log(`  - Cyber Security: ${categoryCounts['Cyber Security']}`);
  console.log(`  - AI: ${categoryCounts['AI']}`);
  console.log(`Safely Archived (Telugu / Non-English): ${archivedTeluguCount}`);
  console.log(`Safely Archived (Unrelated / Excluded): ${archivedUnrelatedCount}`);
  console.log('Cleanup completed successfully. Historical records preserved safely.');

  await prisma.$disconnect();
}

runCleanup().catch(err => {
  console.error('Cleanup error:', err);
  process.exit(1);
});
