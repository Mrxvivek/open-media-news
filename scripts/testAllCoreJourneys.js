import assert from 'assert';

const BASE_URL = 'http://localhost:3001/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runCoreJourneysTests() {
  console.log('🚀 Starting Comprehensive Core Journeys Verification Suite...\n');
  let passed = 0;
  let failed = 0;

  function test(desc, fn) {
    try {
      fn();
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${desc}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  async function asyncTest(desc, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${desc}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  // 1. HEALTH CHECK
  await asyncTest('Health check endpoint is live and returns 200', async () => {
    const res = await request('/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, 'ok');
  });

  // 2. READER JOURNEY: REGISTRATION, PASSWORD REQUIREMENTS & EMAIL VERIFICATION
  const testUserEmail = `reader_${Date.now()}@openmedia.test`;
  let verificationToken = '';
  let authToken = '';

  await asyncTest('Registration rejects weak password (< 8 chars or missing complexity)', async () => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Weak User', email: `weak_${Date.now()}@test.com`, password: 'weak' })
    });
    assert.strictEqual(res.status, 400);
  });

  await asyncTest('Registration succeeds with compliant password (8+ chars, upper, lower, digit)', async () => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Alex Vance', email: testUserEmail, password: 'SecurePassword123!' })
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.requiresVerification, true);
    assert.ok(res.data.verificationToken, 'Verification token generated');
    verificationToken = res.data.verificationToken;
  });

  await asyncTest('Resend email verification token succeeds', async () => {
    const res = await request('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email: testUserEmail })
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.verificationToken);
    verificationToken = res.data.verificationToken;
  });

  await asyncTest('Email verification with 6-digit code activates reader account', async () => {
    const res = await request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email: testUserEmail, token: verificationToken })
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.user.emailVerified, true);
    assert.ok(res.data.token, 'JWT session token returned');
    authToken = res.data.token;
  });

  await asyncTest('Reader sign-in with verified credentials returns valid session', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testUserEmail, password: 'SecurePassword123!' })
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.token);
    assert.strictEqual(res.data.user.email, testUserEmail);
  });

  // 3. ACCOUNT RECOVERY (FORGOT & RESET PASSWORD)
  let resetToken = '';
  await asyncTest('Forgot password generates recovery token', async () => {
    const res = await request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: testUserEmail })
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.resetToken, 'Reset token generated');
    resetToken = res.data.resetToken;
  });

  await asyncTest('Reset password with recovery token updates password', async () => {
    const res = await request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email: testUserEmail,
        token: resetToken,
        newPassword: 'BrandNewPassword456!'
      })
    });
    assert.strictEqual(res.status, 200);

    // Verify login with new password
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testUserEmail, password: 'BrandNewPassword456!' })
    });
    assert.strictEqual(loginRes.status, 200);
  });

  // 4. BUSINESS INQUIRIES & PARTNERSHIPS JOURNEY
  let inquiryId = '';
  await asyncTest('Business inquiry submission records advertising partnership request', async () => {
    const res = await request('/inquiries', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Marcus Sterling',
        email: 'marcus@cloudenterprise.io',
        company: 'Cloud Enterprise Ltd',
        inquiryType: 'Sponsored Intelligence Brief',
        budget: '$15,000 - $25,000',
        message: 'Requesting quarterly sponsored analysis on hyperscaler cloud migrations.'
      })
    });
    assert.strictEqual(res.status, 201);
    assert.ok(res.data.inquiry.id);
    assert.strictEqual(res.data.inquiry.company, 'Cloud Enterprise Ltd');
    assert.strictEqual(res.data.inquiry.status, 'NEW');
    inquiryId = res.data.inquiry.id;
  });

  // Admin login to test protected routes
  let adminToken = '';
  await asyncTest('Admin authentication for enterprise audit & inquiry management', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@openmedia.test', password: 'AdminPass123!' })
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.user.role, 'ADMIN');
    adminToken = res.data.token;
  });

  await asyncTest('Admin can fetch inquiries list under 24h SLA', async () => {
    const res = await request('/inquiries', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data.inquiries));
    const found = res.data.inquiries.find(i => i.id === inquiryId);
    assert.ok(found, 'Created inquiry appears in admin inquiry feed');
  });

  await asyncTest('Admin can update inquiry status to CONTACTED', async () => {
    const res = await request(`/inquiries/${inquiryId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'CONTACTED' })
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.inquiry.status, 'CONTACTED');
  });

  // 5. AUDIT TRAIL
  await asyncTest('Admin can review enterprise tamper-evident audit logs', async () => {
    const res = await request('/admin/audit-logs', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data.auditLogs));
    assert.ok(res.data.auditLogs.length > 0, 'Audit logs recorded');
  });

  // 6. EDITORIAL QUALITY: 50-WORD STRAIGHT BRIEF & SOURCE ATTRIBUTION (IMAGE 2 FIX)
  await asyncTest('Articles provide clean Straight Brief (<= 50 words) and clean wire attribution', async () => {
    const res = await request('/articles?limit=20');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data.articles));

    for (const art of res.data.articles) {
      if (art.straightBrief) {
        const words = art.straightBrief.split(/\s+/).filter(Boolean);
        assert.ok(words.length <= 50, `Straight brief length ${words.length} exceeds 50 words for "${art.title}"`);
      }
      // Ensure raw markdown syndication does not leak into body
      if (art.body) {
        assert.ok(!art.body.includes('--- *Source: Originally syndicated via'), 'Raw markdown syndication footer must not be present in body');
      }
    }
  });

  // 7. IMAGE DEDUPLICATION (IMAGE 3 FIX)
  await asyncTest('Articles have diverse, non-monolithic image assignments', async () => {
    const res = await request('/articles?limit=50');
    assert.strictEqual(res.status, 200);
    const articles = res.data.articles;
    const images = articles.map(a => a.image).filter(Boolean);
    const uniqueImages = new Set(images);
    console.log(`     Total articles sampled: ${articles.length}, Unique images: ${uniqueImages.size}`);
    assert.ok(uniqueImages.size >= 10, 'Rich diversity of unique topic images');
  });

  // 8. COMMUNITY & DISCUSSIONS / POLLS
  await asyncTest('Discussions and polls endpoints are functional', async () => {
    const [discRes, pollRes] = await Promise.all([
      request('/discussions'),
      request('/polls')
    ]);
    assert.strictEqual(discRes.status, 200);
    assert.strictEqual(pollRes.status, 200);
    assert.ok(Array.isArray(discRes.data.discussions));
    assert.ok(Array.isArray(pollRes.data.polls));
  });

  console.log(`\n========================================`);
  console.log(`🏁 Verification Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runCoreJourneysTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
