const prisma = require('../utils/prisma');
const bcrypt = require('bcrypt');
const auditService = require('../services/audit.service');

// Invite/Create an employee/member
exports.addTeamMember = async (req, res) => {
  try {
    const { email, firstName, lastName, password, roleId, baseRole } = req.body;
    const parentId = req.user.id;

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password || Math.random().toString(36), 12);

    // 3. Create sub-account
    const member = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        passwordHash: hashedPassword,
        parentId,
        role: baseRole || req.user.role, // Usually same context as parent
        customRoleId: roleId || null,
        isVerified: true, // Internal created accounts are auto-verified
        isActive: true
      }
    });

    await auditService.record({
      action: 'TEAM_MEMBER_CREATED',
      userId: parentId,
      details: { memberId: member.id, email: member.email },
      ipAddress: req.ip
    });

    res.status(201).json({
      message: 'Team member added successfully',
      member: { id: member.id, email: member.email }
    });
  } catch (error) {
    console.error('Add Team Member Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all members in requester's team
exports.getTeam = async (req, res) => {
  try {
    const members = await prisma.user.findMany({
      where: { parentId: req.user.id },
      include: {
        customRole: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update a team member
exports.updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const parentId = req.user.id;
    const { firstName, lastName, email, password, roleId } = req.body;

    // Verify member belongs to this parent
    const member = await prisma.user.findFirst({ where: { id, parentId } });
    if (!member) return res.status(404).json({ message: 'Member not found in your team' });

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName)  updateData.lastName  = lastName;
    if (email)     updateData.email     = email;
    if (roleId !== undefined) updateData.customRoleId = roleId || null;
    if (password)  updateData.passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.update({ where: { id }, data: updateData });

    await auditService.record({
      action: 'TEAM_MEMBER_UPDATED',
      userId: parentId,
      details: { memberId: id },
      ipAddress: req.ip
    });

    res.json({ message: 'Member updated successfully' });
  } catch (error) {
    console.error('Update Member Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Remove a team member
exports.removeMember = async (req, res) => {
  try {
    const { id } = req.params;
    const parentId = req.user.id;

    const member = await prisma.user.findFirst({
      where: { id, parentId }
    });

    if (!member) {
      return res.status(404).json({ message: 'Member not found in your team' });
    }

    await prisma.user.delete({ where: { id } });

    await auditService.record({
      action: 'TEAM_MEMBER_REMOVED',
      userId: parentId,
      details: { memberId: id },
      ipAddress: req.ip
    });

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
