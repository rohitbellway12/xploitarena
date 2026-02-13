const express = require('express');
const { googleLogin, githubLogin } = require('../controllers/socialAuth.controller');

const router = express.Router();

router.post('/google', googleLogin);
router.post('/github', githubLogin);

module.exports = router;
