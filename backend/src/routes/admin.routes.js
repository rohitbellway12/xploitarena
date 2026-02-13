const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/stats', protect, authorize('ADMIN', 'SUPER_ADMIN'), adminController.getAdminStats);
router.get('/researchers', protect, authorize('ADMIN', 'SUPER_ADMIN'), adminController.getResearchers);
router.get('/companies', protect, authorize('ADMIN', 'SUPER_ADMIN'), adminController.getCompanies);

module.exports = router;
