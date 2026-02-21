require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const prisma = require('./src/utils/prisma');

async function run() {
  const user = await prisma.user.findFirst({
    where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
  });

  if (!user) {
    console.error('No ADMIN/SUPER_ADMIN found in DB');
    return;
  }
  
  console.log('Using Admin ID:', user.id, user.role);

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);
  const port = process.env.PORT || 3000;

  try {
    const res = await axios.post(`http://localhost:${port}/api/admin/invite-company`, {
      email: 'testapi8@example.com',
      message: 'test message'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Success:', res.data);
  } catch (err) {
    if (err.response) {
      console.log('Error status:', err.response.status);
      console.log('Error data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.log('Error message:', err.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

run();
