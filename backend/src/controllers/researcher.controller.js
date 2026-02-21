const prisma = require('../utils/prisma');

// Get statistics for researcher dashboard
exports.getResearcherStats = async (req, res) => {
  try {
    const researcherId = req.user.id;

    const [totalReports, fixedBugs, topPrograms] = await Promise.all([
      prisma.report.count({ where: { researcherId } }),
      prisma.report.count({ 
        where: { 
          researcherId,
          status: 'RESOLVED' 
        } 
      }),
      prisma.program.findMany({
        where: { 
          status: 'ACTIVE',
          OR: [
            { type: 'PUBLIC' },
            { 
              type: 'PRIVATE',
              invitedResearchers: { some: { id: researcherId } }
            }
          ]
        },
        take: 3,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // Calculate real rewards from bountyAmount field
    const rewardsResult = await prisma.report.aggregate({
      where: { 
        researcherId,
        status: { in: ['ACCEPTED', 'RESOLVED', 'PAID'] }
      },
      _sum: {
        bountyAmount: true
      }
    });

    const totalRewards = rewardsResult._sum.bountyAmount || 0;

    res.json({
      totalReports,
      totalRewards: `$${totalRewards.toLocaleString()}`,
      fixedBugs,
      topPrograms
    });
  } catch (error) {
    console.error('Get Researcher Stats Error:', error);
    console.error('User:', req.user?.id, 'Role:', req.user?.role, 'ParentId:', req.user?.parentId);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get researcher's submissions (Drafts and Sent)
exports.getMyReports = async (req, res) => {
  try {
    const researcherId = req.user.id;
    const { status } = req.query;

    const reports = await prisma.report.findMany({
      where: { 
        researcherId,
        ...(status && { status })
      },
      include: {
        program: {
          select: { name: true, slaFirstResponse: true, slaTriage: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(reports);
  } catch (error) {
    console.error('Get My Reports Error:', error);
    res.status(500).json({ message: 'Internal server error', detail: error.message });
  }
};

// Global Researcher Leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const researchers = await prisma.user.findMany({
      where: { role: 'RESEARCHER' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        reports: {
          where: { status: { in: ['ACCEPTED', 'RESOLVED', 'PAID'] } },
          select: { bountyAmount: true }
        }
      }
    });

    // Calculate total earnings for each researcher
    const leaderboard = researchers.map(r => {
      const totalEarnings = r.reports.reduce((sum, rep) => sum + (rep.bountyAmount || 0), 0);
      return {
        id: r.id,
        name: `${r.firstName} ${r.lastName}`,
        totalEarnings,
        reportCount: r.reports.length
      };
    }).sort((a, b) => b.totalEarnings - a.totalEarnings);

    res.json(leaderboard.slice(0, 50)); // Return top 50
  } catch (error) {
    console.error('Get Leaderboard Error:', error);
    res.status(500).json({ message: 'Internal server error', detail: error.message });
  }
};
