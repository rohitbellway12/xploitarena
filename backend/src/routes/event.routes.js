const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/', protect, eventController.getEvents);
router.get('/:id/dashboard', protect, eventController.getEventDashboard);
router.get('/:id/leaderboard', protect, eventController.getLeaderboard);
router.get('/:id/metrics/stream', protect, eventController.metricsStream);
router.post('/', protect, authorize('ADMIN', 'SUPER_ADMIN'), eventController.createEvent);
router.put('/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), eventController.updateEvent);
router.delete('/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), eventController.deleteEvent);
router.post('/:id/schedule-pentest', protect, authorize('ADMIN', 'SUPER_ADMIN'), eventController.schedulePentest);

module.exports = router;
