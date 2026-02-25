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
    console.log('Get file request for ID:', id);
    console.log('User authenticated:', req.user ? `user ID: ${req.user.id}` : 'NO');

    const file = await prisma.file.findUnique({
      where: { id },
      include: { report: { include: { program: true } } }
    });

    console.log('File found:', file ? file.filename : 'NOT FOUND');
    console.log('File reportId:', file?.reportId);
    console.log('Report attached (via include):', file?.report ? 'YES' : 'NO');
    console.log('Mimetype:', file?.mimetype);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // ---- Public branding/static assets (files not attached to a report) ----
    // Check both file.reportId and file.report to be safe
    if (!file.reportId && !file.report) {
      console.log('Serving PUBLIC file (no report attached):', file.filename);
      const filePathPublic = path.join(__dirname, '../../uploads', file.path);
      console.log('File path:', filePathPublic);
      if (!fs.existsSync(filePathPublic)) {
        console.log('File not found on disk:', filePathPublic);
        return res.status(404).json({ message: 'File not found on server' });
      }
      try {
        const encryptedContentPublic = fs.readFileSync(filePathPublic);
        const decryptedContentPublic = cryptoService.decrypt(encryptedContentPublic);
        res.setHeader('Content-Type', file.mimetype);
        res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
        console.log('Successfully serving public file, size:', decryptedContentPublic.length);
        return res.send(decryptedContentPublic);
      } catch (decryptError) {
        console.error('Decryption error for public file:', decryptError);
        return res.status(500).json({ message: 'Error decrypting file' });
      }
    }

    // ---- Protected files attached to a report ----
    // For public access without auth, return 401
    console.log('File has report, checking auth. req.user:', req.user ? 'exists' : 'none');
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

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
