const prisma = require('../utils/prisma');
const emailService = require('../services/email.service');

/**
 * Calculates the deadline for a specific SLA target.
 * @param {Date} startTime - The starting timestamp (e.g., submission time).
 * @param {number} hours - The SLA target in hours.
 * @returns {Date} The deadline.
 */
function calculateDeadline(startTime, hours) {
  if (!hours) return null;
  const deadline = new Date(startTime);
  deadline.setHours(deadline.getHours() + hours);
  return deadline;
}

/**
 * Checks if an SLA target has been breached for a report.
 * @param {Object} report - The report object from Prisma.
 * @param {string} target - 'firstResponse', 'triage', or 'resolution'.
 * @returns {Boolean} True if breached.
 */
function isBreached(report, target) {
  const program = report.program;
  if (!program) return false;

  let targetHours;
  let startTime = report.submittedAt;
  let actionTime;

  switch (target) {
    case 'firstResponse':
      targetHours = program.slaFirstResponse;
      actionTime = report.firstRespondedAt;
      break;
    case 'triage':
      targetHours = program.slaTriage;
      actionTime = report.triagedAt;
      break;
    case 'resolution':
      targetHours = program.slaResolution;
      actionTime = report.resolvedAt;
      break;
    default:
      return false;
  }

  if (!targetHours) return false;

  const deadline = calculateDeadline(startTime, targetHours);
  
  // If the action hasn't been taken yet, check against current time
  const timeToCheck = actionTime || new Date();
  
  return timeToCheck > deadline;
}

/**
 * Calculates compliance metrics for a set of reports.
 */
function calculateMetrics(reports) {
  let totalSlaEligible = 0;
  let breachedCount = 0;
  let totalResponseTime = 0;
  let responseCount = 0;

  reports.forEach(report => {
    if (report.program.slaFirstResponse) {
      totalSlaEligible++;
      if (isBreached(report, 'firstResponse')) {
        breachedCount++;
      }
      
      if (report.firstRespondedAt) {
        const responseTime = (new Date(report.firstRespondedAt) - new Date(report.submittedAt)) / (1000 * 60 * 60);
        totalResponseTime += responseTime;
        responseCount++;
      }
    }
  });

  const complianceRate = totalSlaEligible > 0 ? ((totalSlaEligible - breachedCount) / totalSlaEligible) * 100 : 100;
  const avgResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;

  return {
    totalSlaEligible,
    breachedCount,
    complianceRate: Math.round(complianceRate),
    avgResponseTime: parseFloat(avgResponseTime.toFixed(2))
  };
}

/**
 * Scans active reports for breaches and sends notifications.
 */
async function checkAndNotifyBreaches() {
  const activeReports = await prisma.report.findMany({
    where: {
      status: { notIn: ['RESOLVED', 'PAID', 'CLOSED', 'DRAFT'] },
    },
    include: {
      program: {
        include: { company: true }
      }
    }
  });

  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const adminEmail = adminUser?.email || process.env.EMAIL_USER;

  for (const report of activeReports) {
    const targets = ['firstResponse', 'triage', 'resolution'];
    
    for (const target of targets) {
      if (isBreached(report, target)) {
        const targetHours = target === 'firstResponse' ? report.program.slaFirstResponse : 
                           target === 'triage' ? report.program.slaTriage : 
                           report.program.slaResolution;
        
        if (!targetHours) continue;

        const deadline = calculateDeadline(report.submittedAt, targetHours);
        
        // Check if we already notified company about this breach
        const breachLog = await prisma.auditLog.findFirst({
          where: { reportId: report.id, action: `SLA_BREACH_${target.toUpperCase()}` }
        });

        if (!breachLog) {
          try {
            await emailService.sendSlaBreachEmail(
              report.program.company.email,
              `[${target.toUpperCase()}] ${report.title}`,
              report.program.name,
              deadline
            );

            await prisma.auditLog.create({
              data: {
                reportId: report.id,
                action: `SLA_BREACH_${target.toUpperCase()}`,
                details: `Notified company about ${target} deadline breach. Deadline was ${deadline.toISOString()}`
              }
            });
          } catch (err) {
            console.error(`Failed to send alert for report ${report.id}:`, err);
          }
        }

        // Escalation: If it's a critical breach (e.g. 24h past deadline), notify Admin
        const escalationThreshold = new Date(deadline);
        escalationThreshold.setHours(escalationThreshold.getHours() + 24);
        
        if (new Date() > escalationThreshold) {
          const escalationLog = await prisma.auditLog.findFirst({
             where: { reportId: report.id, action: `SLA_ESCALATED_${target.toUpperCase()}` }
          });

          if (!escalationLog) {
            try {
              await emailService.sendSlaEscalationEmail(
                adminEmail,
                report.title,
                report.program.name,
                report.program.company.firstName, // Company name stored in firstName
                deadline
              );

              await prisma.auditLog.create({
                data: {
                  reportId: report.id,
                  action: `SLA_ESCALATED_${target.toUpperCase()}`,
                  details: `Escalated ${target} breach to administration.`
                }
              });
            } catch (err) {
              console.error('Escalation Email Error:', err);
            }
          }
        }
      }
    }
  }
}

module.exports = {
  calculateDeadline,
  isBreached,
  calculateMetrics,
  checkAndNotifyBreaches
};
