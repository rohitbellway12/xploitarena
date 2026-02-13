const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = 'admin@xploitarena.com';
  // 1. Seed Admin
  const hashedPassword = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: hashedPassword },
    create: {
      email: adminEmail,
      passwordHash: hashedPassword,
      firstName: 'System',
      lastName: 'Admin',
      role: 'ADMIN',
    },
  });
  console.log('Admin user seeded:', admin.email);

  // 1.1 Seed Requested Admin (Rohit)
  const opsAdminEmail = 'rohitbellway12@gmail.com';
  const opsAdminPassword = await bcrypt.hash('Admin@123', 12);
  const opsAdmin = await prisma.user.upsert({
    where: { email: opsAdminEmail },
    update: { passwordHash: opsAdminPassword, role: 'ADMIN', isVerified: true },
    create: {
      email: opsAdminEmail,
      passwordHash: opsAdminPassword,
      firstName: 'Rohit',
      lastName: 'Admin',
      role: 'ADMIN',
      isVerified: true, // Auto-verify admin
    },
  });
  console.log('Ops Admin user seeded:', opsAdmin.email);

  // 2. Seed a Company
  const companyEmail = 'security@tesla.com';
  const company = await prisma.user.upsert({
    where: { email: companyEmail },
    update: { passwordHash: hashedPassword },
    create: {
      email: companyEmail,
      passwordHash: hashedPassword,
      firstName: 'Tesla',
      lastName: 'Security',
      role: 'COMPANY_ADMIN',
    },
  });
  console.log('Company user seeded:', company.email);

  // 3. Seed a Researcher
  const researcherEmail = 'hacker@xploitarena.com';
  const researcher = await prisma.user.upsert({
    where: { email: researcherEmail },
    update: { passwordHash: hashedPassword },
    create: {
      email: researcherEmail,
      passwordHash: hashedPassword,
      firstName: 'Rohit',
      lastName: 'Gannote',
      role: 'RESEARCHER',
    },
  });
  console.log('Researcher user seeded:', researcher.email);

  // 4. Seed Programs for the Company
  const program1 = await prisma.program.create({
    data: {
      name: 'Tesla Cloud Infrastructure',
      description: 'Find vulnerabilities in our public-facing cloud assets.',
      scope: '*.tesla.com, *.teslamotors.com',
      rewards: '$500 - $15,000',
      status: 'ACTIVE',
      companyId: company.id,
    },
  });

  const program2 = await prisma.program.create({
    data: {
      name: 'Tesla Mobile App (iOS/Android)',
      description: 'Help us secure our owner and employee mobile applications.',
      scope: 'Tesla App 4.0+, Tesla One',
      rewards: '$200 - $5,000',
      status: 'ACTIVE',
      companyId: company.id,
    },
  });
  console.log('Programs seeded for Tesla');

  // 5. Seed Reports for the Researcher on Program 1
  await prisma.report.create({
    data: {
      title: 'SQL Injection on login endpoint',
      description: 'Found a potential SQLi in the /v1/auth/login parameter.',
      severity: 'CRITICAL',
      status: 'TRIAGING',
      programId: program1.id,
      researcherId: researcher.id,
    },
  });

  await prisma.report.create({
    data: {
      title: 'XSS in search bar',
      description: 'Reflected XSS possible via the query parameter.',
      severity: 'MEDIUM',
      status: 'SUBMITTED',
      programId: program1.id,
      researcherId: researcher.id,
    },
  });

  await prisma.report.create({
    data: {
      title: 'IDOR in profile update',
      description: 'Able to update other user profiles by changing the UUID.',
      severity: 'HIGH',
      status: 'ACCEPTED',
      programId: program2.id,
      researcherId: researcher.id,
    },
  });
  console.log('Reports seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
