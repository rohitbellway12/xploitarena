const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { protect, authorize, hasPermission } = require('../middleware/auth.middleware');

// Researcher routes
router.post('/', protect, authorize('RESEARCHER'), reportController.submitReport);
router.get('/my', protect, authorize('RESEARCHER'), reportController.getMyReports);
router.put('/:id', protect, authorize('RESEARCHER'), reportController.updateReport);
router.get('/:id', protect, reportController.getReportById); // Internal isolation in controller

// Company & Triage routes
router.get('/triage/all', protect, hasPermission('admin:triage'), reportController.getAllReports);
router.get('/program/:programId', protect, hasPermission('company:triage'), reportController.getProgramReports);
router.put('/:id/status', protect, hasPermission('company:triage'), reportController.updateReportStatus);
router.patch('/bulk-assign', protect, hasPermission('admin:triage'), reportController.bulkAssignReports);
router.post('/:id/pay', protect, hasPermission('company:payments'), reportController.payBounty);

module.exports = router;
