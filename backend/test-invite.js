require('dotenv').config();
const { inviteCompany } = require('./src/controllers/admin.controller');

const req = {
  body: {
    email: 'newcompany123@example.com',
    message: 'test message'
  }
};

const res = {
  status: (code) => ({
    json: (data) => console.log('Response:', code, data)
  }),
  json: (data) => console.log('Response: 200', data)
};

async function run() {
  await inviteCompany(req, res);
  process.exit(0);
}

run();
