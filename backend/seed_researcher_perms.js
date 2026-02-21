require('dotenv').config();
const prisma = require('./src/utils/prisma');

async function seed() {
  try {
    const permissions = [
      { key: 'researcher:dashboard', name: 'Dashboard Access', description: 'Allow viewing the main researcher dashboard', category: 'RESEARCHER' },
      { key: 'researcher:programs', name: 'Program Directory', description: 'Allow browsing available bug bounty programs', category: 'RESEARCHER' },
      { key: 'researcher:reports', name: 'Report Management', description: 'Allow submitting and viewing reports', category: 'RESEARCHER' },
      { key: 'researcher:teams', name: 'Team Collaboration', description: 'Allow managing strike units and operatives', category: 'RESEARCHER' },
      { key: 'researcher:leaderboard', name: 'Leaderboard', description: 'Allow viewing the global leaderboard', category: 'RESEARCHER' }
    ];

    for (const p of permissions) {
      await prisma.permission.upsert({
        where: { key: p.key },
        update: p,
        create: p
      });
    }
    
    console.log('Successfully seeded researcher permissions');
  } catch (err) {
    console.error('Seed failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
