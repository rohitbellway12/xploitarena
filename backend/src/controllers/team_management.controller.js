const prisma = require('../utils/prisma');

/**
 * Create a new researcher team
 */
exports.createTeam = async (req, res) => {
  try {
    const { name, description, members } = req.body; // members: [{ userId, share }]
    const creatorId = req.user.id;

    // Validate shares total 100%
    if (members) {
      const totalShare = members.reduce((sum, m) => sum + (m.share || 0), 0);
      if (Math.abs(totalShare - 100) > 0.1) {
        return res.status(400).json({ message: 'Total shares must sum to 100%' });
      }
    }

    const team = await prisma.researcherTeam.create({
      data: {
        name,
        description,
        creatorId,
        members: {
          create: members ? members.map(m => ({
            userId: m.userId,
            share: m.share,
            role: m.userId === creatorId ? 'LEADER' : 'MEMBER'
          })) : [{
            userId: creatorId,
            share: 100,
            role: 'LEADER'
          }]
        }
      },
      include: {
        members: {
          include: { user: { select: { firstName: true, lastName: true } } }
        }
      }
    });

    res.status(201).json(team);
  } catch (error) {
    console.error('Create Team Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get user's teams (or parent's teams if sub-account)
 */
exports.getMyTeams = async (req, res) => {
  try {
    // For sub-accounts, show the parent's teams too
    const effectiveUserId = req.user.parentId || req.user.id;
    
    const teams = await prisma.researcherTeam.findMany({
      where: {
        OR: [
          { members: { some: { userId: req.user.id } } },
          { members: { some: { userId: effectiveUserId } } },
          { creatorId: effectiveUserId }
        ]
      },
      include: {
        members: {
          include: { user: { select: { firstName: true, lastName: true } } }
        }
      }
    });
    res.json(teams);
  } catch (error) {
    console.error('Get My Teams Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


/**
 * Add member to team
 */
exports.addMember = async (req, res) => {
  try {
    const { teamId, userId, share } = req.body;
    
    // Check if team exists and user is creator
    const team = await prisma.researcherTeam.findUnique({
      where: { id: teamId }
    });

    if (!team || team.creatorId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await prisma.researcherTeamMember.create({
      data: { teamId, userId, share }
    });

    res.json({ message: 'Member added to team' });
  } catch (error) {
    console.error('Add Team Member Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
