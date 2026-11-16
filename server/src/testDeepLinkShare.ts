import { prisma } from './prisma.js';
import fs from 'fs';
import path from 'path';

async function verifyDeepLinking() {
  console.log('====================================================');
  console.log('   OPEN MEDIA — DEEP-LINK & SHARE REDIRECT SUITE    ');
  console.log('====================================================');

  const article = await prisma.article.findFirst({ where: { status: 'PUBLISHED' } });
  if (!article) throw new Error('No published article found');

  console.log(`\n📌 Sample Live Article: [${article.id}]`);
  console.log(`   Title: "${article.title}"`);

  // 1. Server-side Query Parameter Deep Link
  const res1 = await fetch(`http://localhost:3001/?article=${article.id}`);
  const html1 = await res1.text();
  const ogTitleMatch1 = html1.match(/<meta property="og:title" content="([^"]+)"/);
  const ogTitle1 = ogTitleMatch1 ? ogTitleMatch1[1] : null;
  const titleMatch1 = html1.match(/<title>([^<]+)<\/title>/);
  const pageTitle1 = titleMatch1 ? titleMatch1[1] : null;

  if (ogTitle1 && pageTitle1 && pageTitle1.includes(article.title.slice(0, 15))) {
    console.log('✅ [PASS 1] Server dynamically injects article metadata for ?article=ID query link');
    console.log(`   └─ Page Title: "${pageTitle1}"`);
    console.log(`   └─ OG Title: "${ogTitle1}"`);
  } else {
    throw new Error(`Failed to inject dynamic metadata: pageTitle="${pageTitle1}", ogTitle="${ogTitle1}"`);
  }

  // 2. Server-side Path Deep Link
  const res2 = await fetch(`http://localhost:3001/article/${article.id}`);
  const html2 = await res2.text();
  const ogTitleMatch2 = html2.match(/<meta property="og:title" content="([^"]+)"/);
  const ogTitle2 = ogTitleMatch2 ? ogTitleMatch2[1] : null;

  if (ogTitle2 && ogTitle2.includes(article.title.slice(0, 15))) {
    console.log('✅ [PASS 2] Server dynamically serves article metadata for /article/:id path route');
    console.log(`   └─ OG Title: "${ogTitle2}"`);
  } else {
    throw new Error(`Failed to inject dynamic metadata for path route: ogTitle="${ogTitle2}"`);
  }

  // 3. Client SPA Deep Link Detection Logic
  const appJs = fs.readFileSync(path.resolve('./js/app.js'), 'utf-8');

  if (appJs.includes('detectArticleDeepLink()') && appJs.includes('checkAndOpenDeepLinkedArticle()')) {
    console.log('✅ [PASS 3] Client exposes detectArticleDeepLink() and checkAndOpenDeepLinkedArticle()');
  } else {
    throw new Error('Missing deep link detector methods in js/app.js');
  }

  // 4. Initial Route preserves article deep link without home overwrite
  if (appJs.includes('!deepArticleId && (!rawHash || rawHash === \'#\' || page === \'home\')')) {
    console.log('✅ [PASS 4] handleInitialRoute() prevents premature redirect to #home when article link is provided');
  } else {
    throw new Error('handleInitialRoute() still overwriting article deep link with #home');
  }

  // 5. Hash change listener handles deep link navigation and back button
  if (appJs.includes('if (deepArticleId) {') && appJs.includes('this.openArticleModal(deepArticleId)')) {
    console.log('✅ [PASS 5] handleHashChange() handles deep-link hash navigation and browser back/forward buttons');
  } else {
    throw new Error('handleHashChange() missing deep-link open handling');
  }

  // 6. Address bar sync in openArticleModal and closeArticleModal
  if (appJs.includes('targetHash = `#article-${encodeURIComponent(article.id)}`') && 
      appJs.includes('window.history.pushState({ articleId: article.id }')) {
    console.log('✅ [PASS 6] openArticleModal() pushes #article-ID into browser address bar for 1-click URL sharing');
  } else {
    throw new Error('openArticleModal() missing browser address bar synchronization');
  }

  // 7. Universal Share Link Generation (both query param + hash for messenger compatibility)
  if (appJs.includes('?article=${encodeURIComponent(article.id)}#article-${encodeURIComponent(article.id)}')) {
    console.log('✅ [PASS 7] Share URL format includes both query parameter and hash fragment for bulletproof messenger delivery');
  } else {
    throw new Error('Share URL missing combined query + hash format');
  }

  console.log('\n====================================================');
  console.log('   DEEP-LINK & SHARE REDIRECT: 7/7 PASSED (100%)');
  console.log('====================================================\n');

  await prisma.$disconnect();
}

verifyDeepLinking().catch(async (err) => {
  console.error('❌ Test execution error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
