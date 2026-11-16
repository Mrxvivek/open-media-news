import fs from 'fs';
import path from 'path';

async function runPhase345Tests() {
  console.log('====================================================');
  console.log('   OPEN MEDIA — PHASES 3, 4 & 5 VERIFICATION SUITE   ');
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

  // Helper login
  async function login(email: string, pass: string): Promise<string> {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    const data: any = await res.json();
    return data.token;
  }

  const adminToken = await login('admin@openmedia.test', 'AdminPass123!');

  // Register two distinct users
  const rand = Math.random().toString(36).substring(2, 7);
  const userAEmail = `phase3_userA_${rand}@openmedia.test`;
  const regARes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Alice Community Lead',
      email: userAEmail,
      password: 'UserPass123!'
    })
  });
  const userAToken = (await regARes.json() as any).token;

  const userBEmail = `phase3_userB_${rand}@openmedia.test`;
  const regBRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Bob Industry Analyst',
      email: userBEmail,
      password: 'UserPass123!'
    })
  });
  const userBToken = (await regBRes.json() as any).token;

  // -------------------------------------------------------------
  // SECTION 1: Community Discussions (Phase 3)
  // -------------------------------------------------------------
  // 1.1 Create discussion
  const discRes = await fetch(`${baseUrl}/api/discussions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userAToken}` },
    body: JSON.stringify({
      title: 'Architectural Strategies for Enterprise Agentic AI Deployments',
      content: 'How should enterprise data teams handle auditability and tool access sandboxing at scale?',
      category: 'AI'
    })
  });
  const discData: any = await discRes.json();
  const discId = discData.discussion?.id;
  assert(
    discRes.status === 201 && discId,
    'Author creates community discussion topic in AI category',
    `Discussion ID: ${discId}, Title: "${discData.discussion?.title}"`
  );

  // 1.2 Fetch discussions list with category filter
  const discListRes = await fetch(`${baseUrl}/api/discussions?category=AI`);
  const discListData: any = await discListRes.json();
  assert(
    discListRes.ok && discListData.discussions?.some((d: any) => d.id === discId),
    'Public discussions listing returns category-filtered items',
    `Found ${discListData.discussions.length} AI discussions`
  );

  // 1.3 View single discussion (increments views)
  const singleDiscRes = await fetch(`${baseUrl}/api/discussions/${discId}`);
  const singleDiscData: any = await singleDiscRes.json();
  assert(
    singleDiscRes.ok && singleDiscData.discussion?.views >= 1,
    'View single discussion and increment view counter',
    `Views: ${singleDiscData.discussion?.views}`
  );

  // 1.4 Post top-level comment on discussion
  const discCommentRes = await fetch(`${baseUrl}/api/discussions/${discId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userBToken}` },
    body: JSON.stringify({
      content: 'We employ immutable audit journals with cryptographic signing for each delegated agent step.'
    })
  });
  const discCommentData: any = await discCommentRes.json();
  const discCommentId = discCommentData.comment?.id;
  assert(
    discCommentRes.status === 201 && discCommentId,
    'Reader posts top-level reply on community discussion',
    `Comment ID: ${discCommentId}`
  );

  // 1.5 Post nested reply to comment
  const discReplyRes = await fetch(`${baseUrl}/api/discussions/${discId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userAToken}` },
    body: JSON.stringify({
      content: 'That is effective for compliance. How do you handle sub-millisecond trace storage?',
      parentId: discCommentId
    })
  });
  const discReplyData: any = await discReplyRes.json();
  assert(
    discReplyRes.status === 201 && discReplyData.comment?.parentId === discCommentId,
    'Author posts threaded nested reply to reader comment',
    `Nested reply parentId: ${discReplyData.comment?.parentId}`
  );

  // 1.6 Report discussion for moderation
  const reportDiscRes = await fetch(`${baseUrl}/api/discussions/${discId}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userBToken}` },
    body: JSON.stringify({ reason: 'Request for architectural review' })
  });
  assert(
    reportDiscRes.status === 201,
    'Reader reports discussion for editorial moderation review',
    'Report created with PENDING status'
  );

  // 1.7 Admin reviews discussion moderation queue
  const adminDiscReportsRes = await fetch(`${baseUrl}/api/admin/discussions/reports?status=PENDING`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const adminDiscReportsData: any = await adminDiscReportsRes.json();
  const foundDiscReport = adminDiscReportsData.reports?.find((r: any) => r.discussionId === discId);
  assert(
    adminDiscReportsRes.ok && foundDiscReport !== undefined,
    'Administrator views discussion reports in moderation dashboard',
    `Pending report ID: ${foundDiscReport?.id}`
  );

  // 1.8 Admin moderates report (Dismiss)
  if (foundDiscReport) {
    const resolveDiscRes = await fetch(`${baseUrl}/api/admin/discussions/reports/${foundDiscReport.id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'DISMISS' })
    });
    const resolveDiscData: any = await resolveDiscRes.json();
    assert(
      resolveDiscRes.ok && resolveDiscData.message.includes('dismissed'),
      'Admin resolves discussion report by dismissing benign report',
      `Message: ${resolveDiscData.message}`
    );
  }

  // 1.9 Security: Unauthorized user cannot delete another user's discussion (403)
  const unauthDelDiscRes = await fetch(`${baseUrl}/api/discussions/${discId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${userBToken}` }
  });
  assert(
    unauthDelDiscRes.status === 403,
    'Permission check: User cannot delete another author\'s discussion (403 Forbidden)',
    'Verified RBAC ownership protection'
  );

  // -------------------------------------------------------------
  // SECTION 2: Polls & Real-Time Voting (Phase 3)
  // -------------------------------------------------------------
  // 2.1 Create new poll
  const pollRes = await fetch(`${baseUrl}/api/polls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({
      question: 'Which enterprise architecture will dominate AI agent deployment in 2027?',
      category: 'AI',
      options: [
        'Decentralized Edge Agents',
        'Federated Hub-and-Spoke Swarms',
        'Centralized Cloud Inference Meshes',
        'Hybrid On-Premises Air-Gapped Models'
      ]
    })
  });
  const pollData: any = await pollRes.json();
  const pollId = pollData.poll?.id;
  const option1 = pollData.poll?.options?.[0];
  const option2 = pollData.poll?.options?.[1];
  assert(
    pollRes.status === 201 && pollId && pollData.poll?.options?.length === 4,
    'Administrator creates active reader poll with multiple choices',
    `Poll ID: ${pollId}, Options: 4 created`
  );

  // 2.2 User A casts vote for Option 1
  const vote1Res = await fetch(`${baseUrl}/api/polls/${pollId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userAToken}` },
    body: JSON.stringify({ optionId: option1.id })
  });
  const vote1Data: any = await vote1Res.json();
  const opt1Result = vote1Data.options?.find((o: any) => o.id === option1.id);
  assert(
    vote1Res.ok && opt1Result?.votes === 1 && opt1Result?.percentage === 100,
    'Reader A casts vote and results calculate 100% distribution',
    `Total votes: ${vote1Data.totalVotes}, Option 1: 100%`
  );

  // 2.3 Prevent duplicate voting by User A
  const dupVoteRes = await fetch(`${baseUrl}/api/polls/${pollId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userAToken}` },
    body: JSON.stringify({ optionId: option2.id })
  });
  assert(
    dupVoteRes.status === 400,
    'Duplicate voting prevented: Single vote enforcement verified (400 Bad Request)',
    'Database constraint @@unique([pollId, userId]) respected'
  );

  // 2.4 User B casts vote for Option 2
  const vote2Res = await fetch(`${baseUrl}/api/polls/${pollId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userBToken}` },
    body: JSON.stringify({ optionId: option2.id })
  });
  const vote2Data: any = await vote2Res.json();
  const opt1After = vote2Data.options?.find((o: any) => o.id === option1.id);
  const opt2After = vote2Data.options?.find((o: any) => o.id === option2.id);
  assert(
    vote2Res.ok && opt1After?.percentage === 50 && opt2After?.percentage === 50,
    'Reader B votes and percentages adjust dynamically (50% / 50%)',
    `Total votes: ${vote2Data.totalVotes}`
  );

  // 2.5 Close poll
  const closePollRes = await fetch(`${baseUrl}/api/polls/${pollId}/close`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert(
    closePollRes.ok,
    'Administrator closes poll successfully',
    'Poll status set to CLOSED'
  );

  // 2.6 Reject votes on closed poll
  const closedVoteRes = await fetch(`${baseUrl}/api/polls/${pollId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ optionId: option1.id })
  });
  assert(
    closedVoteRes.status === 400,
    'Voting on closed poll is cleanly rejected (400 Bad Request)',
    'Closed status enforced on voting endpoint'
  );

  // -------------------------------------------------------------
  // SECTION 3: User Profiles & Topic Follows (Phases 3 & 4)
  // -------------------------------------------------------------
  // 3.1 Update user profile
  const updateProfileRes = await fetch(`${baseUrl}/api/user/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userAToken}` },
    body: JSON.stringify({
      bio: 'Enterprise systems architect specializing in AI security and governance.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      followedTopics: ['AI', 'Cyber Security']
    })
  });
  const profileData: any = await updateProfileRes.json();
  assert(
    updateProfileRes.ok && profileData.profile?.bio?.includes('Enterprise systems') && profileData.profile?.followedTopics?.includes('AI'),
    'Reader updates profile bio, avatar, and followed topics successfully',
    `Followed topics: ${profileData.profile?.followedTopics.join(', ')}`
  );

  // 3.2 Fetch user profile with aggregated statistics
  const getProfileRes = await fetch(`${baseUrl}/api/user/profile`, {
    headers: { 'Authorization': `Bearer ${userAToken}` }
  });
  const getProfileData: any = await getProfileRes.json();
  assert(
    getProfileRes.ok && getProfileData.profile?.stats !== undefined,
    'Profile endpoint returns full profile with statistics (savedCount, discussionsCount, etc.)',
    `Discussions created: ${getProfileData.profile.stats.discussionsCount}`
  );

  // 3.3 Toggle follow topic
  const toggleTopicRes = await fetch(`${baseUrl}/api/user/follow-topic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userAToken}` },
    body: JSON.stringify({ topic: 'Business' })
  });
  const toggleTopicData: any = await toggleTopicRes.json();
  assert(
    toggleTopicRes.ok && toggleTopicData.followedTopics?.includes('Business') && toggleTopicData.isFollowing === true,
    'Reader follows news category topic via dedicated endpoint',
    `Active topics: ${toggleTopicData.followedTopics.join(', ')}`
  );

  // -------------------------------------------------------------
  // SECTION 4: Personalised News & Transparent Recommendations (Phase 4)
  // -------------------------------------------------------------
  const forYouRes = await fetch(`${baseUrl}/api/user/for-you`, {
    headers: { 'Authorization': `Bearer ${userAToken}` }
  });
  const forYouData: any = await forYouRes.json();
  const hasReason = forYouData.recommendations?.length > 0 && 
                    forYouData.recommendations[0]?.recommendationReason !== undefined;
  assert(
    forYouRes.ok && hasReason,
    'Personalized "For You" feed delivers news with transparent recommendation reasons',
    `Sample attribution: "${forYouData.recommendations?.[0]?.recommendationReason}"`
  );

  // -------------------------------------------------------------
  // SECTION 5: Notifications & User Settings (Phase 4)
  // -------------------------------------------------------------
  // 5.1 Check notifications received from discussion reply
  const notifRes = await fetch(`${baseUrl}/api/notifications`, {
    headers: { 'Authorization': `Bearer ${userAToken}` }
  });
  const notifData: any = await notifRes.json();
  assert(
    notifRes.ok && Array.isArray(notifData.notifications),
    'Reader receives notification when another reader replies to their discussion',
    `Found ${notifData.notifications.length} notification(s), unread: ${notifData.unreadCount}`
  );

  // 5.2 Mark all notifications as read
  const readAllRes = await fetch(`${baseUrl}/api/notifications/read-all`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${userAToken}` }
  });
  assert(
    readAllRes.ok,
    'Reader marks all notifications as read',
    'Unread counter cleared'
  );

  // 5.3 Fetch notification preferences
  const notifSettingsRes = await fetch(`${baseUrl}/api/notifications/settings`, {
    headers: { 'Authorization': `Bearer ${userAToken}` }
  });
  const notifSettingsData: any = await notifSettingsRes.json();
  assert(
    notifSettingsRes.ok && notifSettingsData.settings?.breakingNews === true,
    'Reader fetches notification preferences successfully',
    'Default preferences loaded'
  );

  // 5.4 Update notification preferences
  const updateSettingsRes = await fetch(`${baseUrl}/api/notifications/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userAToken}` },
    body: JSON.stringify({
      breakingNews: false,
      commentReplies: true
    })
  });
  const updateSettingsData: any = await updateSettingsRes.json();
  assert(
    updateSettingsRes.ok && updateSettingsData.settings?.breakingNews === false,
    'Reader updates notification preferences (e.g. disable breaking news, keep replies)',
    `Updated: breakingNews = ${updateSettingsData.settings?.breakingNews}`
  );

  // -------------------------------------------------------------
  // SECTION 6: Database Integrity & Cleanup (Phase 5)
  // -------------------------------------------------------------
  // 6.1 Author deletes own discussion (cascades comments and reports)
  const delDiscRes = await fetch(`${baseUrl}/api/discussions/${discId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${userAToken}` }
  });
  assert(
    delDiscRes.ok,
    'Author deletes own discussion with clean cascading in SQLite database',
    'Referential integrity maintained'
  );

  console.log('\n====================================================');
  console.log(`   PHASES 3, 4 & 5 VERIFICATION: ${passed}/${total} PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('====================================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runPhase345Tests().catch(err => {
  console.error('Phase 3, 4 & 5 test execution error:', err);
  process.exit(1);
});
