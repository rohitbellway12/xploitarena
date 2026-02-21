const prisma = require('../utils/prisma');

exports.notifyUser = async (userId, title, message, type = 'INFO', relatedReportId = null) => {
  try {
    if (!userId) return;
    
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        isRead: false,
        relatedReportId
      }
    });
    console.log(`Notification created for user ${userId}: ${title}`);
  } catch (error) {
    console.error(`Failed to create notification for user ${userId}:`, error.message);
  }
};

exports.notifyCompanyAdmins = async (companyId, title, message, type = 'INFO', relatedReportId = null) => {
  try {
    if (!companyId) return;

    // The logic: Owner of company is companyId itself (if primary user) AND any CompanyMembers
    // Company role is applied to the main user ID used as company ID.
    const admins = await prisma.user.findMany({
      where: {
        OR: [
          { id: companyId },
          { parentId: companyId, role: 'COMPANY_ADMIN' }
        ]
      },
      select: { id: true }
    });

    const notifications = admins.map(admin => ({
      userId: admin.id,
      title,
      message,
      type,
      isRead: false,
      relatedReportId
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
      console.log(`Notifications created for ${notifications.length} company admins.`);
    }

  } catch (error) {
    console.error(`Failed to create notifications for company ${companyId}:`, error.message);
  }
}
