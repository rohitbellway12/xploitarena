const express = require('express');
const router = express.Router();
const companyController = require('../controllers/company.controller');
const { protect, authorize, hasPermission } = require('../middleware/auth.middleware');

router.get('/stats', protect, hasPermission('company:stats'), companyController.getCompanyStats);
router.get('/budget/trends', protect, hasPermission('company:stats'), companyController.getBudgetTrends);
router.get('/sla/stats', protect, hasPermission('company:stats'), companyController.getSlaStats);
router.post('/verify', protect, authorize('COMPANY_ADMIN'), companyController.verifyCompany);
router.get('/audit-logs', protect, hasPermission('company:audit'), companyController.getAuditLogs);
router.get('/audit-logs/export', protect, hasPermission('company:audit'), companyController.exportAuditLogs);

// Team Management
router.post('/members', protect, hasPermission('company:team'), companyController.inviteMember);
router.get('/members', protect, hasPermission('company:team'), companyController.getMembers);
router.delete('/members/:userId', protect, hasPermission('company:team'), companyController.removeMember);

module.exports = router;
