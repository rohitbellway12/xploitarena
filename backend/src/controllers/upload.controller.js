const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../utils/prisma');
const cryptoService = require('../services/crypto.service');
const auditService = require('../services/audit.service');

// Upload Single File with Secondary Encryption
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { originalname, mimetype, size, buffer } = req.file;
    const { reportId } = req.body;

    // 1. Encrypt Buffer
    const encryptedBuffer = cryptoService.encrypt(buffer);

    // 2. Generate Unique System Filename
    const ext = path.extname(originalname);
    const systemFilename = `${uuidv4()}${ext}.enc`; // Append .enc for clarity
    const uploadDir = path.join(__dirname, '../../uploads');
    const filePath = path.join(uploadDir, systemFilename);

    // 3. Write Encrypted File to Disk
    fs.writeFileSync(filePath, encryptedBuffer);

    // 4. Save to Database
    const file = await prisma.file.create({
      data: {
        filename: originalname,
        path: systemFilename,
        mimetype,
        size: encryptedBuffer.length, // Store encrypted size
        uploaderId: req.user.id,
        reportId: reportId || null
      }
    });

    await auditService.record({
      action: 'FILE_UPLOADED_ENCRYPTED',
      userId: req.user.id,
      details: { filename: originalname, size, type: mimetype },
      ipAddress: req.ip
    });

    res.status(201).json({
      message: 'File uploaded and encrypted safely',
      file: {
        id: file.id,
        filename: file.filename,
        url: `/api/upload/file/${file.id}` 
      }
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'Internal server error during secure upload' });
  }
};

// Serve Secure File (Decrypt on-the-fly)
exports.getFile = async (req, res) => {
  try {
    const { id } = req.params;

    const file = await prisma.file.findUnique({
      where: { id },
      include: { report: { include: { program: true } } }
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Authorization Logic
    const userId = req.user.id;
    const role = req.user.role;
    let hasAccess = false;

    if (file.uploaderId === userId) hasAccess = true;
    else if (file.report) {
      const report = file.report;
      if (role === 'RESEARCHER' && report.researcherId === userId) hasAccess = true;
      if (role === 'COMPANY_ADMIN' && report.program.companyId === userId) hasAccess = true;
      if (['ADMIN', 'SUPER_ADMIN', 'TRIAGER'].includes(role)) hasAccess = true;
    } 

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const filePath = path.join(__dirname, '../../uploads', file.path);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    // 1. Read Encrypted Content
    const encryptedContent = fs.readFileSync(filePath);

    // 2. Decrypt Content
    const decryptedContent = cryptoService.decrypt(encryptedContent);

    // 3. Stream to User
    res.setHeader('Content-Type', file.mimetype);
    res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
    res.send(decryptedContent);

  } catch (error) {
    console.error('Get File Error:', error);
    res.status(500).json({ message: 'Internal server error during decryption' });
  }
};
