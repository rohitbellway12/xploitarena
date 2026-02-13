const prisma = require('../utils/prisma');

/**
 * Record an immutable audit log entry.
 * @param {Object} params
 * @param {string} params.action - The action being performed (e.g., "AUTH_LOGIN", "REPORT_CREATED")
 * @param {string} [params.details] - JSON string or text describing the details of the action
 * @param {string} [params.userId] - The ID of the user performing the action
 * @param {string} [params.reportId] - The ID of the report associated with the action
 * @param {string} [params.ipAddress] - The IP address of the user
 */
const record = async ({ action, details, userId, reportId, ipAddress }) => {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        details: typeof details === 'object' ? JSON.stringify(details) : details,
        userId,
        reportId,
        ipAddress,
      },
    });
  } catch (error) {
    console.error('Failed to record audit log:', error);
    // We don't throw here to avoid breaking the main flow if logging fails,
    // although in a high-compliance system you might want to.
  }
};

module.exports = {
  record,
};
