require('dotenv').config();
const bcrypt = require('bcrypt');
const prisma = require('./src/utils/prisma');
const auditService = require('./src/services/audit.service');

async function reproduce() {
  try {
    console.log('Starting registration simulation...');
    const email = 'test_user_' + Date.now() + '@example.com';
    const password = 'password123';
    const firstName = 'Test';
    const lastName = 'User';
    const role = 'RESEARCHER';

    console.log(`Checking if user exists: ${email}`);
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      console.log('User already exists');
      return;
    }

    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('Password hashed');

    console.log('Creating user...');
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        role: role || 'RESEARCHER',
        isVerified: false,
      },
    });
    console.log('User created:', user.id);

    console.log('Recording audit log...');
    await auditService.record({
      action: 'USER_REGISTER',
      details: { role: user.role, email: user.email },
      userId: user.id,
      ipAddress: '127.0.0.1'
    });
    console.log('Audit log recorded');

    console.log('Registration simulation successful');
  } catch (error) {
    console.error('Registration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

reproduce();
