const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/', protect, eventController.getEvents);
router.post('/', protect, authorize('ADMIN', 'SUPER_ADMIN'), eventController.createEvent);

module.exports = router;
