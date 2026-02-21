const prisma = require('../utils/prisma');
const auditService = require('../services/audit.service');
const slaService = require('../services/sla.service');

// Get statistics for company dashboard
exports.getCompanyStats = async (req, res) => {
  try {
    // If sub-account, use parent's ID as the owning company
    const companyId = req.user.parentId || req.user.id;

    const [programCount, reportCount, criticalCount, recentReports, severitySpending] = await Promise.all([
      prisma.program.count({ where: { companyId } }),
      prisma.report.count({ where: { program: { companyId } } }),
      prisma.report.count({ where: { program: { companyId }, severity: 'CRITICAL' } }),
      prisma.report.findMany({
        where: { program: { companyId } },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          program: { select: { name: true, slaFirstResponse: true, slaTriage: true, slaResolution: true } },
          researcher: { select: { firstName: true, lastName: true, email: true } }
        }
      }),
      prisma.report.groupBy({
        by: ['severity'],
        where: { program: { companyId }, status: 'PAID' },
        _sum: { bountyAmount: true }
      })
    ]);

    const spendingBySeverity = {
      LOW: severitySpending.find(s => s.severity === 'LOW')?._sum.bountyAmount || 0,
      MEDIUM: severitySpending.find(s => s.severity === 'MEDIUM')?._sum.bountyAmount || 0,
      HIGH: severitySpending.find(s => s.severity === 'HIGH')?._sum.bountyAmount || 0,
      CRITICAL: severitySpending.find(s => s.severity === 'CRITICAL')?._sum.bountyAmount || 0,
    };

    res.json({
      programCount,
      reportCount,
      criticalCount,
      recentReports,
      spendingBySeverity
    });
  } catch (error) {
    console.error('Get Company Stats Error:', error);
    console.error('User:', req.user?.id, 'Role:', req.user?.role, 'ParentId:', req.user?.parentId);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Submit Company Verification (KYB)
exports.verifyCompany = async (req, res) => {
  try {
    const { companyDetails, documentIds } = req.body;
    const userId = req.user.id;

    // Update user status and link documents if needed
    // In this simplified model, we just update the status and record the intent.
    // The documents are already uploaded and linked to the user via uploaderId in File model.
    const user = await prisma.user.update({
      where: { id: userId },
      data: { 
        kybStatus: 'PENDING'
      }
    });

    await auditService.record({
      action: 'COMPANY_KYB_SUBMITTED',
      userId: userId,
      details: { companyDetails, documentCount: documentIds?.length || 0 },
      ipAddress: req.ip
    });

    res.json({ 
      message: 'KYB verification documents submitted successfully. Our team will review them shortly.',
      status: user.kybStatus
    });
  } catch (error) {
    console.error('Verify Company Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Fetch immutable audit logs for the company
exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { userId: req.user.id },
          { report: { program: { companyId: req.user.id } } }
        ]
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, email: true } },
        report: { select: { title: true } }
      }
    });
    res.json(logs);
  } catch (error) {
    console.error('Get Audit Logs Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get SLA metrics for company programs
exports.getSlaStats = async (req, res) => {
  try {
    const companyId = req.user.parentId || req.user.id;
    const reports = await prisma.report.findMany({
      where: { 
        program: { companyId },
        status: { not: 'DRAFT' }
      },
      include: { program: true }
    });

    const metrics = slaService.calculateMetrics(reports);
    
    // Add breached reports for this company
    const breachedReports = reports.filter(r => slaService.isBreached(r, 'firstResponse'))
      .map(r => ({
        id: r.id,
        title: r.title,
        program: r.program.name,
        submittedAt: r.submittedAt,
        deadline: slaService.calculateDeadline(r.submittedAt, r.program.slaFirstResponse)
      }));

    res.json({
      ...metrics,
      breachedReports
    });
  } catch (error) {
    console.error('Get Company SLA Stats Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Export Audit Logs to CSV
exports.exportAuditLogs = async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { userId: req.user.id }, // Actions by the user
          // For Company Admin, potentially actions related to their programs could be added here
          // but strictly sticking to user isolation for now as per previous logic
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true, role: true } }
      }
    });

    const fields = ['id', 'action', 'details', 'ipAddress', 'createdAt', 'user.email', 'user.role'];
    const csvHeader = fields.join(',') + '\n';
    
    const csvRows = logs.map(log => {
      const cleanDetails = log.details ? log.details.replace(/,/g, ';').replace(/\n/g, ' ') : '';
      return [
        log.id,
        log.action,
        `"${cleanDetails}"`,
        log.ipAddress,
        log.createdAt.toISOString(),
        log.user?.email || '',
        log.user?.role || ''
      ].join(',');
    });

    const csvString = csvHeader + csvRows.join('\n');

    res.header('Content-Type', 'text/csv');
    res.attachment('audit-logs.csv');
    return res.send(csvString);

  } catch (error) {
    console.error('Export Audit Logs Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Invite Member to Team
exports.inviteMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    const companyId = req.user.parentId || req.user.id;

    const userToInvite = await prisma.user.findUnique({ where: { email } });

    if (!userToInvite) {
      return res.status(404).json({ message: 'User not found. They must register first.' });
    }

    // Check if already a member
    const existingMember = await prisma.companyMember.findUnique({
      where: {
        companyId_userId: {
          companyId,
          userId: userToInvite.id
        }
      }
    });

    if (existingMember) {
      return res.status(400).json({ message: 'User is already a member of this team.' });
    }

    await prisma.companyMember.create({
      data: {
        companyId,
        userId: userToInvite.id,
        role: role || 'MEMBER'
      }
    });

    await auditService.record({
      action: 'TEAM_MEMBER_INVITED',
      userId: companyId,
      details: { invited: email, role },
      ipAddress: req.ip
    });

    res.json({ message: 'Member invited successfully' });
  } catch (error) {
    console.error('Invite Member Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Remove Member via ID
exports.removeMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const companyId = req.user.parentId || req.user.id;

    await prisma.companyMember.delete({
      where: {
        companyId_userId: {
          companyId,
          userId
        }
      }
    });

    await auditService.record({
      action: 'TEAM_MEMBER_REMOVED',
      userId: companyId,
      details: { removedUserId: userId },
      ipAddress: req.ip
    });

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove Member Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get Team Members
exports.getMembers = async (req, res) => {
  try {
    const companyId = req.user.parentId || req.user.id;

    const members = await prisma.companyMember.findMany({
      where: { companyId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true }
        }
      }
    });

    res.json(members);
  } catch (error) {
    console.error('Get Members Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get aggregated budget trend data for charts
 */
exports.getBudgetTrends = async (req, res) => {
  try {
    const companyId = req.user.parentId || req.user.id;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get all paid reports for this company's programs after startDate
    const reports = await prisma.report.findMany({
      where: {
        program: { companyId },
        status: 'PAID',
        resolvedAt: { gte: startDate }
      },
      select: {
        bountyAmount: true,
        resolvedAt: true
      },
      orderBy: { resolvedAt: 'asc' }
    });

    // Aggregate by date
    const trends = reports.reduce((acc, report) => {
      const date = report.resolvedAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + (report.bountyAmount || 0);
      return acc;
    }, {});

    const trendArray = Object.keys(trends).map(date => ({
      date,
      amount: trends[date]
    })).sort((a, b) => a.date.localeCompare(b.date));

    res.json(trendArray);
  } catch (error) {
    console.error('Get Budget Trends Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
