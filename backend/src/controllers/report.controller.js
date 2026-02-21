const prisma = require('../utils/prisma');
const auditService = require('../services/audit.service');
const emailService = require('../services/email.service');
const notificationService = require('../services/notification.service');

// Submit a new report
exports.submitReport = async (req, res) => {
  try {
    const { title, description, severity, programId, asset, category, cvss, impact, status } = req.body;
    const researcherId = req.user.id;

    if (!programId) {
      return res.status(400).json({ message: 'Target program is required' });
    }

    if (!title || !description) {
       return res.status(400).json({ message: 'Title and description are required' });
    }

    // Check if program is part of an active event
    const program = await prisma.program.findUnique({
      where: { id: programId },
      include: { 
        event: true,
        company: { select: { assignedTriagerId: true } }
      }
    });

    // Prevent submissions to paused/closed programs
    if (program && program.status && program.status !== 'ACTIVE') {
      return res.status(400).json({ message: `Program is not accepting submissions (${program.status}).` });
    }

    // Prevent submissions when program budget is exhausted
    if (status !== 'DRAFT' && program && program.budgetTotal && program.budgetSpent >= program.budgetTotal) {
      return res.status(400).json({ message: 'Program budget exhausted. Submissions are currently disabled.' });
    }

    let eventId = null;
    if (program && program.eventId && program.event) {
      const now = new Date();
      if (now >= program.event.startDate && now <= program.event.endDate) {
        eventId = program.eventId;
      }
    }

    const report = await prisma.report.create({
      data: {
        title,
        description,
        severity,
        programId,
        researcherId,
        eventId, // Auto-tag event
        triagerId: program?.company?.assignedTriagerId || null, // Auto-assign static triager
        asset,
        category,
        cvss: cvss ? parseFloat(cvss) : null,
        impact,
        status: status === 'DRAFT' ? 'DRAFT' : 'SUBMITTED',
      },
      include: {
        program: { select: { name: true, companyId: true } }
      }
    });

    await auditService.record({
      action: 'REPORT_SUBMITTED',
      userId: researcherId,
      reportId: report.id,
      details: { title: report.title, program: report.program.name, eventId },
      ipAddress: req.ip
    });

    await notificationService.notifyCompanyAdmins(
      program.companyId,
      'New Report Submitted',
      `A new report "${report.title}" was submitted to ${report.program.name}.`,
      'INFO',
      report.id
    );

    res.status(201).json({
      message: 'Report submitted successfully',
      report,
    });
  } catch (error) {
    console.error('Submit Report Error:', error);
    res.status(500).json({ message: 'Internal server error', detail: error.message });
  }
};

// Get reports for logged-in researcher (Isolation ensured by researcherId)
exports.getMyReports = async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      where: { researcherId: req.user.id },
      include: {
        program: { select: { name: true, slaFirstResponse: true, slaTriage: true } },
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
    // Fix: Allow sub-accounts to view reports if they belong to the company
    const effectiveCompanyId = req.user.parentId || req.user.id;
    const isCompany = req.user.role === 'COMPANY_ADMIN' && report.program.companyId === effectiveCompanyId;
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

    if (!program) return res.status(404).json({ message: 'Program not found' });
    
    const effectiveCompanyId = req.user.parentId || req.user.id;
    if (req.user.role === 'COMPANY_ADMIN' && program.companyId !== effectiveCompanyId) {
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
    const effectiveCompanyId = req.user.parentId || req.user.id;
    const isCompany = req.user.role === 'COMPANY_ADMIN' && report.program.companyId === effectiveCompanyId;
    const isInternal = ['ADMIN', 'SUPER_ADMIN', 'TRIAGER'].includes(req.user.role);

    if (!isCompany && !isInternal) {
      return res.status(403).json({ message: 'Access denied to update status' });
    }

    const updateData = { status };
    
    // SLA Tracking: First Response
    // If it was SUBMITTED and now moving to something else (TRIAGING, etc.), log first response
    if (report.status === 'SUBMITTED' && !report.firstRespondedAt) {
      updateData.firstRespondedAt = new Date();
    }

    // SLA Tracking: Triage
    // If it reaches a "triage-decided" state
    const triageStatuses = ['TRIAGING', 'ACCEPTED', 'REJECTED', 'DUPLICATE', 'READY_FOR_PAYOUT'];
    if (triageStatuses.includes(status) && !report.triagedAt) {
      updateData.triagedAt = new Date();
    }

    // SLA Tracking: Resolution
    if ((status === 'RESOLVED' || status === 'PAID') && !report.resolvedAt) {
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

    await notificationService.notifyUser(
      report.researcherId,
      `Report Status Changed: ${status}`,
      `Your report "${report.title}" has been moved to ${status}.`,
      'REPORT_UPDATE',
      report.id
    );

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
      include: { 
        program: {
          include: { company: true }
        },
        team: {
          include: { members: true }
        }
      }
    });

    if (!report) return res.status(404).json({ message: 'Report not found' });

    // Isolation Check
    const effectiveCompanyId = req.user.parentId || req.user.id;
    if (report.program.companyId !== effectiveCompanyId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check Budget & Triger Alerts
    if (report.program.budgetTotal) {
      const newSpent = report.program.budgetSpent + parseFloat(amount);
      const usagePercent = (newSpent / report.program.budgetTotal) * 100;
      const companyEmail = report.program.company.email;
      
      const updateFlags = {};
      let alertToSend = null;

      if (usagePercent >= 100 && !report.program.budgetAlert100Sent) {
        updateFlags.budgetAlert100Sent = true;
        alertToSend = 100;
      } else if (usagePercent >= 90 && !report.program.budgetAlert90Sent) {
        updateFlags.budgetAlert90Sent = true;
        alertToSend = 90;
      } else if (usagePercent >= 75 && !report.program.budgetAlert75Sent) {
        updateFlags.budgetAlert75Sent = true;
        alertToSend = 75;
      }

      // Hard stop: prevent paying if this payment would exceed the program budget
      if (report.program.budgetTotal && newSpent > report.program.budgetTotal) {
        return res.status(400).json({ message: 'Cannot pay bounty: program budget would be exceeded.' });
      }

      if (alertToSend) {
        try {
          await emailService.sendBudgetAlertEmail(
            companyEmail,
            report.program.name,
            alertToSend,
            report.program.budgetTotal - newSpent
          );
        } catch (err) {
          console.error('Budget Alert Email Error:', err);
        }
      }

      // Update in transaction
      await prisma.$transaction(async (tx) => {
        await tx.report.update({
          where: { id },
          data: {
            status: 'PAID',
            bountyAmount: parseFloat(amount),
            resolvedAt: new Date(),
          }
        });

        // If usage >= 100% after this payment, auto-pause the program to enforce hard-stop
        const programUpdateData = {
          budgetSpent: { increment: parseFloat(amount) },
          ...updateFlags,
          ...(usagePercent >= 100 ? { status: 'PAUSED' } : {})
        };

        await tx.program.update({
          where: { id: report.programId },
          data: programUpdateData
        });
        
        // Bounty Splitting Logic
        if (report.teamId && report.team) {
           for (const member of report.team.members) {
             const memberShareAmount = (parseFloat(amount) * member.share) / 100;
             await auditService.record({
               action: 'BOUNTY_SPLIT_RECORDED',
               userId: member.userId,
               reportId: id,
               details: { teamId: report.teamId, amount: memberShareAmount, share: member.share },
               ipAddress: 'SYSTEM'
             }, tx);
           }
        }
      });
    } else {
      // No budget total set, just pay
      await prisma.report.update({
        where: { id },
        data: {
          status: 'PAID',
          bountyAmount: parseFloat(amount),
          resolvedAt: new Date(),
        }
      });
    }

    await auditService.record({
      action: 'BOUNTY_PAID',
      userId: req.user.id,
      reportId: id,
      details: { amount: amount },
      ipAddress: req.ip
    });

    await notificationService.notifyUser(
      report.researcherId,
      'Bounty Awarded! 💰',
      `Congratulations! You have been awarded $${amount} for your report "${report.title}".`,
      'SUCCESS',
      report.id
    );

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

    const updateData = {
      title,
      description,
      severity,
      status: status === 'SUBMITTED' ? 'SUBMITTED' : report.status,
    };

    // If transitioning from DRAFT to SUBMITTED, update the actual submission time
    if (report.status === 'DRAFT' && status === 'SUBMITTED') {
      if (report.program && report.program.budgetTotal && report.program.budgetSpent >= report.program.budgetTotal) {
        return res.status(400).json({ message: 'Program budget exhausted. Submissions are currently disabled.' });
      }
      updateData.submittedAt = new Date();
    }

    const updatedReport = await prisma.report.update({
      where: { id },
      data: updateData
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

// Bulk assign reports to triager
exports.bulkAssignReports = async (req, res) => {
  try {
    const { reportIds, triagerId } = req.body;

    if (!Array.isArray(reportIds) || reportIds.length === 0) {
      return res.status(400).json({ message: 'Invalid report IDs' });
    }

    // Verify triager exists and is a TRIAGER or ADMIN
    if (triagerId) {
      const triager = await prisma.user.findFirst({
        where: { id: triagerId, role: { in: ['TRIAGER', 'ADMIN', 'SUPER_ADMIN'] } }
      });
      if (!triager) return res.status(404).json({ message: 'Valid triager/admin not found' });
    }

    await prisma.report.updateMany({
      where: { id: { in: reportIds } },
      data: { triagerId }
    });

    await auditService.record({
      action: 'BULK_REPORT_ASSIGNMENT',
      userId: req.user.id,
      details: { count: reportIds.length, triagerId },
      ipAddress: req.ip
    });

    res.json({ message: `Successfully assigned ${reportIds.length} reports` });
  } catch (error) {
    console.error('Bulk Assign Reports Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
