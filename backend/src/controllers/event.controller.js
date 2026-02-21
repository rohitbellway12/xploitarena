const prisma = require('../utils/prisma');

// List Events (Filtered by Type/Status)
const getEvents = async (req, res) => {
  try {
    const { type } = req.query;
    
    // Check if user is Admin/Super Admin
    const isAdmin = req.user && ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);

    const where = {};
    
    // If NOT admin, only show public events
    if (!isAdmin) {
      where.isPrivate = false;
    }

    // Filter by type if provided
    if (type && type.trim() !== '') {
      where.type = type.toUpperCase();
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { startDate: 'asc' },
      include: {
        programs: { select: { id: true } },
        _count: { select: { programs: true, reports: true } }
      }
    });

    res.json(events);
  } catch (error) {
    console.error('getEvents error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get Event Dashboard Stats (Single Event)
const getEventDashboard = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching dashboard for event ID:', id);

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        programs: {
          select: { 
            id: true, 
            name: true, 
            scope: true, 
            rewards: true, 
            type: true, // This is programType in UI
            company: { select: { firstName: true } } 
          }
        }
      }
    });

    if (!event) {
      console.log('Event not found in database for ID:', id);
      return res.status(404).json({ message: 'Event not found' });
    }

    // Aggregate Stats
    const totalReports = await prisma.report.count({ where: { eventId: id } });
    const resolvedReports = await prisma.report.count({ where: { eventId: id, status: 'RESOLVED' } });
    
    const bountyStats = await prisma.report.aggregate({
      where: { eventId: id, status: { in: ['PAID', 'RESOLVED'] } },
      _sum: { bountyAmount: true }
    });

    // Leaderboard
    const leaderboard = await prisma.report.groupBy({
      by: ['researcherId'],
      where: { eventId: id, status: { in: ['PAID', 'RESOLVED', 'ACCEPTED'] } },
      _sum: { bountyAmount: true },
      _count: { id: true },
      orderBy: { _sum: { bountyAmount: 'desc' } },
      take: 10
    });

    // Fetch researcher details for leaderboard
    let enrichedLeaderboard = [];
    if (leaderboard.length > 0) {
      const researcherIds = leaderboard.map(l => l.researcherId);
      const researchers = await prisma.user.findMany({
        where: { id: { in: researcherIds } },
        select: { id: true, firstName: true, lastName: true, avatar: true }
      });

      enrichedLeaderboard = leaderboard.map(entry => {
        const researcher = researchers.find(r => r.id === entry.researcherId);
        return {
          researcher: researcher || { firstName: 'Unknown', lastName: 'Researcher' },
          totalBounty: entry._sum.bountyAmount || 0,
          reportCount: entry._count.id,
          points: (entry._count.id * 10) + (Math.floor((entry._sum.bountyAmount || 0) / 100)) // Mock points
        };
      });
    }

    res.json({
      event,
      stats: {
        totalReports,
        resolvedReports,
        totalBounty: bountyStats._sum.bountyAmount || 0
      },
      leaderboard: enrichedLeaderboard
    });

  } catch (error) {
    console.error('Get Event Dashboard Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create Event (Admin Only)
const createEvent = async (req, res) => {
  try {
    const { name, startDate, endDate, scope, rewards, isPrivate, type, programIds } = req.body;
    
    const event = await prisma.event.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        scope,
        rewards,
        isPrivate: isPrivate || false,
        type: type || 'LIVE_HACKING',
        programs: programIds ? {
          connect: programIds.map(id => ({ id }))
        } : undefined
      }
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Create Event Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Schedule a pentest for an event (simple JSON-backed schedule store)
const fs = require('fs');
const path = require('path');

const SCHEDULE_STORE = path.join(__dirname, '../../data/event_schedules.json');

const ensureScheduleStore = () => {
  const dir = path.dirname(SCHEDULE_STORE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(SCHEDULE_STORE)) fs.writeFileSync(SCHEDULE_STORE, '[]');
};

const schedulePentest = async (req, res) => {
  try {
    const { id } = req.params; // event id
    const { scheduledAt, vendor, notes } = req.body;

    // Basic validation
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return res.status(404).json({ message: 'Event not found' });

    ensureScheduleStore();
    const raw = fs.readFileSync(SCHEDULE_STORE, 'utf8');
    const schedules = JSON.parse(raw || '[]');

    const entry = {
      id: `sched_${Date.now()}`,
      eventId: id,
      scheduledAt: scheduledAt || new Date().toISOString(),
      vendor: vendor || null,
      notes: notes || null,
      createdBy: req.user ? req.user.id : null,
      createdAt: new Date().toISOString()
    };

    schedules.push(entry);
    fs.writeFileSync(SCHEDULE_STORE, JSON.stringify(schedules, null, 2));

    // audit
    const auditService = require('../services/audit.service');
    auditService.record({ action: 'EVENT_PENTEST_SCHEDULED', details: JSON.stringify(entry), userId: req.user ? req.user.id : null, ipAddress: req.ip });

    res.status(201).json({ message: 'Pentest scheduled', entry });
  } catch (error) {
    console.error('Schedule Pentest Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Dedicated leaderboard endpoint (uses same aggregation as dashboard)
const getLeaderboard = async (req, res) => {
  try {
    const { id } = req.params;
    const leaderboard = await prisma.report.groupBy({
      by: ['researcherId'],
      where: { eventId: id, status: { in: ['PAID', 'RESOLVED'] } },
      _sum: { bountyAmount: true },
      _count: { id: true },
      orderBy: { _sum: { bountyAmount: 'desc' } },
      take: 50
    });

    const researcherIds = leaderboard.map(l => l.researcherId);
    const researchers = await prisma.user.findMany({ where: { id: { in: researcherIds } }, select: { id: true, firstName: true, lastName: true, avatar: true } });

    const enriched = leaderboard.map(entry => {
      const researcher = researchers.find(r => r.id === entry.researcherId);
      return { researcher, totalBounty: entry._sum.bountyAmount || 0, reportCount: entry._count.id };
    });

    res.json(enriched);
  } catch (error) {
    console.error('Get Leaderboard Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Simple Server-Sent Events (SSE) endpoint for live metrics streaming
const metricsStream = async (req, res) => {
  try {
    const { id } = req.params;
    // Headers for SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    });

    let stopped = false;
    req.on('close', () => { stopped = true; });

    const sendMetrics = async () => {
      if (stopped) return;
      const totalReports = await prisma.report.count({ where: { eventId: id } });
      const resolvedReports = await prisma.report.count({ where: { eventId: id, status: 'RESOLVED' } });
      const bounty = await prisma.report.aggregate({ where: { eventId: id, status: { in: ['PAID', 'RESOLVED'] } }, _sum: { bountyAmount: true } });

      const payload = { totalReports, resolvedReports, totalBounty: bounty._sum.bountyAmount || 0, timestamp: new Date().toISOString() };
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    // Send initial metrics immediately
    await sendMetrics();

    // Then send updates every 5 seconds
    const interval = setInterval(async () => {
      if (stopped) { clearInterval(interval); return; }
      await sendMetrics();
    }, 5000);

  } catch (error) {
    console.error('Metrics Stream Error:', error);
    try { res.end(); } catch (e) {}
  }
};

// Update Event (Admin Only)
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, startDate, endDate, scope, rewards, isPrivate, type, programIds } = req.body;

    // Check if event exists
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Event not found' });

    const event = await prisma.event.update({
      where: { id },
      data: {
        name,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        scope,
        rewards,
        isPrivate: isPrivate !== undefined ? isPrivate : undefined,
        type: type ? type.toUpperCase() : undefined,
        programs: programIds ? {
          set: programIds.map(pid => ({ id: pid }))
        } : undefined
      }
    });

    res.json(event);
  } catch (error) {
    console.error('Update Event Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete Event (Admin Only)
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if event exists
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Event not found' });

    // Note: Reports linked to this event will have eventId set to null (if schema allows) 
    // or we might need to handle them. For simplicity, assume cascade or nullify.
    await prisma.event.delete({ where: { id } });

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete Event Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Export all handlers
module.exports = {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventDashboard,
  schedulePentest,
  getLeaderboard,
  metricsStream
};
