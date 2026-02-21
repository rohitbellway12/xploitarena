// Test Script: Email aur User Delete
require('dotenv').config();

const nodemailer = require('nodemailer');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const TARGET_EMAIL = 'arushgour507@gmail.com';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

async function main() {
  console.log('\n============================');
  console.log('EMAIL CONFIG CHECK');
  console.log('============================');
  console.log('EMAIL_HOST :', process.env.EMAIL_HOST);
  console.log('EMAIL_PORT :', process.env.EMAIL_PORT);
  console.log('EMAIL_USER :', process.env.EMAIL_USER);
  console.log('EMAIL_PASS :', process.env.EMAIL_PASS ? '✅ Set' : '❌ NOT SET');
  
  console.log('\n--- Step 1: Transporter Verify ---');
  try {
    await transporter.verify();
    console.log('✅ Transporter connected! SMTP working.');
  } catch (err) {
    console.error('❌ Transporter FAILED:', err.message);
    console.log('Email cannot be sent. Fix credentials first.');
    await prisma.$disconnect();
    return;
  }

  // Step 2: Send test approval email
  console.log('\n--- Step 2: Sending TEST Approval Email to:', TARGET_EMAIL, '---');
  try {
    const info = await transporter.sendMail({
      from: `"XploitArena Administration" <${process.env.EMAIL_USER}>`,
      to: TARGET_EMAIL,
      subject: 'TEST: Your Company Account Has Been Approved!',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #1e293b; border-radius: 12px; background-color: #0f172a; color: #f8fafc;">
          <h2 style="color: #6366f1; text-align: center;">XploitArena Account Approved ✅</h2>
          <p>Hello,</p>
          <p>This is a <strong>TEST email</strong> to verify the approval email is working correctly.</p>
          <p>Your Company Admin account on XploitArena has been reviewed and <strong>approved</strong>!</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background-color: #6366f1; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Login Now</a>
          </div>
          <p style="font-size: 12px; text-align: center; color: #64748b;">© 2026 XploitArena. All rights reserved.</p>
        </div>
      `,
    });
    console.log('✅ Approval email SENT successfully!');
    console.log('   MessageId:', info.messageId);
  } catch (err) {
    console.error('❌ Approval email FAILED:', err.message);
  }

  // Step 3: Delete the user
  console.log('\n--- Step 3: Deleting user:', TARGET_EMAIL, '---');
  try {
    const user = await prisma.user.findUnique({ where: { email: TARGET_EMAIL } });
    if (!user) {
      console.log('⚠️  User not found in DB:', TARGET_EMAIL);
    } else {
      // Delete related data first
      await prisma.notification.deleteMany({ where: { userId: user.id } });
      await prisma.auditLog.deleteMany({ where: { userId: user.id } });
      await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
      await prisma.report.deleteMany({ where: { researcherId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
      console.log('✅ User deleted successfully:', TARGET_EMAIL);
    }
  } catch (err) {
    console.error('❌ User delete FAILED:', err.message);
  }

  console.log('\n============================');
  console.log('TEST COMPLETE');
  console.log('============================\n');
  await prisma.$disconnect();
}

main().catch(console.error);
