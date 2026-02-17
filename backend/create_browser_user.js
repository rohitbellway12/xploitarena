const prisma = require('./src/utils/prisma');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

async function main() {
  const email = 'browser_test@xploitarena.com';
  const password = 'Password123!';
  const hashedPassword = await bcrypt.hash(password, 10);

  // Clean up if exists
  try {
      await prisma.user.delete({ where: { email } });
  } catch(e) {}

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hashedPassword,
      firstName: 'Browser',
      lastName: 'Tester',
      role: 'RESEARCHER',
      isVerified: true,
    },
  });
  
  // Also need a program to submit to. Let's find or create one.
  // Find a company first
  let company = await prisma.user.findFirst({ where: { role: 'COMPANY_ADMIN' } });
  if (!company) {
     const compEmail = 'comp_browser@xploitarena.com';
     const compPass = await bcrypt.hash('Password123!', 10);
     company = await prisma.user.create({
        data: {
            email: compEmail,
            passwordHash: compPass,
            firstName: 'Comp',
            lastName: 'Admin',
            role: 'COMPANY_ADMIN',
            isVerified: true
        }
     });
  }

  // Create Program
  const program = await prisma.program.create({
      data: {
          name: 'Browser Test Program',
          description: 'For browser testing',
          companyId: company.id,
          status: 'PUBLIC',
          type: 'VDP' 
      }
  });

  console.log('User Created:', email, password);
  console.log('Program Created:', program.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
