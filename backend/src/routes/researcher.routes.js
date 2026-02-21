const express = require('express');
const router = express.Router();
const researcherController = require('../controllers/researcher.controller');
const researcherToolsController = require('../controllers/researcher_tools.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/stats', protect, authorize('RESEARCHER'), researcherController.getResearcherStats);
router.get('/reports', protect, authorize('RESEARCHER'), researcherController.getMyReports);

// Tools
router.post('/bookmarks/toggle', protect, authorize('RESEARCHER'), researcherToolsController.toggleBookmark);
router.get('/bookmarks', protect, authorize('RESEARCHER'), researcherToolsController.getBookmarks);
router.post('/tools/check-scope', protect, authorize('RESEARCHER'), researcherToolsController.checkScope);
router.get('/leaderboard', protect, researcherController.getLeaderboard);

module.exports = router;
