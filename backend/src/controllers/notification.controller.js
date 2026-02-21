const prisma = require('../utils/prisma');

exports.getNotifications = async (req, res) => {
  try {
    console.log('Fetching notifications for user:', req.user.id);
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifications);
  } catch (error) {
    console.error('Get Notifications Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.updateMany({
      where: { id, userId: req.user.id },
      data: { isRead: true },
    });
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark As Read Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark All As Read Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.notification.deleteMany({
      where: { id, userId: req.user.id },
    });
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete Notification Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
