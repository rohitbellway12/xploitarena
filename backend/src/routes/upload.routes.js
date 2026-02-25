const express = require('express');
const uploadController = require('../controllers/upload.controller');
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const router = express.Router();

// Upload a single file (Protected)
router.post('/', protect, upload.single('file'), uploadController.uploadFile);

// Get a secure file - DEBUG
router.get('/file/:id', (req, res, next) => {
  console.log('Upload route hit:', req.params.id, 'Auth:', req.headers.authorization ? 'has token' : 'no token');
  next();
}, uploadController.getFile);

module.exports = router;
