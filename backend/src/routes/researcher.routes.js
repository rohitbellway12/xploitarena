const express = require('express');
const router = express.Router();
const researcherController = require('../controllers/researcher.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/stats', protect, authorize('RESEARCHER'), researcherController.getResearcherStats);
router.get('/reports', protect, authorize('RESEARCHER'), researcherController.getMyReports);

module.exports = router;
