const prisma = require('../utils/prisma');
const auditService = require('../services/audit.service');

// Add a comment to a report
exports.addComment = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { text, isInternal } = req.body;
    const userId = req.user.id;

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: { program: true }
    });

    if (!report) return res.status(404).json({ message: 'Report not found' });

    // Internal Comment Logic
    // Only Company Team, Triagers, Admins can make internal comments
    // Researchers cannot make internal comments (and shouldn't see option)
    if (isInternal && req.user.role === 'RESEARCHER') {
        return res.status(403).json({ message: 'Researchers cannot modify internal visibility' });
    }

    // Permission Check (Can user view report?)
    // Re-use logic from report.controller or just trust protect middleware + basic checks
    // We should be strict.
    const effectiveCompanyId = req.user.parentId || req.user.id;
    const isResearcher = req.user.role === 'RESEARCHER' && report.researcherId === req.user.id;
    const isCompany = req.user.role === 'COMPANY_ADMIN' && report.program.companyId === effectiveCompanyId;
    const isInternalUser = ['ADMIN', 'SUPER_ADMIN', 'TRIAGER'].includes(req.user.role);

    if (!isResearcher && !isCompany && !isInternalUser) {
        return res.status(403).json({ message: 'Access denied' });
    }

    const comment = await prisma.comment.create({
      data: {
        text,
        isInternal: isInternal || false,
        reportId,
        userId
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, role: true, avatar: true } }
      }
    });

    // Audit
    await auditService.record({
      action: 'COMMENT_ADDED',
      userId,
      reportId,
      details: { isInternal },
      ipAddress: req.ip
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Add Comment Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get comments for a report
exports.getComments = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: { program: true }
    });

    if (!report) return res.status(404).json({ message: 'Report not found' });

    // Isolation
    const effectiveCompanyId = req.user.parentId || req.user.id;
    const isResearcher = req.user.role === 'RESEARCHER' && report.researcherId === req.user.id;
    const isCompany = req.user.role === 'COMPANY_ADMIN' && report.program.companyId === effectiveCompanyId;
    const isInternalUser = ['ADMIN', 'SUPER_ADMIN', 'TRIAGER'].includes(req.user.role);

    if (!isResearcher && !isCompany && !isInternalUser) {
        return res.status(403).json({ message: 'Access denied' });
    }

    // Filter Logic
    // Researchers CANNOT see internal comments
    const showInternal = !isResearcher;

    const comments = await prisma.comment.findMany({
      where: {
        reportId,
        ...(showInternal ? {} : { isInternal: false })
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, role: true, avatar: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(comments);

  } catch (error) {
    console.error('Get Comments Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
