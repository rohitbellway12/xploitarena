const express = require('express');
const router = express.Router();
const programController = require('../controllers/program.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Public/Researcher routes
router.get('/', protect, programController.getAllPrograms);
router.get('/:id', protect, programController.getProgramById);

// Company only routes
router.post('/', protect, authorize('COMPANY_ADMIN', 'ADMIN'), programController.createProgram);
router.put('/:id', protect, authorize('COMPANY_ADMIN'), programController.updateProgram);
router.post('/:id/invite', protect, authorize('COMPANY_ADMIN'), programController.inviteResearcher);

module.exports = router;
