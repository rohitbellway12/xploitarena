const prisma = require('../utils/prisma');
const auditService = require('../services/audit.service');

// Upload Single File
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { originalname, mimetype, size, filename } = req.file;
    const { reportId } = req.body; // Optional linkage

    const file = await prisma.file.create({
      data: {
        filename: originalname, // Store original name for display
        path: filename,         // Store system name for retrieval
        mimetype,
        size,
        uploaderId: req.user.id,
        reportId: reportId || null
      }
    });

    await auditService.record({
      action: 'FILE_UPLOADED',
      userId: req.user.id,
      details: { filename: originalname, size, type: mimetype },
      ipAddress: req.ip
    });

    res.status(201).json({
      message: 'File uploaded successfully',
      file: {
        id: file.id,
        filename: file.filename,
        url: `/api/upload/file/${file.id}` // Secure access URL
      }
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Serve Secure File
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

    // 1. Uploader always has access
    if (file.uploaderId === userId) hasAccess = true;

    // 2. If linked to a report, check report permissions
    else if (file.report) {
      const report = file.report;
      
      // Researcher (only if they are the report owner) - covered by #1 usually, but double check
      if (role === 'RESEARCHER' && report.researcherId === userId) hasAccess = true;
      
      // Company Admin (if they own the program)
      if (role === 'COMPANY_ADMIN' && report.program.companyId === userId) hasAccess = true;
      
      // Internal Staff
      if (['ADMIN', 'SUPER_ADMIN', 'TRIAGER'].includes(role)) hasAccess = true;
    } 
    
    // 3. Fallback: If not linked to report, maybe strict owner only?
    // For now, if not linked, only uploader can access.

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Stream file
    const path = require('path');
    const fs = require('fs');
    
    const filePath = path.join(__dirname, '../../uploads', file.path);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    res.setHeader('Content-Type', file.mimetype);
    res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
    
    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);

  } catch (error) {
    console.error('Get File Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
