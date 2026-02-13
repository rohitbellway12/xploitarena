const prisma = require('../utils/prisma');
const auditService = require('../services/audit.service');

// Create a new program
exports.createProgram = async (req, res) => {
  try {
    const { name, description, scope, rules, rewards, type, budgetTotal } = req.body;
    const companyId = req.user.id; // From authMiddleware

    const program = await prisma.program.create({
      data: {
        name,
        description,
        scope,
        rules,
        rewards,
        type: type || 'PUBLIC',
        budgetTotal: budgetTotal ? parseFloat(budgetTotal) : null,
        companyId,
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
    
    // Build query
    const whereClause = {
      status: 'ACTIVE',
      OR: [
        { type: 'PUBLIC' },
        // If user is logged in, include Private programs they are invited to
        userId ? {
          type: 'PRIVATE',
          invitedResearchers: {
            some: { id: userId }
          }
        } : undefined
      ].filter(Boolean)
    };

    const programs = await prisma.program.findMany({
      where: whereClause,
      include: {
        company: {
          select: {
            firstName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(programs);
  } catch (error) {
    console.error('Get Programs Error:', error);
    res.status(500).json({ message: 'Internal server error' });
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
      },
    });

    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    res.json(program);
  } catch (error) {
    console.error('Get Program Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update program status/rules (Company isolation)
exports.updateProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, scope, rules, rewards, status } = req.body;

    const existingProgram = await prisma.program.findUnique({ where: { id } });

    if (!existingProgram || existingProgram.companyId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const program = await prisma.program.update({
      where: { id },
      data: { name, description, scope, rules, rewards, status }
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

    const program = await prisma.program.findUnique({ where: { id } });

    if (!program || program.companyId !== req.user.id) {
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
