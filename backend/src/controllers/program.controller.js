const prisma = require('../utils/prisma');
const auditService = require('../services/audit.service');

// Create a new program
exports.createProgram = async (req, res) => {
  try {
    const { 
      name, description, scope, rules, rewards, type, budgetTotal,
      slaFirstResponse, slaTriage, slaResolution,
      disclosurePolicy, safeHarbor
    } = req.body;
    // Use parentId if sub-account, otherwise use own ID
    const companyId = req.user.parentId || req.user.id; 

    const program = await prisma.program.create({
      data: {
        name,
        description,
        scope,
        rules,
        rewards,
        type: type || 'PUBLIC',
        budgetTotal: budgetTotal ? parseFloat(budgetTotal) : null,
        slaFirstResponse: slaFirstResponse ? parseInt(slaFirstResponse) : null,
        slaTriage: slaTriage ? parseInt(slaTriage) : null,
        slaResolution: slaResolution ? parseInt(slaResolution) : null,
        companyId,
        disclosurePolicy,
        safeHarbor: safeHarbor || 'NONE',
      },
    });

    await auditService.record({
      action: 'PROGRAM_CREATED',
      userId: companyId,
      details: { name: program.name },
      ipAddress: req.ip
    });

    res.status(201).json({
      message: 'Program created successfully',
      program,
    });
  } catch (error) {
    console.error('Create Program Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all active programs (Filtered by Public/Private)
exports.getAllPrograms = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    // Resolve effective ID (use parent if sub-account for ownership checks)
    const effectiveId = req.user ? (req.user.parentId || req.user.id) : null;
    
    const { minBounty, type: filterType } = req.query;
    
    const whereClause = { status: 'ACTIVE' };

    // Private programs logic: only owners or invited researchers can see them
    if (req.user && !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      whereClause.OR = [
        { type: 'PUBLIC' },
        {
          type: 'PRIVATE',
          OR: [
            { companyId: effectiveId },
            { invitedResearchers: { some: { id: userId } } }
          ]
        }
      ];
    } else if (!req.user) {
      // Unauthenticated users only see public programs
      whereClause.type = 'PUBLIC';
    }
    
    // Type filter from query
    if (filterType) {
      whereClause.type = filterType.toUpperCase();
    }

    const programs = await prisma.program.findMany({
      where: whereClause,
      include: {
        company: {
          select: {
            firstName: true,
            email: true,
          },
        },
        _count: {
          select: { reports: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Post-process to filter by Min Bounty and sanitize
    const filteredAndSanitized = programs.filter(p => {
      // 1. Min Bounty Filtering (String parsing)
      if (minBounty && p.rewards) {
        const amount = parseInt(minBounty);
        // Extract all numbers from rewards string (e.g. "$1,000 - $5,000")
        const rewardNumbers = p.rewards.replace(/,/g, '').match(/\d+/g);
        if (rewardNumbers) {
          const maxRewardInProgram = Math.max(...rewardNumbers.map(Number));
          if (maxRewardInProgram < amount) return false;
        }
      }
      return true;
    }).map(p => {
      // 2. Sanitization: Only include invitedResearchers for the owner
      const { invitedResearchers, ...rest } = p;
      if (rest.companyId !== userId) {
        return rest;
      }
      return p;
    });

    res.json(filteredAndSanitized);
  } catch (error) {
    console.error('Get Programs Error:', error);
    res.status(500).json({ message: 'Internal server error', detail: error.message });
  }
};

// Get program by ID
exports.getProgramById = async (req, res) => {
  try {
    const { id } = req.params;
    const program = await prisma.program.findUnique({
      where: { id },
      include: {
        company: { select: { firstName: true, email: true } },
        invitedResearchers: { 
          select: { 
            id: true, 
            firstName: true, 
            lastName: true, 
            email: true 
          } 
        },
        bookmarks: {
          where: { userId: req.user.id }
        }
      },
    });

    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    // Access Control for Private Programs
    if (program.type === 'PRIVATE') {
      const userId = req.user.id;
      const isOwner = program.companyId === userId;
      const isInvited = await prisma.program.findFirst({
        where: {
          id,
          invitedResearchers: { some: { id: userId } }
        }
      });

      if (!isOwner && !isInvited && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'This is a private program. Access denied.' });
      }
    }

    res.json(program);
  } catch (error) {
    console.error('Get Program Error:', error);
    res.status(500).json({ message: 'Internal server error', detail: error.message });
  }
};

// Update program status/rules (Company isolation)
exports.updateProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.parentId || req.user.id;
    const { 
      name, description, scope, rules, rewards, status,
      slaFirstResponse, slaTriage, slaResolution,
      disclosurePolicy, safeHarbor
    } = req.body;

    const existingProgram = await prisma.program.findUnique({ where: { id } });

    if (!existingProgram || existingProgram.companyId !== companyId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const program = await prisma.program.update({
      where: { id },
      data: { 
        name, description, scope, rules, rewards, status,
        slaFirstResponse: slaFirstResponse ? parseInt(slaFirstResponse) : undefined,
        slaTriage: slaTriage ? parseInt(slaTriage) : undefined,
        slaResolution: slaResolution ? parseInt(slaResolution) : undefined,
        disclosurePolicy,
        safeHarbor
      }
    });

    await auditService.record({
      action: 'PROGRAM_UPDATED',
      userId: req.user.id,
      details: { name: program.name, status: program.status },
      ipAddress: req.ip
    });

    res.json({ message: 'Program updated successfully', program });
  } catch (error) {
    console.error('Update Program Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Invite Researcher to Private Program
exports.inviteResearcher = async (req, res) => {
  try {
    const { id } = req.params; // Program ID
    const { researcherEmail } = req.body;
    const companyId = req.user.parentId || req.user.id;

    const program = await prisma.program.findUnique({ where: { id } });

    if (!program || program.companyId !== companyId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (program.type !== 'PRIVATE') {
      return res.status(400).json({ message: 'Can only invite researchers to Private programs' });
    }

    const researcher = await prisma.user.findUnique({ where: { email: researcherEmail } });

    if (!researcher || researcher.role !== 'RESEARCHER') {
      return res.status(404).json({ message: 'Researcher not found' });
    }

    await prisma.program.update({
      where: { id },
      data: {
        invitedResearchers: {
          connect: { id: researcher.id }
        }
      }
    });

    await notificationService.notifyUser(
      researcher.id,
      '📩 Private Program Invitation',
      `You have been invited to participate in the private program: ${program.name}.`,
      'INFO',
      null
    );

    await auditService.record({
      action: 'PROGRAM_INVITATION_SENT',
      userId: req.user.id,
      details: { program: program.name, invited: researcher.email },
      ipAddress: req.ip
    });

    res.json({ message: 'Researcher invited successfully' });
  } catch (error) {
    console.error('Invite Researcher Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
