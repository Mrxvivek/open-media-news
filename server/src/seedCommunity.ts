import { prisma } from './prisma.js';

async function seedCommunityContent() {
  console.log('🌱 Checking community content (polls & discussions)...');

  // 1. Check or create default poll
  const pollCount = await prisma.poll.count();
  if (pollCount === 0) {
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (adminUser) {
      await prisma.poll.create({
        data: {
          question: 'Which sector will see the largest AI transformation impact in 2027?',
          category: 'AI',
          authorId: adminUser.id,
          options: {
            create: [
              { text: 'Enterprise Cloud Architecture & DevOps' },
              { text: 'Automated Cybersecurity Defense & Threat Hunting' },
              { text: 'Algorithmic Financial Operations & Risk Modeling' },
              { text: 'Healthcare Systems & Clinical Diagnostics' }
            ]
          }
        }
      });
      console.log('✅ Created initial interactive community poll.');
    }
  }

  // 2. Check or create default discussions
  const discCount = await prisma.discussion.count();
  if (discCount === 0) {
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (adminUser) {
      await prisma.discussion.create({
        data: {
          title: 'Practical Strategies for Zero Trust Migration in Legacy Financial Infrastructure',
          content: 'As regional institutions adopt cloud-native banking cores, how are teams reconciling legacy mainframe COBOL transaction logs with micro-segmented network policies?',
          category: 'Cyber Security',
          authorId: adminUser.id,
          comments: {
            create: [
              {
                content: 'We implemented sidecar proxies on intermediate bridge clusters to sign and tokenize legacy payloads before they enter the service mesh.',
                authorId: adminUser.id
              }
            ]
          }
        }
      });

      await prisma.discussion.create({
        data: {
          title: 'Decentralized Edge Agents vs. Centralized Swarms: Scalability Breakdown',
          content: 'What is your operational experience with distributing agent reasoning across client devices vs. concentrating context in enterprise cloud clusters?',
          category: 'AI',
          authorId: adminUser.id
        }
      });
      console.log('✅ Created initial community discussion topics.');
    }
  }

  console.log('🎉 Community content verified.');
}

seedCommunityContent()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
