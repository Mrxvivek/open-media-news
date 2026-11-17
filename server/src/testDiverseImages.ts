const BASE_URL = 'http://127.0.0.1:3001/api';

async function runTests() {
  console.log('🧪 Starting Image Diversity and Rotation Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Fetch top 50 articles from the API
    console.log('Test 1: Global Feed Image Diversity (50 articles)');
    const res = await fetch(`${BASE_URL}/articles?limit=50`);
    assert(res.status === 200, 'HTTP 200 from /articles');
    const data: any = await res.json();
    const articles = data.articles || [];
    assert(articles.length >= 20, `Returned ${articles.length} articles`);

    // Verify unique images
    const images = articles.map((a: any) => a.image).filter(Boolean);
    const uniqueImages = new Set(images);
    console.log(`    Total articles: ${articles.length}, Unique images: ${uniqueImages.size}`);
    assert(uniqueImages.size >= 10, `At least 10 unique images among top articles (found ${uniqueImages.size})`);

    // Check no single image dominates > 35% of the feed
    const counts: Record<string, number> = {};
    for (const img of images) {
      counts[img] = (counts[img] || 0) + 1;
    }
    const maxFreq = Math.max(...Object.values(counts));
    const maxPercent = (maxFreq / images.length) * 100;
    console.log(`    Highest single image occurrence: ${maxFreq} (${maxPercent.toFixed(1)}%)`);
    assert(maxPercent < 35, `No single image dominates more than 35% of feed (was ${maxPercent.toFixed(1)}%)`);

    // 2. Category Feed Image Diversity: IT
    console.log('\nTest 2: Category Feed Diversity - IT');
    const itRes = await fetch(`${BASE_URL}/articles?category=IT&limit=20`);
    const itData: any = await itRes.json();
    const itImages = (itData.articles || []).map((a: any) => a.image);
    const itUnique = new Set(itImages);
    console.log(`    IT Articles: ${itImages.length}, Unique images: ${itUnique.size}`);
    assert(itUnique.size >= 5, `At least 5 unique images in IT category (found ${itUnique.size})`);

    // 3. Category Feed Image Diversity: Business
    console.log('\nTest 3: Category Feed Diversity - Business');
    const bRes = await fetch(`${BASE_URL}/articles?category=Business&limit=20`);
    const bData: any = await bRes.json();
    const bImages = (bData.articles || []).map((a: any) => a.image);
    const bUnique = new Set(bImages);
    console.log(`    Business Articles: ${bImages.length}, Unique images: ${bUnique.size}`);
    assert(bUnique.size >= 5, `At least 5 unique images in Business category (found ${bUnique.size})`);

    // 4. Category Feed Image Diversity: Cyber Security
    console.log('\nTest 4: Category Feed Diversity - Cyber Security');
    const csRes = await fetch(`${BASE_URL}/articles?category=Cyber%20Security&limit=20`);
    const csData: any = await csRes.json();
    const csImages = (csData.articles || []).map((a: any) => a.image);
    const csUnique = new Set(csImages);
    console.log(`    Cyber Security Articles: ${csImages.length}, Unique images: ${csUnique.size}`);
    assert(csUnique.size >= 5, `At least 5 unique images in Cyber Security category (found ${csUnique.size})`);

    // 5. Category Feed Image Diversity: AI
    console.log('\nTest 5: Category Feed Diversity - AI');
    const aiRes = await fetch(`${BASE_URL}/articles?category=AI&limit=20`);
    const aiData: any = await aiRes.json();
    const aiImages = (aiData.articles || []).map((a: any) => a.image);
    const aiUnique = new Set(aiImages);
    console.log(`    AI Articles: ${aiImages.length}, Unique images: ${aiUnique.size}`);
    assert(aiUnique.size >= 5, `At least 5 unique images in AI category (found ${aiUnique.size})`);

    // 6. Adjacent items image distinction
    console.log('\nTest 6: Consecutive Articles Image Variation');
    let consecutiveDuplicateCount = 0;
    for (let i = 0; i < articles.length - 1; i++) {
      if (articles[i].image === articles[i + 1].image) {
        consecutiveDuplicateCount++;
      }
    }
    console.log(`    Consecutive duplicate images: ${consecutiveDuplicateCount} out of ${articles.length - 1} pairs`);
    assert(consecutiveDuplicateCount <= 6, `Minimal consecutive duplicate images (count: ${consecutiveDuplicateCount})`);

    console.log(`\n========================================`);
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Test suite error:', err.message);
    process.exit(1);
  }
}

runTests();
