const prisma = require('../utils/prisma');

// Get statistics for admin dashboard
exports.getAdminStats = async (req, res) => {
  try {
    const [bountySum, totalResearchers, totalCompanies, reportsCount, activeProgramsCount, latestActivity] = await Promise.all([
      // Sum of all paid bounties
      prisma.report.aggregate({
        where: { status: 'PAID' },
        _sum: { bountyAmount: true }
      }),
      prisma.user.count({ where: { role: 'RESEARCHER' } }),
      prisma.user.count({ where: { role: 'COMPANY_ADMIN' } }),
      prisma.report.count({ where: { status: { not: 'DRAFT' } } }),
      prisma.program.count({ where: { status: 'ACTIVE' } }),
      prisma.report.findMany({
        where: { status: { not: 'DRAFT' } },
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          researcher: { select: { firstName: true, lastName: true, email: true } },
          program: { select: { name: true } }
        }
      })
    ]);

    res.json({
      totalBounties: `$${(bountySum._sum.bountyAmount || 0).toLocaleString()}`,
      totalResearchers,
      totalCompanies,
      reportsFiled: reportsCount,
      activePrograms: activeProgramsCount,
      latestActivity
    });
  } catch (error) {
    console.error('Get Admin Stats Error:', error);
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
        createdAt: true,
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
