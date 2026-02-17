require('dotenv').config();
const axios = require('axios');
const prisma = require('./src/utils/prisma'); // Direct DB access to get token

const API_URL = 'http://localhost:3000/api';

const run = async () => {
  try {
    const email = 'reset_test@example.com';
    
    // 1. Create User
    console.log('--- Creating User ---');
    // Clean up if exists
    try {
        const user = await prisma.user.delete({ where: { email } });
    } catch(e) {}

    await prisma.user.create({
        data: {
            email,
            passwordHash: 'oldhash',
            firstName: 'Reset',
            lastName: 'Test'
        }
    });

    // 2. Request Password Reset
    console.log('\n--- Requesting Password Reset ---');
    await axios.post(`${API_URL}/auth/forgot-password`, { email });
    console.log('Reset request sent.');

    // 3. Get Token from DB (Simulating checking email)
    const user = await prisma.user.findUnique({ where: { email } });
    console.log('Reset Token Hash in DB:', user.resetToken);

    // We can't easily reverse the hash to call the API unless we mocked the random bytes or intercepted the email logic.
    // However, we can verify that the token IS set in the DB, which confirms the flow initiated correctly.
    
    if (user.resetToken && user.resetTokenExpires) {
        console.log('SUCCESS: Reset token generated and stored in DB.');
    } else {
        console.error('FAILURE: Reset token not found in DB.');
    }

  } catch (error) {
    console.error('Test Failed:', error.response?.data || error.message);
  }
};

run();
