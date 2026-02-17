const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage Strategy
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate secure unique filename
    // Original extension is preserved but filename is random UUID
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

// File Filter (Security)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg', 
    'image/png', 
    'image/gif', 
    'application/pdf', 
    'text/plain',
    'application/zip',
    'application/x-zip-compressed'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only Images, PDF, TXT and ZIP are allowed.'), false);
  }
};

// Multer Instance
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit
  }
});

module.exports = upload;
