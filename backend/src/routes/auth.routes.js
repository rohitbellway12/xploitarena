const express = require('express');
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/revoke-sessions', protect, authController.revokeAllSessions);
router.post('/verify-2fa', authController.verify2FA);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);
router.get('/me', protect, authController.getMe);
router.post('/toggle-2fa', protect, authController.toggleMFA);
router.put('/profile', protect, authController.updateProfile);
router.put('/change-password', protect, authController.changePassword);
router.put('/notifications', protect, authController.updateNotifications);

// Company Invitation & Registration
router.get('/validate-invite/:token', authController.validateInvite);
router.post('/register-company', authController.registerCompany);

// Email Verification Link
router.get('/verify-email/:token', authController.verifyEmail);

module.exports = router;
