const express = require('express');
const uploadController = require('../controllers/upload.controller');
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

const router = express.Router();

// Upload a single file (Protected)
router.post('/', protect, upload.single('file'), uploadController.uploadFile);

// Get a secure file (Protected, check permissions)
router.get('/file/:id', protect, uploadController.getFile);

module.exports = router;
