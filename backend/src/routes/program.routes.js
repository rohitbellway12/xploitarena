const express = require('express');
const router = express.Router();
const programController = require('../controllers/program.controller');
const { protect, authorize, hasPermission } = require('../middleware/auth.middleware');

// Public/Researcher routes
router.get('/', protect, programController.getAllPrograms);
router.get('/:id', protect, programController.getProgramById);

// Company only routes
router.post('/', protect, hasPermission('company:programs'), programController.createProgram);
router.put('/:id', protect, hasPermission('company:programs'), programController.updateProgram);
router.post('/:id/invite', protect, hasPermission('company:programs'), programController.inviteResearcher);

module.exports = router;
