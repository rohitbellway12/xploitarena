const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Available models in Prisma:', Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')));
  process.exit(0);
}

main().catch(console.error);
