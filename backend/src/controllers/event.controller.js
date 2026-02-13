const prisma = require('../utils/prisma');

// List Events
const getEvents = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { isPrivate: false },
      orderBy: { startDate: 'asc' }
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create Event (Admin Only)
const createEvent = async (req, res) => {
  try {
    const { name, startDate, endDate, scope, rewards, isPrivate } = req.body;
    
    const event = await prisma.event.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        scope,
        rewards,
        isPrivate: isPrivate || false
      }
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Create Event Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getEvents,
  createEvent
};
