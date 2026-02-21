const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect, authorize, hasPermission } = require('../middleware/auth.middleware');

router.get('/stats', protect, hasPermission('admin:stats'), adminController.getAdminStats);
router.get('/sla/stats', protect, hasPermission('admin:stats'), adminController.getSlaStats);
router.get('/researchers', protect, hasPermission('admin:researchers'), adminController.getResearchers);
router.get('/companies', protect, hasPermission('admin:companies'), adminController.getCompanies);
router.get('/triagers', protect, hasPermission('admin:triagers'), adminController.getTriagers);
router.post('/create-triager', protect, hasPermission('admin:triagers'), adminController.createTriager);
router.patch('/triagers/:id/password', protect, hasPermission('admin:triagers'), adminController.updateTriagerPassword);
router.patch('/users/:id/toggle-status', protect, hasPermission('admin:researchers'), adminController.toggleUserStatus);
router.patch('/companies/bulk-assign-triager', protect, hasPermission('admin:companies'), adminController.bulkAssignTriagerToCompanies);
router.patch('/companies/:id/assign-triager', protect, hasPermission('admin:companies'), adminController.assignTriagerToCompany);
router.delete('/users/:id', protect, hasPermission('admin:researchers'), adminController.deleteUser);

// Company Invitation & Approval
router.post('/invite-company', protect, hasPermission('admin:approvals'), adminController.inviteCompany);
router.get('/pending-approvals', protect, hasPermission('admin:approvals'), adminController.getPendingApprovals);
router.post('/approve-user/:id', protect, hasPermission('admin:approvals'), adminController.approveUser);
router.post('/approve-kyb/:id', protect, hasPermission('admin:approvals'), adminController.approveKyb);
router.post('/reject-kyb/:id', protect, hasPermission('admin:approvals'), adminController.rejectKyb);
router.get('/audit-logs', protect, hasPermission('admin:logs'), adminController.getAuditLogs);
router.get('/audit-logs/export', protect, hasPermission('admin:logs'), adminController.exportAuditLogs);
router.get('/export/:type', protect, hasPermission('admin:logs'), adminController.exportData);
router.get('/search', protect, hasPermission('admin:stats'), adminController.globalSearch);

// Admin Team Management
router.get('/team', protect, authorize('ADMIN', 'SUPER_ADMIN'), adminController.getAdminTeam);
router.post('/team', protect, authorize('ADMIN', 'SUPER_ADMIN'), adminController.createAdminMember);
router.patch('/team/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), adminController.updateAdminMember);
router.patch('/users/bulk-toggle-status', protect, hasPermission('admin:researchers'), adminController.bulkToggleUserStatus);
router.patch('/team/:id/toggle-status', protect, authorize('ADMIN', 'SUPER_ADMIN'), adminController.toggleAdminMemberStatus);

module.exports = router;
