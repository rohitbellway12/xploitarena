const express = require('express');
const teamController = require('../controllers/team.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', protect, teamController.getTeam);
router.post('/add', protect, teamController.addTeamMember);
router.patch('/:id', protect, teamController.updateMember);
router.delete('/:id', protect, teamController.removeMember);

module.exports = router;
