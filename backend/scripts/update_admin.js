require('dotenv').config();
const prisma = require('../src/utils/prisma');
const bcrypt = require('bcrypt');

async function updateAdmin() {
  const oldEmail = 'admin@xploitarena.com';
  const newEmail = 'rohitbellway12@gmail.com';
  const password = 'Admin@123';
  
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    // Delete the old dummy admin if it exists
    await prisma.user.deleteMany({
      where: { email: oldEmail }
    });

    // Create/Upsert the new real admin
    const admin = await prisma.user.upsert({
      where: { email: newEmail },
      update: {
        passwordHash,
        role: 'SUPER_ADMIN'
      },
      create: {
        email: newEmail,
        firstName: 'Rohit',
        lastName: 'Admin',
        passwordHash,
        role: 'SUPER_ADMIN',
        mfaEnabled: true
      }
    });

    console.log('✅ Admin updated successfully to real email!');
    console.log('New Email:', newEmail);
    console.log('Password:', password);
  } catch (error) {
    console.error('❌ Failed to update admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdmin();
