const prisma = require('../utils/prisma');
const auditService = require('../services/audit.service');

// Submit a new report
exports.submitReport = async (req, res) => {
  try {
    const { title, description, severity, programId, asset, category, cvss, impact, status } = req.body;
    const researcherId = req.user.id;

    const report = await prisma.report.create({
      data: {
        title,
        description,
        severity,
        programId,
        researcherId,
        asset,
        category,
        cvss: cvss ? parseFloat(cvss) : null,
        impact,
        status: status === 'DRAFT' ? 'DRAFT' : 'SUBMITTED',
      },
      include: {
        program: { select: { name: true } }
      }
    });

    await auditService.record({
      action: 'REPORT_SUBMITTED',
      userId: researcherId,
      reportId: report.id,
      details: { title: report.title, program: report.program.name },
      ipAddress: req.ip
    });

    res.status(201).json({
      message: 'Report submitted successfully',
      report,
    });
  } catch (error) {
    console.error('Submit Report Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get reports for logged-in researcher (Isolation ensured by researcherId)
exports.getMyReports = async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      where: { researcherId: req.user.id },
      include: {
        program: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(reports);
  } catch (error) {
    console.error('Get My Reports Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get single report with strict tenant isolation
exports.getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        program: true,
        researcher: { select: { firstName: true, email: true } }
      }
    });

    if (!report) return res.status(404).json({ message: 'Report not found' });

    // Isolation Logic
    const isResearcher = req.user.role === 'RESEARCHER' && report.researcherId === req.user.id;
    const isCompany = req.user.role === 'COMPANY_ADMIN' && report.program.companyId === req.user.id;
    const isInternal = ['ADMIN', 'SUPER_ADMIN', 'TRIAGER'].includes(req.user.role);

    if (!isResearcher && !isCompany && !isInternal) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(report);
  } catch (error) {
    console.error('Get Report Detail Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get reports for a program (Strict Company isolation)
exports.getProgramReports = async (req, res) => {
  try {
    const { programId } = req.params;
    
    const program = await prisma.program.findUnique({ where: { id: programId } });

    if (!program || (req.user.role === 'COMPANY_ADMIN' && program.companyId !== req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const reports = await prisma.report.findMany({
      where: { programId },
      include: {
        researcher: { select: { firstName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(reports);
  } catch (error) {
    console.error('Get Program Reports Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update Report Status (Triagers/Admins/Company Admins)
exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const report = await prisma.report.findUnique({
      where: { id },
      include: { program: true }
    });

    if (!report) return res.status(404).json({ message: 'Report not found' });

    // Permissions
    const isCompany = req.user.role === 'COMPANY_ADMIN' && report.program.companyId === req.user.id;
    const isInternal = ['ADMIN', 'SUPER_ADMIN', 'TRIAGER'].includes(req.user.role);

    if (!isCompany && !isInternal) {
      return res.status(403).json({ message: 'Access denied to update status' });
    }

    const updateData = { status };
    
    // SLA Tracking
    if (status === 'TRIAGING' && report.status !== 'TRIAGING') {
      updateData.triagedAt = new Date();
    }
    if (status === 'RESOLVED' && report.status !== 'RESOLVED') {
      updateData.resolvedAt = new Date();
    }

    const updatedReport = await prisma.report.update({
      where: { id },
      data: updateData
    });

    await auditService.record({
      action: 'REPORT_STATUS_CHANGE',
      userId: req.user.id,
      reportId: id,
      details: { from: report.status, to: status },
      ipAddress: req.ip
    });

    res.json({ message: 'Status updated', report: updatedReport });
  } catch (error) {
    console.error('Update Status Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all reports for Triage (Admin/Triager only)
exports.getAllReports = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    const reports = await prisma.report.findMany({
      where,
      include: {
        program: { select: { name: true } },
        researcher: { select: { firstName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const stats = {
      pending: await prisma.report.count({ where: { status: 'SUBMITTED' } }),
      triaging: await prisma.report.count({ where: { status: 'TRIAGING' } }),
      resolved: await prisma.report.count({ where: { status: 'RESOLVED' } }),
      critical: await prisma.report.count({ where: { severity: 'CRITICAL' } }),
    };

    res.json({ reports, stats });
  } catch (error) {
    console.error('Get All Reports Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Pay Bounty (Deduct from Budget)
exports.payBounty = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body; // Bounty amount to pay

    const report = await prisma.report.findUnique({
      where: { id },
      include: { program: true }
    });

    if (!report) return res.status(404).json({ message: 'Report not found' });

    // Isolation Check
    if (report.program.companyId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check Budget
    if (report.program.budgetTotal) {
      const remaining = report.program.budgetTotal - report.program.budgetSpent;
      if (amount > remaining) {
        return res.status(400).json({ message: 'Insufficient program budget' });
      }
    }

    // Perform Transaction
    await prisma.$transaction(async (prisma) => {
      // Update Report
      await prisma.report.update({
        where: { id },
        data: {
          status: 'PAID',
          bountyAmount: parseFloat(amount),
          resolvedAt: new Date(), // Assuming payment happens at resolution or shortly after
        }
      });

      // Update Program Budget
      await prisma.program.update({
        where: { id: report.programId },
        data: {
          budgetSpent: { increment: parseFloat(amount) }
        }
      });
    });

    await auditService.record({
      action: 'BOUNTY_PAID',
      userId: req.user.id,
      reportId: id,
      details: { amount: amount },
      ipAddress: req.ip
    });

    res.json({ message: 'Bounty paid successfully' });
  } catch (error) {
    console.error('Pay Bounty Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
// Update a report (Researcher only, typically for drafts)
exports.updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, severity, status } = req.body;

    const report = await prisma.report.findUnique({
      where: { id },
      include: { program: true }
    });

    if (!report) return res.status(404).json({ message: 'Report not found' });

    // Isolation: Only the researcher who created the draft can update it
    if (report.researcherId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // prevent changing submitted reports (except if transitioning from DRAFT to SUBMITTED)
    if (report.status !== 'DRAFT' && status !== 'SUBMITTED') {
      // Allow minor updates if needed? For now, let's keep it strict: only DRAFTs are editable by researcher
      return res.status(400).json({ message: 'Only drafts can be edited' });
    }

    const updatedReport = await prisma.report.update({
      where: { id },
      data: {
        title,
        description,
        severity,
        status: status === 'SUBMITTED' ? 'SUBMITTED' : report.status,
      }
    });

    await auditService.record({
      action: 'REPORT_UPDATED',
      userId: req.user.id,
      reportId: id,
      details: { title: updatedReport.title, status: updatedReport.status },
      ipAddress: req.ip
    });

    res.json({ message: 'Report updated successfully', report: updatedReport });
  } catch (error) {
    console.error('Update Report Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
