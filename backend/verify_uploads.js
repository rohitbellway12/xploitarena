const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

const API_URL = 'http://localhost:3000/api';
let token = '';
let reportId = '';
let fileId = '';

const run = async () => {
  try {
    console.log('--- 1. Registering Researcher (Skipped to avoid Rate Limit) ---');
    /*
    try {
      await axios.post(`${API_URL}/auth/register`, {
        email: 'test_researcher_' + Date.now() + '@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'Researcher',
        role: 'RESEARCHER'
      });
    } catch (e) {
      // If exists, login
    }
    */

    // Login to get token
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@xploitarena.com', 
      password: 'Admin@123'
    });
    token = loginRes.data.accessToken;
    console.log('Login successful. Token obtained.');
    if (loginRes.data.mfaRequired) {
        console.log("MFA Required, cannot proceed with simple script without OTP handling. Skipping to simple auth if possible or using seeded admin.");
    }

    // Create a dummy file
    const filePath = path.join(__dirname, 'test_poc.txt');
    fs.writeFileSync(filePath, 'This is a test Proof of Concept file content.');

    console.log('\n--- 2. Uploading File (Unlinked) ---');
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    
    const uploadRes = await axios.post(`${API_URL}/upload`, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Upload Status:', uploadRes.status);
    console.log('File ID:', uploadRes.data.file.id);
    fileId = uploadRes.data.file.id;

    console.log('\n--- 3. Accessing File (Authorized) ---');
    try {
      const fileRes = await axios.get(`${API_URL}/upload/file/${fileId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('Access Success. Data length:', fileRes.data.length);
    } catch (error) {
      console.error('Access Failed:', error.response?.status);
    }

    console.log('\n--- 4. Accessing File (Unauthorized) ---');
    try {
      await axios.get(`${API_URL}/upload/file/${fileId}`);
    } catch (error) {
      console.log('Access Blocked correctly:', error.response?.status); // Should be 401
    }

    // Cleanup
    fs.unlinkSync(filePath);
    
  } catch (error) {
    console.error('Test Failed:', error.response?.data || error.message);
  }
};

run();
