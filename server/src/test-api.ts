import { prisma } from './prisma.js';

// Prevent the imported Express module from binding its production listener.
process.env.NODE_ENV = 'test';
const { default: app } = await import('./index.js');

let server: any;
const PORT = 4001;
const BASE_URL = `http://localhost:${PORT}/api`;

async function request(path: string, options: RequestInit = {}): Promise<{ status: number; data: any }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function cleanupGeneratedTestArticles() {
  await prisma.comment.deleteMany({
    where: {
      content: { contains: 'Remarkable research findings' }
    }
  });
  await prisma.article.deleteMany({
    where: {
      OR: [
        { title: { contains: 'Breakthrough in Quantum Key Distribution' } },
        { title: { contains: 'Updated: Quantum Key Distribution Milestone Achieved' } },
        { title: { contains: 'Evaluating Agentic AI Vendors' } },
        { title: { contains: 'Zero Trust Implementation Guide for Regional Financial Institutions' } },
        { title: { contains: 'What the Latest Quarterly Earnings' } }
      ]
    }
  });
  await prisma.user.deleteMany({
    where: {
      OR: [
        { email: { startsWith: 'testuser_' } },
        { email: { startsWith: 'newpub_' } },
        { email: { startsWith: 'secadmin_' } },
        { email: 'hacked@openmedia.test' },
        { email: 'unauth@openmedia.test' }
      ]
    }
  });
}

async function runTests() {
  console.log('🧪 Running Modular RBAC & Production Upgrade API Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, errorDetail?: any) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`, errorDetail ? errorDetail : '');
      failed++;
    }
  }

  try {
    await cleanupGeneratedTestArticles();

    // Start temporary test server
    server = app.listen(PORT);
    await new Promise(resolve => setTimeout(resolve, 600));

    // 1. Health check
    const health = await request('/health');
    assert(health.status === 200 && health.data.status === 'ok', 'Health Check endpoint is live');

    // 2. Public Registration Security: Attempting to register as ADMIN must be forced to USER
    const testRegEmail = `testuser_${Date.now()}@openmedia.test`;
    const regAttempt = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Registration Security Test',
        email: testRegEmail,
        password: 'password123',
        role: 'ADMIN' // Trying to sneak in an ADMIN role
      })
    });
    assert(
      regAttempt.status === 201 && regAttempt.data.user.role === 'USER' && regAttempt.data.user.isRootAdmin === false,
      'Public Registration: Role is strictly forced to USER and isRootAdmin: false'
    );

    // 3. Zod Input Validation: Invalid email and short password rejected with 400
    const invalidReg = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Bad Input',
        email: 'not-an-email',
        password: '123' // < 6 chars
      })
    });
    assert(invalidReg.status === 400 && String(invalidReg.data.error).includes('Validation failed'), 'Zod Validation: Rejects invalid email and short password (400 Bad Request)');

    // 4. Strict Single Root Admin Limit: Verify only 1 root admin exists in the database
    const rootAdminCount = await prisma.user.count({
      where: { isRootAdmin: true }
    });
    assert(rootAdminCount === 1, 'Database Enforcement: Exactly 1 primary Root Admin exists in database');

    // 5. Auth Login for seeded Reader account
    const userLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@openmedia.test', password: 'UserPass123!' })
    });
    assert(userLogin.status === 200 && !!userLogin.data.token, 'Reader login returns JWT token');
    const userToken = userLogin.data.token;
    const userId = userLogin.data.user.id;

    // 6. Auth Login for seeded Publisher account
    const pubLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'publisher@openmedia.test', password: 'PublisherPass123!' })
    });
    assert(pubLogin.status === 200 && pubLogin.data.user.role === 'PUBLISHER', 'Publisher login authenticates with PUBLISHER role');
    const publisherToken = pubLogin.data.token;
    const publisherId = pubLogin.data.user.id;

    // 7. Auth Login for seeded Admin account
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@openmedia.test', password: 'AdminPass123!' })
    });
    assert(
      adminLogin.status === 200 &&
      adminLogin.data.user.role === 'ADMIN' &&
      adminLogin.data.user.isRootAdmin === true,
      'Root Admin login authenticates with ADMIN role and isRootAdmin: true'
    );
    const rootAdminToken = adminLogin.data.token;

    // 8. RBAC Check: Normal USER cannot access admin endpoints
    const userAdminAttempt = await request('/admin/submissions', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(userAdminAttempt.status === 403, 'RBAC: Normal USER cannot access admin routes (403 Forbidden)');

    // 9. Admin lists all platform users: GET /api/admin/users
    const usersListRes = await request('/admin/users', {
      headers: { Authorization: `Bearer ${rootAdminToken}` }
    });
    assert(usersListRes.status === 200 && Array.isArray(usersListRes.data.users), 'Admin can list platform users with role counts');

    // 10. RBAC Check: Normal USER cannot create users via /api/admin/users/create
    const userCreateAttempt = await request('/admin/users/create', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        name: 'Hacked Admin',
        email: 'hacked@openmedia.test',
        role: 'ADMIN'
      })
    });
    assert(userCreateAttempt.status === 403, 'RBAC: Normal USER cannot create accounts via /api/admin/users/create (403 Forbidden)');

    // 11. Root Admin creates a new PUBLISHER with auto-generated secure credentials
    const newPubEmail = `newpub_${Date.now()}@openmedia.test`;
    const createPubRes = await request('/admin/users/create', {
      method: 'POST',
      headers: { Authorization: `Bearer ${rootAdminToken}` },
      body: JSON.stringify({
        name: 'Publisher Account Test',
        email: newPubEmail,
        role: 'PUBLISHER'
        // password omitted: tests automated secure random password generation
      })
    });
    assert(
      createPubRes.status === 201 &&
      createPubRes.data.user.role === 'PUBLISHER' &&
      createPubRes.data.user.isRootAdmin === false &&
      !!createPubRes.data.credentials.password,
      'Root Admin creates PUBLISHER account with auto-generated random credentials'
    );
    const generatedPubPassword = createPubRes.data.credentials.password;

    // 12. Root Admin creates a Secondary ADMIN account
    const secondaryAdminEmail = `secadmin_${Date.now()}@openmedia.test`;
    const createSecAdminRes = await request('/admin/users/create', {
      method: 'POST',
      headers: { Authorization: `Bearer ${rootAdminToken}` },
      body: JSON.stringify({
        name: 'Secondary Admin Ops',
        email: secondaryAdminEmail,
        role: 'ADMIN',
        password: 'SecurePassword2026!'
      })
    });
    assert(
      createSecAdminRes.status === 201 &&
      createSecAdminRes.data.user.role === 'ADMIN' &&
      createSecAdminRes.data.user.isRootAdmin === false,
      'Root Admin creates Secondary ADMIN with isRootAdmin: false'
    );

    // 13. Test logging in with newly generated credentials
    const newPubLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: newPubEmail, password: generatedPubPassword })
    });
    assert(newPubLogin.status === 200 && newPubLogin.data.user.role === 'PUBLISHER', 'New account logs in successfully with generated credentials');

    // 14. Secondary Admin login and RBAC check: Secondary Admin CANNOT create admin/publisher accounts
    const secAdminLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: secondaryAdminEmail, password: 'SecurePassword2026!' })
    });
    const secondaryAdminToken = secAdminLogin.data.token;
    assert(secAdminLogin.status === 200 && secAdminLogin.data.user.isRootAdmin === false, 'Secondary Admin logs in with isRootAdmin: false');

    const secAdminCreateAttempt = await request('/admin/users/create', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secondaryAdminToken}` },
      body: JSON.stringify({
        name: 'Unauthorized User',
        email: 'unauth@openmedia.test',
        role: 'PUBLISHER'
      })
    });
    assert(
      secAdminCreateAttempt.status === 403,
      'RBAC: Secondary ADMIN cannot create accounts (403: requires Root Admin)'
    );

    // 15. Public feed - only PUBLISHED articles
    const publicArticles = await request('/articles');
    assert(publicArticles.status === 200 && Array.isArray(publicArticles.data.articles), 'GET /api/articles returns public feed');
    const allPublished = publicArticles.data.articles.every((a: any) => a.status === 'PUBLISHED');
    assert(allPublished, 'Public feed only includes status: PUBLISHED articles');
    const sampleArticleId = publicArticles.data.articles[0]?.id;

    // 15b. AI Summarizer: POST /api/articles/summarize
    const summarizeRes = await request('/articles/summarize', {
      method: 'POST',
      body: JSON.stringify({ question: 'Summarize the latest news' })
    });
    assert(
      summarizeRes.status === 200 &&
      summarizeRes.data.success === true &&
      typeof summarizeRes.data.summary === 'string' &&
      summarizeRes.data.summary.length > 0,
      'AI Summarizer: POST /api/articles/summarize returns executive synthesis'
    );

    // 16. Publisher creates new article
    const pubArticle = await request('/articles', {
      method: 'POST',
      headers: { Authorization: `Bearer ${publisherToken}` },
      body: JSON.stringify({
        title: 'Breakthrough in Quantum Key Distribution for Fiber Networks',
        summary: 'Researchers demonstrate 100km quantum key transmission over active commercial fiber links.',
        body: 'A consortium of telecommunications labs has demonstrated sustained quantum key distribution across 100km of existing fiber optic network lines.',
        category: 'Cyber Security',
        domain: 'Threat Insights'
      })
    });
    assert(pubArticle.status === 201 && pubArticle.data.article.status === 'PENDING', 'Publisher submits post with PENDING review status');
    const newArticleId = pubArticle.data.article.id;

    // 17. Admin edits full article content: PATCH /api/admin/articles/:id
    const editRes = await request(`/admin/articles/${newArticleId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${rootAdminToken}` },
      body: JSON.stringify({
        title: 'Updated: Quantum Key Distribution Milestone Achieved',
        summary: 'Comprehensive analysis of 100km fiber optic quantum key transmission test results.'
      })
    });
    assert(
      editRes.status === 200 &&
      editRes.data.article.title === 'Updated: Quantum Key Distribution Milestone Achieved',
      'Admin full content rights: Successfully edited article title and summary'
    );

    // 18. Batch Status Update: POST /api/admin/articles/batch-status
    const batchRes = await request('/admin/articles/batch-status', {
      method: 'POST',
      headers: { Authorization: `Bearer ${rootAdminToken}` },
      body: JSON.stringify({
        articleIds: [newArticleId],
        status: 'PUBLISHED'
      })
    });
    assert(batchRes.status === 200 && batchRes.data.count >= 1, 'Admin batch action: Successfully batch approved articles to PUBLISHED');

    // 19. Comments: User posts comment with Zod validation
    const commentRes = await request(`/articles/${sampleArticleId}/comments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ content: 'Remarkable research findings. Looking forward to real-world benchmarks!' })
    });
    assert(commentRes.status === 201 && !!commentRes.data.comment.id, 'User posts comment to article');

    // 20. Public/User views comments
    const getComments = await request(`/articles/${sampleArticleId}/comments`);
    assert(getComments.status === 200 && getComments.data.comments.length > 0, 'GET comments returns article comments with user details');

    // 21. User saves article to library
    const saveRes = await request(`/user/save/${sampleArticleId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(saveRes.status === 200 || saveRes.status === 201, 'User toggles saved article in library');

    const followRes = await request('/authors/trending');
    assert(followRes.status === 200 && Array.isArray(followRes.data.authors), 'GET /api/authors/trending returns platform author list');

    const followsRes = await request('/user/follows', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(followsRes.status === 200 && Array.isArray(followsRes.data.authors), 'Authenticated user can fetch followed authors');

    const changesRequestedRes = await request(`/admin/articles/${newArticleId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${rootAdminToken}` },
      body: JSON.stringify({
        status: 'CHANGES_REQUESTED',
        editorialFeedback: 'Please strengthen the sourcing and expand the second section.'
      })
    });
    assert(
      changesRequestedRes.status === 200 &&
      changesRequestedRes.data.article.status === 'CHANGES_REQUESTED' &&
      changesRequestedRes.data.article.editorialFeedback,
      'Admin can request changes with editorial feedback'
    );

    const resubmitRes = await request(`/articles/${newArticleId}/resubmit`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${publisherToken}` },
      body: JSON.stringify({
        title: 'Updated: Quantum Key Distribution Milestone Achieved',
        summary: 'Revised analysis with stronger sourcing and clearer implementation details.',
        body: 'A revised consortium analysis now includes stronger sourcing, a fuller technical explanation, and clearer implementation details for quantum key distribution across commercial fibre networks.',
        category: 'Cyber Security',
        domain: 'Threat Insights'
      })
    });
    assert(
      resubmitRes.status === 200 &&
      resubmitRes.data.article.status === 'PENDING' &&
      resubmitRes.data.article.editorialFeedback === null,
      'Publisher can resubmit a changes-requested article back into the review pipeline'
    );

    // 28. Base64 Image upload validation test
    const base64ArticleRes = await request('/articles', {
      method: 'POST',
      headers: { Authorization: `Bearer ${publisherToken}` },
      body: JSON.stringify({
        title: 'Local Base64 Image Test Article',
        summary: 'Testing that Base64 image Data URLs pass validation without schema errors.',
        body: 'This test article includes a 1x1 pixel Base64 data URL encoded PNG string to ensure local file uploads are fully accepted by the backend Zod validation pipeline.',
        category: 'IT',
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      })
    });
    assert(
      base64ArticleRes.status === 201 &&
      base64ArticleRes.data.article?.id,
      'Publisher submits post with local Base64 image Data URL successfully'
    );

    // 29. Root Admin deletes a non-root user
    const deleteUserRes = await request(`/admin/users/${createPubRes.data.user.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${rootAdminToken}` }
    });
    assert(
      deleteUserRes.status === 200 &&
      deleteUserRes.data.deletedUserId === createPubRes.data.user.id,
      'Root Admin can delete a non-root platform user via DELETE /api/admin/users/:id'
    );

    // 30. Prevent Root Admin from deleting self or other root admins
    const deleteSelfRes = await request(`/admin/users/${adminLogin.data.user.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${rootAdminToken}` }
    });
    assert(
      deleteSelfRes.status === 400 || deleteSelfRes.status === 403,
      'Security guard: Root Admin cannot delete their own active administrator account'
    );

    console.log(`\n========================================`);
    console.log(`🎯 Test Results: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test run failed with error:', err);
    process.exit(1);
  } finally {
    await cleanupGeneratedTestArticles();
    if (server) server.close();
    await prisma.$disconnect();
  }
}

runTests();
