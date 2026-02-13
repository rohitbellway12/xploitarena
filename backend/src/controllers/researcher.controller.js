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
        where: { status: 'ACTIVE' },
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
    res.status(500).json({ message: 'Internal server error' });
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
          select: { name: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(reports);
  } catch (error) {
    console.error('Get My Reports Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
