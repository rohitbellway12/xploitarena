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
      isVerified: true,
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
