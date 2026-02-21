const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/:reportId', protect, commentController.addComment);
router.get('/:reportId', protect, commentController.getComments);

module.exports = router;
