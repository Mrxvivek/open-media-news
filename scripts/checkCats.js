import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkDomains() {
  for (const cat of ['Business', 'IT', 'Cyber Security', 'AI']) {
    const res = await prisma.article.groupBy({
      by: ['domain'],
      where: { category: cat },
      _count: true
    });
    console.log(`\n=== [${cat}] Domains ===`);
    res.forEach(r => console.log(`  - ${r.domain || '(null)'}: ${r._count} articles`));
  }
  await prisma.$disconnect();
}

checkDomains().catch(console.error);
