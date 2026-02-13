const prisma = require('../utils/prisma');
const auditService = require('../services/audit.service');

// Get statistics for company dashboard
exports.getCompanyStats = async (req, res) => {
  try {
    const companyId = req.user.id;

    const [programCount, reportCount, criticalCount, recentReports] = await Promise.all([
      prisma.program.count({ where: { companyId } }),
      prisma.report.count({ where: { program: { companyId } } }),
      prisma.report.count({ where: { program: { companyId }, severity: 'CRITICAL' } }),
      prisma.report.findMany({
        where: { program: { companyId } },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          program: { select: { name: true } },
          researcher: { select: { firstName: true, email: true } }
        }
      })
    ]);

    res.json({
      programCount,
      reportCount,
      criticalCount,
      recentReports
    });
  } catch (error) {
    console.error('Get Company Stats Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Stub for Company Verification flow
exports.verifyCompany = async (req, res) => {
  try {
    // In a real app, this would handle document uploads/KYC
    await auditService.record({
      action: 'COMPANY_VERIFICATION_INITIATED',
      userId: req.user.id,
      ipAddress: req.ip
    });
    res.json({ message: 'Verification documents received and are under review.' });
  } catch (error) {
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
    const companyId = req.user.id;

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
    const companyId = req.user.id;

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
    const companyId = req.user.id;

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
