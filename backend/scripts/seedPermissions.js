const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const permissions = [
    // ADMIN Verified Functionality
    { key: 'admin:stats', name: 'View Platform Statistics', category: 'ADMIN' },
    { key: 'admin:researchers', name: 'Manage Researcher Accounts', category: 'ADMIN' },
    { key: 'admin:companies', name: 'Manage Company Accounts', category: 'ADMIN' },
    { key: 'admin:triagers', name: 'Manage Triager Team', category: 'ADMIN' },
    { key: 'admin:approvals', name: 'Approve & Invite Businesses', category: 'ADMIN' },
    { key: 'admin:programs', name: 'Manage Global Programs', category: 'ADMIN' },
    { key: 'admin:triage', name: 'Global Report Triage', category: 'ADMIN' },
    { key: 'admin:events', name: 'Manage Platform Events', category: 'ADMIN' },
    { key: 'admin:settings', name: 'System Configuration', category: 'ADMIN' },

    // COMPANY Verified Functionality
    { key: 'company:stats', name: 'View Company Dashboard', category: 'COMPANY' },
    { key: 'company:programs', name: 'Manage Bounty Programs', category: 'COMPANY' },
    { key: 'company:triage', name: 'Triage Submitted Reports', category: 'COMPANY' },
    { key: 'company:payments', name: 'Approve Bounty Payments', category: 'COMPANY' },
    { key: 'company:audit', name: 'View Company Audit Logs', category: 'COMPANY' },
    { key: 'company:team', name: 'Manage Team & Access', category: 'COMPANY' },

    // RESEARCHER Verified Functionality
    { key: 'researcher:stats', name: 'View Performance Stats', category: 'RESEARCHER' },
    { key: 'researcher:reports', name: 'Submit & Manage Reports', category: 'RESEARCHER' },
  ];

  console.log('Seeding permissions...');

  for (const p of permissions) {
    try {
      await prisma.permission.upsert({
        where: { key: p.key },
        update: p,
        create: p,
      });
      console.log(`- Upserted: ${p.key}`);
    } catch (err) {
      console.error(`- Failed: ${p.key}`, err.message);
    }
  }

  console.log('Successfully seeded permissions.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
