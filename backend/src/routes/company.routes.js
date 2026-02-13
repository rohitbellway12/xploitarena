const express = require('express');
const router = express.Router();
const companyController = require('../controllers/company.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/stats', protect, authorize('COMPANY_ADMIN'), companyController.getCompanyStats);
router.post('/verify', protect, authorize('COMPANY_ADMIN'), companyController.verifyCompany);
router.get('/audit-logs', protect, authorize('COMPANY_ADMIN'), companyController.getAuditLogs);
router.get('/audit-logs/export', protect, authorize('COMPANY_ADMIN'), companyController.exportAuditLogs);

// Team Management
router.post('/members', protect, authorize('COMPANY_ADMIN'), companyController.inviteMember);
router.get('/members', protect, authorize('COMPANY_ADMIN'), companyController.getMembers);
router.delete('/members/:userId', protect, authorize('COMPANY_ADMIN'), companyController.removeMember);

module.exports = router;
