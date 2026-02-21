const express = require('express');
const router = express.Router();
const teamManagementController = require('../controllers/team_management.controller');
const { protect } = require('../middleware/auth.middleware');

// Allow any logged-in RESEARCHER (root or sub-account) to manage teams
// The controller uses req.user.id as the creator/filter
router.post('/create', protect, teamManagementController.createTeam);
router.get('/my-teams', protect, teamManagementController.getMyTeams);
router.post('/add-member', protect, teamManagementController.addMember);

module.exports = router;

