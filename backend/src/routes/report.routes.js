const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Researcher routes
router.post('/', protect, authorize('RESEARCHER'), reportController.submitReport);
router.get('/my', protect, authorize('RESEARCHER'), reportController.getMyReports);
router.put('/:id', protect, authorize('RESEARCHER'), reportController.updateReport);
router.get('/:id', protect, reportController.getReportById); // Internal isolation in controller

// Company & Triage routes
router.get('/triage/all', protect, authorize('TRIAGER', 'ADMIN'), reportController.getAllReports);
router.get('/program/:programId', protect, authorize('COMPANY_ADMIN', 'TRIAGER', 'ADMIN'), reportController.getProgramReports);
router.put('/:id/status', protect, authorize('COMPANY_ADMIN', 'TRIAGER', 'ADMIN'), reportController.updateReportStatus);
router.post('/:id/pay', protect, authorize('COMPANY_ADMIN'), reportController.payBounty);

module.exports = router;
