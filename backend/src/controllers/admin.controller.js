const prisma = require('../utils/prisma');
const emailService = require('../services/email.service');
const slaService = require('../services/sla.service');
const auditService = require('../services/audit.service');
const notificationService = require('../services/notification.service');


// Get statistics for admin dashboard
exports.getAdminStats = async (req, res) => {
  try {
    const [bountySum, totalResearchers, totalCompanies, reportsCount, activeProgramsCount, pendingApprovalsCount, latestActivity, allReports] = await Promise.all([
      // Sum of all paid bounties
      prisma.report.aggregate({
        where: { status: 'PAID' },
        _sum: { bountyAmount: true }
      }),
      prisma.user.count({ where: { role: 'RESEARCHER' } }),
      prisma.user.count({ where: { role: 'COMPANY_ADMIN' } }),
      prisma.report.count({ where: { status: { not: 'DRAFT' } } }),
      prisma.program.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { role: { in: ['RESEARCHER', 'COMPANY_ADMIN'] }, isActive: false, isVerified: true } }),
      prisma.report.findMany({
        where: { status: { not: 'DRAFT' } },
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          researcher: { select: { firstName: true, lastName: true, email: true } },
          program: { select: { name: true, slaFirstResponse: true, slaTriage: true } }
        }
      }),
      prisma.report.findMany({
        where: { status: { not: 'DRAFT' } },
        include: { program: true }
      })
    ]);

    const slaMetrics = slaService.calculateMetrics(allReports);

    res.json({
      totalBounties: `$${(bountySum._sum.bountyAmount || 0).toLocaleString()}`,
      totalResearchers,
      totalCompanies,
      reportsFiled: reportsCount,
      activePrograms: activeProgramsCount,
      pendingApprovals: pendingApprovalsCount,
      latestActivity,
      slaCompliance: slaMetrics.complianceRate
    });
  } catch (error) {
    console.error('Get Admin Stats Error:', error);
    console.error('User:', req.user?.id, 'Role:', req.user?.role, 'ParentId:', req.user?.parentId);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get detailed SLA metrics
exports.getSlaStats = async (req, res) => {
  try {
    const allReports = await prisma.report.findMany({
      where: { status: { not: 'DRAFT' } },
      include: { program: true }
    });

    const metrics = slaService.calculateMetrics(allReports);
    
    // Add breached reports list
    const breachedReports = allReports.filter(r => slaService.isBreached(r, 'firstResponse'))
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
    console.error('Get SLA Stats Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// Get all researchers
exports.getResearchers = async (req, res) => {
  try {
    const researchers = await prisma.user.findMany({
      where: { role: 'RESEARCHER' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { reports: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(researchers);
  } catch (error) {
    console.error('Get Researchers Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all companies
exports.getCompanies = async (req, res) => {
  try {
    const companies = await prisma.user.findMany({
      where: { role: 'COMPANY_ADMIN' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        assignedTriagerId: true,
        assignedTriager: {
          select: { id: true, firstName: true, lastName: true }
        },
        _count: {
          select: { programs: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(companies);
  } catch (error) {
    console.error('Get Companies Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all triagers
exports.getTriagers = async (req, res) => {
  try {
    const triagers = await prisma.user.findMany({
      where: { role: 'TRIAGER' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isVerified: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(triagers);
  } catch (error) {
    console.error('Get Triagers Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create new triager account
exports.createTriager = async (req, res) => {
  try {
    const { email, firstName, lastName, password } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Use provided password or generate temporary one
    const bcrypt = require('bcrypt');
    const finalPassword = password || Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(finalPassword, 10);

    // Create triager user
    const triager = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        passwordHash,
        role: 'TRIAGER',
        isVerified: true, // Auto-verify admin-created accounts
        isActive: true // Default to active
      }
    });

    console.log(`Triager created: ${email} | Password: ${finalPassword}`);

    res.status(201).json({
      message: 'Triager account created successfully',
      triager: {
        id: triager.id,
        email: triager.email,
        firstName: triager.firstName,
        lastName: triager.lastName
      }
    });
  } catch (error) {
    console.error('Create Triager Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update triager password
exports.updateTriagerPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Verify triager exists
    const triager = await prisma.user.findUnique({ where: { id } });
    if (!triager || triager.role !== 'TRIAGER') {
      return res.status(404).json({ message: 'Triager not found' });
    }

    // Hash new password
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash(password, 10);

    // Update password
    await prisma.user.update({
      where: { id },
      data: { passwordHash }
    });

    console.log(`Triager password updated: ${triager.email}`);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update Triager Password Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Assign a triager to a company
exports.assignTriagerToCompany = async (req, res) => {
  try {
    const { id } = req.params; // Company User ID
    const { triagerId } = req.body;

    // Verify company exists
    const company = await prisma.user.findFirst({ 
      where: { id, role: 'COMPANY_ADMIN' } 
    });
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Verify triager exists (if provided)
    if (triagerId) {
      const triager = await prisma.user.findFirst({
        where: { id: triagerId, role: { in: ['TRIAGER', 'ADMIN', 'SUPER_ADMIN'] } }
      });
      if (!triager) {
        return res.status(404).json({ message: 'Valid triager not found' });
      }
    }

    // Update assignment
    const updatedCompany = await prisma.user.update({
      where: { id },
      data: { assignedTriagerId: triagerId || null }
    });

    const auditService = require('../services/audit.service');
    await auditService.record({
      action: 'COMPANY_TRIAGER_ASSIGNED',
      userId: req.user.id,
      details: { companyId: id, triagerId },
      ipAddress: req.ip
    });

    res.json({ 
      message: triagerId ? 'Triager assigned to company' : 'Triager unassigned from company',
      company: updatedCompany 
    });
  } catch (error) {
    console.error('Assign Triager Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Bulk Assign a triager to multiple companies
exports.bulkAssignTriagerToCompanies = async (req, res) => {
  try {
    const { companyIds, triagerId } = req.body;

    if (!Array.isArray(companyIds) || companyIds.length === 0) {
      return res.status(400).json({ message: 'Invalid company IDs' });
    }

    // Verify triager exists (if provided)
    if (triagerId) {
      const triager = await prisma.user.findFirst({
        where: { id: triagerId, role: { in: ['TRIAGER', 'ADMIN', 'SUPER_ADMIN'] } }
      });
      if (!triager) {
        return res.status(404).json({ message: 'Valid triager not found' });
      }
    }

    // Update assignment for all selected companies
    await prisma.user.updateMany({
      where: { 
        id: { in: companyIds },
        role: 'COMPANY_ADMIN'
      },
      data: { assignedTriagerId: triagerId || null }
    });

    await auditService.record({
      action: 'BULK_COMPANY_TRIAGER_ASSIGNED',
      userId: req.user.id,
      details: { count: companyIds.length, triagerId },
      ipAddress: req.ip
    });

    res.json({ 
      message: `Triager ${triagerId ? 'assigned to' : 'unassigned from'} ${companyIds.length} companies`
    });
  } catch (error) {
    console.error('Bulk Assign Triager Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// Toggle user active status (for all roles)
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Find user
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update active status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: isActive !== undefined ? isActive : !user.isActive }
    });

    res.json({ 
      message: `User ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: updatedUser.isActive
    });
  } catch (error) {
    console.error('Toggle User Status Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Permanent user deletion (with related data cleanup)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Verify user exists
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. Prevent self-deletion
    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    console.log(`Deleting user: ${user.email} (ID: ${user.id})`);

    // 3. Delete related data to satisfy foreign key constraints
    await prisma.$transaction([
      prisma.auditLog.deleteMany({ where: { userId: id } }),
      prisma.refreshToken.deleteMany({ where: { userId: id } }),
      prisma.report.deleteMany({ where: { researcherId: id } }),
      prisma.program.deleteMany({ where: { companyId: id } }),
      // Finally delete the user
      prisma.user.delete({ where: { id } })
    ]);

    console.log(`User deleted successfully: ${user.email}`);

    res.json({ message: 'User and all related data deleted successfully' });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Invite a new company (generates token and sends email)
exports.inviteCompany = async (req, res) => {
  try {
    const { email } = req.body;
    const crypto = require('crypto');

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    // Check if an invitation already exists (used or expired)
    let invite = await prisma.invitation.findUnique({ where: { email } });

    if (invite) {
      if (!invite.used && invite.expiresAt > new Date()) {
        // Invite is still valid and pending, just resend it
        console.log(`Resending valid invitation to ${email}`);
      } else {
        // Invite is used or expired, regenerate token and reset expiresAt
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours
        invite = await prisma.invitation.update({
          where: { email },
          data: { token, expiresAt, used: false }
        });
      }
    } else {
      // Create new invitation
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

      invite = await prisma.invitation.create({
        data: {
          email,
          token,
          role: 'COMPANY_ADMIN',
          expiresAt
        }
      });
    }

    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/register-company?token=${invite.token}`;
    
    try {
      await emailService.sendInvitationEmail(email, inviteUrl, req.body.message);
      console.log(`✅ Invitation email sent to ${email}`);
    } catch (emailErr) {
      console.error('❌ Invitation email failed (but invite token was created):', emailErr.message);
      // Don't return error — invitation is saved in DB, admin can resend
    }

    res.json({ message: 'Invitation sent successfully', inviteUrl });
  } catch (error) {
    console.error('Invite Company Error:', error);
    res.status(500).json({ message: 'Internal server error', detail: error.message });
  }
};

// --- Admin Team Management (Employees) ---

// Get all admins managed by the current admin
exports.getAdminTeam = async (req, res) => {
  try {
    const members = await prisma.user.findMany({
      where: { 
        parentId: req.user.id,
        role: 'ADMIN'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        customRole: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(members);
  } catch (error) {
    console.error('Get Admin Team Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create a new sub-admin (employee)
exports.createAdminMember = async (req, res) => {
  try {
    const { email, firstName, lastName, password, customRoleId } = req.body;
    const parentId = req.user.id;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 12);

    const member = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        passwordHash: hashedPassword,
        role: 'ADMIN',
        parentId,
        customRoleId: customRoleId || null,
        isVerified: true,
        isActive: true
      }
    });

    await auditService.record({
      action: 'ADMIN_MEMBER_CREATED',
      userId: parentId,
      details: { memberEmail: email, roleId: customRoleId },
      ipAddress: req.ip
    });

    res.status(201).json({
      message: 'Admin team member created successfully',
      member: {
        id: member.id,
        email: member.email,
        firstName: member.firstName,
        lastName: member.lastName
      }
    });
  } catch (error) {
    console.error('Create Admin Member Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update an existing admin member
exports.updateAdminMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, password, customRoleId } = req.body;
    const parentId = req.user.id;

    // Verify member belongs to this admin or verify super admin
    const member = await prisma.user.findUnique({ where: { id } });
    if (!member || (member.parentId !== parentId && req.user.role !== 'SUPER_ADMIN')) {
      return res.status(403).json({ message: 'Not authorized to update this member' });
    }

    const data = {
      email,
      firstName,
      lastName,
      customRoleId: customRoleId || null
    };

    if (password) {
      const bcrypt = require('bcrypt');
      data.passwordHash = await bcrypt.hash(password, 12);
    }

    const updatedMember = await prisma.user.update({
      where: { id },
      data
    });

    await auditService.record({
      action: 'ADMIN_MEMBER_UPDATED',
      userId: parentId,
      details: { memberEmail: email, memberId: id },
      ipAddress: req.ip
    });

    res.json({
      message: 'Admin member updated successfully',
      member: {
        id: updatedMember.id,
        email: updatedMember.email,
        firstName: updatedMember.firstName,
        lastName: updatedMember.lastName
      }
    });
  } catch (error) {
    console.error('Update Admin Member Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Toggle active status for a specific admin team member
exports.toggleAdminMemberStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const parentId = req.user.id;

    // Verify member belongs to this admin or verify super admin
    const member = await prisma.user.findUnique({ where: { id } });
    if (!member || (member.parentId !== parentId && req.user.role !== 'SUPER_ADMIN')) {
      return res.status(403).json({ message: 'Not authorized to manage this member' });
    }

    const updatedMember = await prisma.user.update({
      where: { id },
      data: { isActive: !member.isActive }
    });

    res.json({
      message: `Member ${updatedMember.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: updatedMember.isActive
    });
  } catch (error) {
    console.error('Toggle Admin Member Status Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get list of users waiting for admin approval
exports.getPendingApprovals = async (req, res) => {
  try {
    const [pendingUsers, pendingKyb] = await Promise.all([
      prisma.user.findMany({
        where: { 
          role: { in: ['RESEARCHER', 'COMPANY_ADMIN'] },
          isActive: false,
          isVerified: true 
        },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true }
      }),
      prisma.user.findMany({
        where: { kybStatus: 'PENDING' },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true, kybStatus: true }
      })
    ]);

    res.json({ users: pendingUsers, kyb: pendingKyb });
  } catch (error) {
    console.error('Get Pending Approvals Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Approve a user account
exports.approveUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    await prisma.user.update({
      where: { id },
      data: { isActive: true }
    });

    // Send approval welcome email
    try {
      await emailService.sendApprovalEmail(user.email);
    } catch (emailErr) {
      console.error('Approval email send failed:', emailErr.message);
      // Don't block the response — approval is already done
    }

    // Also create in-app notification for the approved user
    await notificationService.notifyUser(
      user.id,
      '🎉 Account Approved!',
      'Congratulations! Your account has been approved. You can now log in and start using XploitArena.',
      'SUCCESS'
    );

    res.json({ message: 'User approved and notified' });
  } catch (error) {
    console.error('Approve User Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Approve Company KYB
exports.approveKyb = async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.user.update({
      where: { id },
      data: { kybStatus: 'VERIFIED' }
    });

    res.json({ message: 'Company KYB approved successfully' });
  } catch (error) {
    console.error('Approve KYB Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Reject Company KYB
exports.rejectKyb = async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.user.update({
      where: { id },
      data: { kybStatus: 'REJECTED' }
    });

    res.json({ message: 'Company KYB rejected' });
  } catch (error) {
    console.error('Reject KYB Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Bulk toggle user status
exports.bulkToggleUserStatus = async (req, res) => {
  try {
    const { userIds, isActive } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'Invalid user IDs' });
    }

    await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { isActive: !!isActive }
    });

    await auditService.record({
      action: 'BULK_USER_STATUS_TOGGLE',
      userId: req.user.id,
      details: { count: userIds.length, isActive: !!isActive },
      ipAddress: req.ip
    });

    res.json({ message: `Status updated for ${userIds.length} users` });
  } catch (error) {
    console.error('Bulk Toggle Status Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
// Get platform-wide audit logs with pagination
exports.getAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              role: true
            }
          },
          report: {
            select: {
              title: true
            }
          }
        }
      }),
      prisma.auditLog.count()
    ]);

    res.json({
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get Admin Audit Logs Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// M1.6.1: Global Admin Search (Expanded)
exports.globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const [users, reports, programs, companies, auditLogs, customRoles] = await Promise.all([
      // 1. Users (Researchers, Admins, etc.)
      prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: q, mode: 'insensitive' } },
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } }
          ],
          NOT: { role: 'COMPANY_ADMIN' }
        },
        select: { id: true, email: true, firstName: true, lastName: true, role: true },
        take: 5
      }),
      // 2. Reports
      prisma.report.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { id: { contains: q, mode: 'insensitive' } }
          ]
        },
        select: { id: true, title: true, status: true, severity: true },
        take: 5
      }),
      // 3. Programs
      prisma.program.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } }
          ]
        },
        select: { id: true, name: true, status: true, type: true },
        take: 5
      }),
      // 4. Companies (Users with COMPANY_ADMIN role)
      prisma.user.findMany({
        where: {
          role: 'COMPANY_ADMIN',
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } }
          ]
        },
        select: { id: true, firstName: true, email: true },
        take: 5
      }),
      // 5. Audit Logs
      prisma.auditLog.findMany({
        where: {
          OR: [
            { action: { contains: q.toUpperCase(), mode: 'insensitive' } },
            { details: { contains: q, mode: 'insensitive' } }
          ]
        },
        select: { id: true, action: true, createdAt: true },
        take: 5
      }),
      // 6. Custom Roles
      prisma.customRole.findMany({
        where: { name: { contains: q, mode: 'insensitive' } },
        select: { id: true, name: true },
        take: 5
      })
    ]);

    res.json({ 
      users, 
      reports, 
      programs, 
      companies, 
      auditLogs,
      customRoles
    });
  } catch (error) {
    console.error('Global Search Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// M1.4.6: CSV/JSON Export for Audit Logs
exports.exportAuditLogs = async (req, res) => {
  try {
    const { format } = req.query; // 'csv' or 'json'
    
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
        report: { select: { title: true } }
      }
    });

    if (format === 'csv') {
      const header = 'Timestamp,Action,User,Email,Resource,Details,IP Address\n';
      const rows = logs.map(log => {
        const timestamp = new Date(log.createdAt).toISOString();
        const action = log.action;
        const userName = log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System';
        const userEmail = log.user ? log.user.email : 'N/A';
        const resource = log.report ? log.report.title : 'General';
        const details = (log.details || '').replace(/"/g, '""');
        const ip = log.ipAddress || 'unknown';
        return `"${timestamp}","${action}","${userName}","${userEmail}","${resource}","${details}","${ip}"`;
      }).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
      return res.send(header + rows);
    }

    // Default to JSON
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.json');
    res.json(logs);

  } catch (error) {
    console.error('Export Audit Logs Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// M1.6.5 & M1.6.6: Advanced Filters & CSV Export for all lists
exports.exportData = async (req, res) => {
  try {
    const { type } = req.params;
    let data = [];
    let header = '';
    let rows = [];

    if (type === 'researchers') {
      data = await prisma.user.findMany({
        where: { role: 'RESEARCHER' },
        include: { _count: { select: { reports: true } } },
        orderBy: { createdAt: 'desc' },
      });
      header = 'ID,First Name,Last Name,Email,Status,Verified,Registered At,Total Reports\n';
      rows = data.map(u => `"${u.id}","${u.firstName}","${u.lastName}","${u.email}","${u.isActive ? 'Active' : 'Inactive'}","${u.isVerified}","${u.createdAt.toISOString()}","${u._count.reports}"`);
    } else if (type === 'companies') {
      data = await prisma.user.findMany({
        where: { role: 'COMPANY_ADMIN' },
        include: { _count: { select: { programs: true } } },
        orderBy: { createdAt: 'desc' },
      });
      header = 'ID,Company Name,Contact Email,Status,KYB Status,Registered At,Total Programs\n';
      rows = data.map(u => `"${u.id}","${u.firstName}","${u.email}","${u.isActive ? 'Active' : 'Inactive'}","${u.kybStatus || 'UNVERIFIED'}","${u.createdAt.toISOString()}","${u._count.programs}"`);
    } else if (type === 'reports') {
      data = await prisma.report.findMany({
        include: { researcher: true, program: { include: { company: true } } },
        orderBy: { createdAt: 'desc' },
      });
      header = 'Report ID,Title,Severity,Status,Program Name,Company Email,Researcher Email,Bounty Amount,Submitted At\n';
      rows = data.map(r => `"${r.id}","${r.title.replace(/"/g, '""')}","${r.severity}","${r.status}","${r.program?.name || 'N/A'}","${r.program?.company?.email || 'N/A'}","${r.researcher?.email || 'N/A'}","${r.bountyAmount || 0}","${r.createdAt.toISOString()}"`);
    } else {
      return res.status(400).json({ message: 'Invalid export type. Supported types: researchers, companies, reports.' });
    }

    const csvContent = header + rows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-export.csv`);
    return res.send(csvContent);

  } catch (error) {
    console.error('Data Export Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
