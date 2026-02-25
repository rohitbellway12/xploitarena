const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Public: branding only (logo, title) — accessible by all roles
router.get('/branding', settingsController.getBranding);

// All other settings routes are protected and admin only
router.use(protect);
router.use(authorize('ADMIN', 'SUPER_ADMIN'));

router.get('/', settingsController.getSettings);
router.post('/update', settingsController.updateSettings);
router.post('/bulk-update', settingsController.bulkUpdateSettings);

module.exports = router;
