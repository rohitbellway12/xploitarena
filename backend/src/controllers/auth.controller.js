const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const emailService = require('../services/email.service');
const auditService = require('../services/audit.service');
const crypto = require('crypto');

const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        role: role || 'RESEARCHER',
        isVerified: false, 
        isActive: false, // Default to inactive, requires admin approval
        mfaEnabled: true, // Default to true as per user request
      },
    });

    // Generate Verification Token (using resetToken field for simplicity)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // We'll also still generate the 2FA OTP for the dual flow if needed
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 30 * 60 * 1000); // 30 mins

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        twoFactorCode: otp, 
        twoFactorExpires: expires,
        resetToken: verificationTokenHash,
        resetTokenExpires: verificationExpires
      }
    });

    try {
      // Send the Verification Link instead of just the 2FA OTP immediately
      const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${verificationToken}`;
      await emailService.sendVerificationEmail(user.email, verifyUrl);
      
      // We can also send the 2FA code if they try to login before verifying
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // We don't fail registration, but user will need to resend verification or contact support
    }

    await auditService.record({
      action: 'USER_REGISTER',
      details: { role: user.role, email: user.email },
      userId: user.id,
      ipAddress: req.ip
    });

    res.status(201).json({ 
      message: 'Registration successful! Please check your email for the verification link. Access will be granted after review.', 
      userId: user.id 
    });
  } catch (error) {
    console.error('Registration error details:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    
    const verificationTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        resetToken: verificationTokenHash,
        resetTokenExpires: { gt: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification link.' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        resetToken: null,
        resetTokenExpires: null
      }
    });

    await auditService.record({
      action: 'USER_EMAIL_VERIFIED',
      userId: user.id,
      ipAddress: req.ip
    });

    res.status(200).json({ message: 'Email successfully verified. You can now log in.' });
  } catch (error) {
    console.error('Email Verification Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ 
      where: { email },
      include: {
        customRole: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      await auditService.record({ action: 'AUTH_FAILED_UNKNOWN_USER', details: { email }, ipAddress: req.ip });
      return res.status(401).json({ message: 'Email not registered' });
    }

    // Check if account is active
    if (!user.isActive) {
      await auditService.record({ action: 'AUTH_BLOCKED_INACTIVE', userId: user.id, ipAddress: req.ip });
      return res.status(403).json({ message: 'Account is deactivated. Please contact administrator.' });
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await auditService.record({ action: 'AUTH_BLOCKED_LOCKOUT', userId: user.id, ipAddress: req.ip });
      return res.status(403).json({ message: 'Account locked. Please try again later.' });
    }

    // Check if user is verified
    // If not verified, we treat it similarly to 2FA required (or explicit verification required)
    // For now, we will use the 2FA flow to force verification code entry
    const isUnverified = !user.isVerified;

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      const attempts = user.loginAttempts + 1;
      let lockedUntil = null;
      
      if (attempts >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        await auditService.record({ action: 'USER_LOCKED', userId: user.id, details: '5 failed attempts', ipAddress: req.ip });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { loginAttempts: attempts, lockedUntil }
      });

      await auditService.record({ action: 'AUTH_FAILED_PASSWORD', userId: user.id, details: { attempts }, ipAddress: req.ip });
      return res.status(401).json({ message: 'Incorrect password' });
    }

    // Reset login attempts on success
    await prisma.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockedUntil: null }
    });

    const requires2FA = user.mfaEnabled || isUnverified;

    if (requires2FA) {
      let otp = user.twoFactorCode;
      let expires = user.twoFactorExpires;

      // If no valid OTP exists, generate a new one
      if (!otp || !expires || expires < new Date()) {
        otp = Math.floor(100000 + Math.random() * 900000).toString();
        expires = new Date(Date.now() + 30 * 60 * 1000);

        await prisma.user.update({
          where: { id: user.id },
          data: { twoFactorCode: otp, twoFactorExpires: expires }
        });
      }

      try {
        console.log(`Initiating 2FA email send for user: ${user.email}`);
        await emailService.send2FACode(user.email, otp);
        console.log(`2FA email send called for user: ${user.email}`);
      } catch (emailError) {
        console.error('CRITICAL: Failed to send 2FA email in login flow:', emailError);
      }

      await auditService.record({ action: 'AUTH_2FA_INITIATED', userId: user.id, ipAddress: req.ip });

      return res.status(200).json({
        mfaRequired: true,
        userId: user.id,
        message: isUnverified 
          ? 'Account not verified. Please enter the verification code sent to your email.' 
          : 'Please enter the 2FA code sent to your email.'
      });
    }

    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' } // Short lived access token
    );

    // Generate Refresh Token
    const rToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.refreshToken.create({
      data: {
        token: rToken,
        userId: user.id,
        expiresAt: refreshTokenExpires,
      }
    });

    await auditService.record({ action: 'AUTH_LOGIN_SUCCESS', userId: user.id, ipAddress: req.ip });

    const permissions = user.customRole?.permissions.map(p => p.permission.key) || [];

    res.status(200).json({
      accessToken,
      refreshToken: rToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        parentId: user.parentId,
        permissions
      },
    });
  } catch (error) {
    console.error('FULL LOGIN ERROR:', error);
    res.status(500).json({ message: 'Internal server error', details: error.message });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Refresh Token is required' });
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    // Generate new Access Token
    const accessToken = jwt.sign(
      { id: storedToken.user.id, role: storedToken.user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Rotate Refresh Token (Optional security measure, keeping simple for now)
    
    res.json({ accessToken });
  } catch (error) {
    console.error('Refresh Token Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const logout = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (token) {
      // Revoke the specific token
      await prisma.refreshToken.update({
        where: { token },
        data: { revoked: true }
      });
    }

    // Client should also delete tokens locally
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const revokeAllSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    await prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true }
    });

    await auditService.record({ action: 'AUTH_REVOKE_ALL_SESSIONS', userId, ipAddress: req.ip });
    
    res.json({ message: 'All other sessions revoked' });
  } catch (error) {
    console.error('Revoke Sessions Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// module.exports moved to bottom


const verify2FA = async (req, res) => {
  try {
    const { userId, code } = req.body;

    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      include: {
        customRole: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    if (!user || user.twoFactorCode !== code?.trim() || !user.twoFactorExpires || user.twoFactorExpires < new Date()) {
      await auditService.record({ action: 'AUTH_2FA_FAILED', userId: userId, details: 'Invalid or expired code', ipAddress: req.ip });
      return res.status(401).json({ message: 'Invalid or expired 2FA code' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        twoFactorCode: null, 
        twoFactorExpires: null,
        isVerified: true // Mark as verified on successful code entry
      }
    });

    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const rToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        token: rToken,
        userId: user.id,
        expiresAt: refreshTokenExpires,
      }
    });

    await auditService.record({ action: 'AUTH_2FA_SUCCESS', userId: user.id, ipAddress: req.ip });

    const permissions = user.customRole?.permissions.map(p => p.permission.key) || [];

    res.status(200).json({
      accessToken,
      refreshToken: rToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        parentId: user.parentId,
        permissions
      },
    });
  } catch (error) {
    console.error('2FA Verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        customRole: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const permissions = user.customRole?.permissions.map(p => p.permission.key) || [];

    // For sub-accounts, fetch parent's kybStatus so the UI shows correct verification state
    let kybStatus = user.kybStatus;
    if (user.parentId) {
      const parent = await prisma.user.findUnique({
        where: { id: user.parentId },
        select: { kybStatus: true }
      });
      if (parent) kybStatus = parent.kybStatus;
    }

    res.status(200).json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      parentId: user.parentId,
      isVerified: user.isVerified,
      mfaEnabled: user.mfaEnabled,
      createdAt: user.createdAt,
      kybStatus,
      permissions
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};


// crypto already moved to top

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Don't reveal if user exists
      return res.status(200).json({ message: 'If that email is registered, a reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: resetTokenHash,
        resetTokenExpires: resetTokenExpires
      }
    });

    // Send email
    // In production, use your frontend URL. For dev, assuming localhost:5173
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    
    try {
      await emailService.sendPasswordResetEmail(user.email, resetUrl);
    } catch (err) {
      console.error('Email send failed:', err);
      return res.status(500).json({ message: 'Email could not be sent' });
    }

    await auditService.record({ action: 'AUTH_PASSWORD_RESET_REQUEST', userId: user.id, ipAddress: req.ip });

    res.status(200).json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        resetToken: resetTokenHash,
        resetTokenExpires: { gt: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
        loginAttempts: 0,
        lockedUntil: null
      }
    });

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const toggleMFA = async (req, res) => {
  try {
    const { enabled } = req.body;
    const userId = req.user.id;

    await prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: !!enabled }
    });

    await auditService.record({
      action: enabled ? 'MFA_ENABLED' : 'MFA_DISABLED',
      userId,
      ipAddress: req.ip
    });

    res.status(200).json({ message: `MFA ${enabled ? 'enabled' : 'disabled'} successfully`, mfaEnabled: !!enabled });
  } catch (error) {
    console.error('Toggle MFA Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const validateInvite = async (req, res) => {
  try {
    const { token } = req.params;
    const invite = await prisma.invitation.findUnique({
      where: { token }
    });

    if (!invite || invite.used || invite.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired invitation' });
    }

    res.json({ email: invite.email, role: invite.role });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

const registerCompany = async (req, res) => {
  try {
    const { token, password, firstName, lastName } = req.body;

    // 1. Validate Invitation
    const invite = await prisma.invitation.findUnique({ where: { token } });
    if (!invite || invite.used || invite.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired invitation' });
    }

    // 2. Hash Password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 3. Create User (Inactive by default, Verified because they have the token)
    const user = await prisma.user.create({
      data: {
        email: invite.email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        role: 'COMPANY_ADMIN',
        isVerified: true, // Verification via invite token
        isActive: false,  // Wait for admin approval
        mfaEnabled: true
      }
    });

    // 4. Mark invitation as used
    await prisma.invitation.update({
      where: { id: invite.id },
      data: { used: true }
    });

    res.status(201).json({ 
      message: 'Registration successful. Your account is now pending administrative approval.',
      userId: user.id
    });
  } catch (error) {
    console.error('Register Company Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  register,
  login,
  verify2FA,
  getMe,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
  revokeAllSessions,
  toggleMFA,
  validateInvite,
  registerCompany,
  verifyEmail,
};
