const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const prisma = require('../utils/prisma');
const jwt = require('jsonwebtoken');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleLogin = async (req, res) => {
  try {
    const { idToken, role } = req.body;
    console.log('[DEBUG] Google Login Attempt for role:', role);
    console.log('[DEBUG] ID Token received (first 20 chars):', idToken?.substring(0, 20));

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    console.log('[DEBUG] ID Token Verified successfully');

    const payload = ticket.getPayload();
    const { sub: googleId, email, given_name: firstName, family_name: lastName } = payload;

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create new user if not exists
      user = await prisma.user.create({
        data: {
          email,
          googleId,
          firstName: firstName || 'Google',
          lastName: lastName || 'User',
          passwordHash: 'OAUTH_USER', // Placeholder
          role: role || 'RESEARCHER',
        },
      });
    } else if (!user.googleId) {
      // Link Google account to existing email
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId },
      });
    }

    // Generate token (Skip 2FA for Social Login for now, or implement it if required)
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Google Login Error:', error);
    res.status(401).json({ message: 'Google authentication failed' });
  }
};

exports.githubLogin = async (req, res) => {
  try {
    const { code, role } = req.body;

    // 1. Exchange code for access token
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }, {
      headers: { Accept: 'application/json' },
    });

    const accessToken = tokenResponse.data.access_token;

    // 2. Get user info from GitHub
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { id: githubId, email, name, login } = userResponse.data;
    
    // GitHub might not provide email depending on user settings, fallback to username
    const finalEmail = email || `${login}@github.com`;
    const fullName = name || login;
    const names = fullName.split(' ');
    const firstName = names[0];
    const lastName = names.slice(1).join(' ') || 'User';

    let user = await prisma.user.findUnique({
      where: { email: finalEmail },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: finalEmail,
          githubId: githubId.toString(),
          firstName,
          lastName,
          passwordHash: 'OAUTH_USER',
          role: role || 'RESEARCHER',
        },
      });
    } else if (!user.githubId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { githubId: githubId.toString() },
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('GitHub Login Error:', error);
    res.status(401).json({ message: 'GitHub authentication failed' });
  }
};
