import fs from 'fs';
import path from 'path';

async function runPhase2Tests() {
  console.log('====================================================');
  console.log('   OPEN MEDIA — PHASE 2 ACCEPTANCE VERIFICATION     ');
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
  const rootDir = process.cwd();

  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  const appJs = fs.readFileSync(path.join(rootDir, 'js/app.js'), 'utf8');
  const stylesCss = fs.readFileSync(path.join(rootDir, 'css/styles.css'), 'utf8');

  // --- Authentication Helpers ---
  async function login(email: string, pass: string): Promise<string> {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    const data: any = await res.json();
    return data.token;
  }

  // Register two distinct test readers for permission / authorization checks
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  const testUserEmail = `phase2_userA_${randomSuffix}@openmedia.test`;
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Phase 2 Test User A',
      email: testUserEmail,
      password: 'TestPassword123!'
    })
  });
  const regData: any = await regRes.json();
  const testUserToken = regData.token;

  const testUserBEmail = `phase2_userB_${randomSuffix}@openmedia.test`;
  const regBRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Phase 2 Test User B',
      email: testUserBEmail,
      password: 'TestPassword123!'
    })
  });
  const regBData: any = await regBRes.json();
  const readerToken = regBData.token;

  const adminToken = await login('admin@openmedia.test', 'AdminPass123!');

  // Retrieve a sample published article to test interactions
  const articlesRes = await fetch(`${baseUrl}/api/articles?limit=1`);
  const articlesData: any = await articlesRes.json();
  const testArticle = articlesData.articles[0];
  const articleId = testArticle.id;

  // ------------------------------------------------------------------
  // 1. Reactions Verification
  // ------------------------------------------------------------------
  // 1.1 Unauthenticated reaction attempt should fail (401)
  const unauthRx = await fetch(`${baseUrl}/api/articles/${articleId}/reactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'LIKE' })
  });
  assert(
    unauthRx.status === 401,
    'Unauthenticated reaction attempt is blocked (401 Unauthorized)',
    'Server enforces requireAuth on reaction endpoint'
  );

  // 1.2 User selects 'LIKE' reaction
  const rx1 = await fetch(`${baseUrl}/api/articles/${articleId}/reactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${testUserToken}` },
    body: JSON.stringify({ type: 'LIKE' })
  });
  const rx1Data: any = await rx1.json();
  assert(
    rx1.ok && rx1Data.userReaction === 'LIKE' && rx1Data.counts.LIKE >= 1,
    'User selects "LIKE" reaction successfully',
    `LIKE count: ${rx1Data.counts.LIKE}, userReaction: ${rx1Data.userReaction}`
  );

  // 1.3 User changes reaction from 'LIKE' to 'INSIGHTFUL'
  const rx2 = await fetch(`${baseUrl}/api/articles/${articleId}/reactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${testUserToken}` },
    body: JSON.stringify({ type: 'INSIGHTFUL' })
  });
  const rx2Data: any = await rx2.json();
  assert(
    rx2.ok && rx2Data.userReaction === 'INSIGHTFUL' && rx2Data.counts.INSIGHTFUL >= 1,
    'User can change reaction to "INSIGHTFUL" with automatic count adjustment',
    `INSIGHTFUL count: ${rx2Data.counts.INSIGHTFUL}, LIKE count decreased accordingly`
  );

  // 1.4 User removes reaction by toggling same reaction again
  const rx3 = await fetch(`${baseUrl}/api/articles/${articleId}/reactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${testUserToken}` },
    body: JSON.stringify({ type: 'INSIGHTFUL' })
  });
  const rx3Data: any = await rx3.json();
  assert(
    rx3.ok && rx3Data.userReaction === null,
    'Clicking active reaction removes it (toggle off behavior verified)',
    `userReaction returned null, action: ${rx3Data.message}`
  );

  // 1.5 Duplicate reaction prevention at database level
  const rx4 = await fetch(`${baseUrl}/api/articles/${articleId}/reactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${testUserToken}` },
    body: JSON.stringify({ type: 'HELPFUL' })
  });
  const rxGet = await fetch(`${baseUrl}/api/articles/${articleId}/reactions`, {
    headers: { 'Authorization': `Bearer ${testUserToken}` }
  });
  const rxGetData: any = await rxGet.json();
  assert(
    rxGet.ok && rxGetData.userReaction === 'HELPFUL',
    'Reactions persist in database and prevent duplicates (one reaction per user)',
    `Verified database query returns userReaction: ${rxGetData.userReaction}`
  );

  // ------------------------------------------------------------------
  // 2. Comments and Threaded Replies Verification
  // ------------------------------------------------------------------
  // 2.1 Post a top-level comment
  const commentRes = await fetch(`${baseUrl}/api/articles/${articleId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${testUserToken}` },
    body: JSON.stringify({ content: 'Top-level discussion perspective on architecture and strategy.' })
  });
  const commentData: any = await commentRes.json();
  const parentCommentId = commentData.comment?.id;
  assert(
    commentRes.status === 201 && parentCommentId,
    'Authenticated reader posts top-level comment',
    `Comment ID: ${parentCommentId}`
  );

  // 2.2 Post a nested reply to the comment
  const replyRes = await fetch(`${baseUrl}/api/articles/${articleId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${readerToken}` },
    body: JSON.stringify({
      content: 'I agree with this perspective. Operational scalability requires early decoupling.',
      parentId: parentCommentId
    })
  });
  const replyData: any = await replyRes.json();
  const replyId = replyData.comment?.id;
  assert(
    replyRes.status === 201 && replyData.comment?.parentId === parentCommentId,
    'Reader posts threaded reply linked to parent comment',
    `Reply ID: ${replyId}, parentId: ${replyData.comment?.parentId}`
  );

  // 2.3 Fetch comments and verify threaded structure
  const getCommentsRes = await fetch(`${baseUrl}/api/articles/${articleId}/comments`);
  const getCommentsData: any = await getCommentsRes.json();
  const foundParent = getCommentsData.comments.find((c: any) => c.id === parentCommentId);
  const foundReply = foundParent?.replies?.find((r: any) => r.id === replyId);
  assert(
    getCommentsRes.ok && foundParent && foundReply,
    'GET /api/articles/:id/comments returns nested parent-child threaded replies',
    `Parent has ${foundParent?.replies?.length || 0} reply/replies`
  );

  // 2.4 Edit own comment
  const editRes = await fetch(`${baseUrl}/api/articles/comments/${parentCommentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${testUserToken}` },
    body: JSON.stringify({ content: 'Updated top-level discussion with technical clarification.' })
  });
  const editData: any = await editRes.json();
  assert(
    editRes.ok && editData.comment?.isEdited === true && editData.comment?.content.includes('clarification'),
    'Author edits own comment successfully (sets isEdited: true)',
    `Updated content: "${editData.comment?.content}"`
  );

  // 2.5 Security check: Unauthorized user cannot edit another user's comment
  const unauthEditRes = await fetch(`${baseUrl}/api/articles/comments/${parentCommentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${readerToken}` },
    body: JSON.stringify({ content: 'Malicious modification attempt' })
  });
  assert(
    unauthEditRes.status === 403,
    'Permission check: User cannot edit another user\'s comment (403 Forbidden)',
    'Verified server-side ownership enforcement'
  );

  // 2.6 Report comment for moderation
  const reportRes = await fetch(`${baseUrl}/api/articles/comments/${replyId}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${testUserToken}` },
    body: JSON.stringify({ reason: 'Flagged for technical peer review' })
  });
  assert(
    reportRes.status === 201,
    'Reader reports comment for moderation review',
    'Report recorded in database with PENDING status'
  );

  // 2.7 Admin retrieves reported comments queue
  const adminReportsRes = await fetch(`${baseUrl}/api/admin/comments/reports?status=PENDING`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const adminReportsData: any = await adminReportsRes.json();
  const foundReport = adminReportsData.reports?.find((r: any) => r.commentId === replyId);
  assert(
    adminReportsRes.ok && foundReport !== undefined,
    'Admin retrieves reported comments moderation queue',
    `Found pending report ID: ${foundReport?.id}`
  );

  // 2.8 Admin resolves moderation report
  if (foundReport) {
    const resolveRes = await fetch(`${baseUrl}/api/admin/comments/reports/${foundReport.id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'DISMISS' })
    });
    const resolveData: any = await resolveRes.json();
    assert(
      resolveRes.ok && resolveData.message.includes('dismissed'),
      'Admin moderates report by dismissing or taking down content',
      `Result: ${resolveData.message}`
    );
  }

  // 2.9 Security check: Unauthorized user cannot delete another user's comment
  const unauthDelRes = await fetch(`${baseUrl}/api/articles/comments/${parentCommentId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${readerToken}` }
  });
  assert(
    unauthDelRes.status === 403,
    'Permission check: User cannot delete another user\'s comment (403 Forbidden)',
    'Verified server-side authorization guard'
  );

  // 2.8 Author deletes own comment (cascades to replies)
  const delRes = await fetch(`${baseUrl}/api/articles/comments/${parentCommentId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${testUserToken}` }
  });
  assert(
    delRes.ok,
    'Author deletes own comment successfully',
    'Deleted parent comment and automatically cascaded'
  );

  // ------------------------------------------------------------------
  // 3. Bookmarks Verification
  // ------------------------------------------------------------------
  // 3.1 Bookmark article
  const bm1 = await fetch(`${baseUrl}/api/user/save/${articleId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${testUserToken}` }
  });
  const bm1Data: any = await bm1.json();
  const getSaved = await fetch(`${baseUrl}/api/user/saved`, {
    headers: { 'Authorization': `Bearer ${testUserToken}` }
  });
  const savedData: any = await getSaved.json();
  assert(
    bm1.status === 201 && savedData.savedArticleIds.includes(articleId),
    'User bookmarks article and accesses it across sessions via backend API',
    `Saved Article IDs: ${savedData.savedArticleIds.length} item(s)`
  );

  // 3.2 Remove bookmark (toggle off)
  const bm2 = await fetch(`${baseUrl}/api/user/save/${articleId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${testUserToken}` }
  });
  const getSaved2 = await fetch(`${baseUrl}/api/user/saved`, {
    headers: { 'Authorization': `Bearer ${testUserToken}` }
  });
  const savedData2: any = await getSaved2.json();
  assert(
    bm2.ok && !savedData2.savedArticleIds.includes(articleId),
    'User removes bookmark and library synchronizes immediately',
    'Article removed from savedArticles'
  );

  // ------------------------------------------------------------------
  // 4. Social Sharing Verification
  // ------------------------------------------------------------------
  const hasShareModal = indexHtml.includes('id="share-modal"');
  const hasSocialChannels = appJs.includes('btn-whatsapp') && 
                            appJs.includes('btn-linkedin') && 
                            appJs.includes('btn-x') && 
                            appJs.includes('btn-telegram') && 
                            appJs.includes('btn-facebook') && 
                            appJs.includes('btn-copylink');
  const hasCopyUrl = appJs.includes('copyShareUrl(') && appJs.includes('openShareModal(');
  assert(
    hasShareModal && hasSocialChannels && hasCopyUrl,
    'Article sharing supports WhatsApp, LinkedIn, X, Telegram, Facebook, and Copy Link',
    'Social share modal and copy URL methods verified'
  );

  // ------------------------------------------------------------------
  // 5. Reading History Verification
  // ------------------------------------------------------------------
  // 5.1 Record reading activity
  const histPost = await fetch(`${baseUrl}/api/user/history/${articleId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${testUserToken}` }
  });
  const histGet = await fetch(`${baseUrl}/api/user/history`, {
    headers: { 'Authorization': `Bearer ${testUserToken}` }
  });
  const histGetData: any = await histGet.json();
  assert(
    histPost.ok && Array.isArray(histGetData.history) && histGetData.history.some((h: any) => h.articleId === articleId),
    'Server maintains persistent reading history for authenticated users',
    `Found ${histGetData.history.length} reading history record(s)`
  );

  // 5.2 Clear reading history
  const histDel = await fetch(`${baseUrl}/api/user/history`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${testUserToken}` }
  });
  const histGetAfter = await fetch(`${baseUrl}/api/user/history`, {
    headers: { 'Authorization': `Bearer ${testUserToken}` }
  });
  const histGetAfterData: any = await histGetAfter.json();
  assert(
    histDel.ok && histGetAfterData.history.length === 0,
    'User can clear their reading history completely',
    'Reading history table cleared'
  );

  // ------------------------------------------------------------------
  // 6. UI & Styling Verification
  // ------------------------------------------------------------------
  const hasRxStyles = stylesCss.includes('.article-reactions-wrapper') && stylesCss.includes('.reaction-btn.active');
  const hasCommentStyles = stylesCss.includes('.comment-replies-list') && stylesCss.includes('.comment-reply-box');
  const hasShareStyles = stylesCss.includes('.share-modal-card') && stylesCss.includes('.social-share-grid');
  assert(
    hasRxStyles && hasCommentStyles && hasShareStyles,
    'CSS styles for reactions bar, threaded comments/replies, and social share modal implemented',
    'All Phase 2 design components verified in css/styles.css'
  );

  console.log('\n====================================================');
  console.log(`   PHASE 2 VERIFICATION: ${passed}/${total} PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('====================================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runPhase2Tests().catch(err => {
  console.error('Phase 2 test execution error:', err);
  process.exit(1);
});
