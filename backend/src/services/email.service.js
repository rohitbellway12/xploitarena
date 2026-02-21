const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,      // false = STARTTLS on port 587
  requireTLS: true,   // Force STARTTLS upgrade
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false // Allow self-signed certs (for VPS compatibility)
  },
  connectionTimeout: 10000,  // 10 second connection timeout
  greetingTimeout: 10000,    // 10 second greeting timeout
  socketTimeout: 15000,      // 15 second socket timeout
});

// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter FAILED to connect:', error.message);
    console.error('   EMAIL_HOST:', process.env.EMAIL_HOST);
    console.error('   EMAIL_PORT:', process.env.EMAIL_PORT);
    console.error('   EMAIL_USER:', process.env.EMAIL_USER);
  } else {
    console.log('✅ Email transporter connected successfully. Ready to send emails.');
  }
});

exports.send2FACode = async (to, code) => {
  console.log(`Sending 2FA code to ${to}...`);
  const mailOptions = {
    from: `"XploitArena Security" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your 2FA Verification Code - XploitArena',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #1e293b; border-radius: 12px; background-color: #0f172a; color: #f8fafc;">
        <h2 style="color: #6366f1; text-align: center;">XploitArena Security</h2>
        <p>Hello,</p>
        <p>You recently attempted to log in to XploitArena. Please use the following code to complete your authentication:</p>
        <div style="background-color: #1e293b; color: #ffffff; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 8px; margin: 25px 0; letter-spacing: 5px;">
          ${code}
        </div>
        <p style="font-size: 14px; color: #94a3b8;">This code will expire in 10 minutes. If you did not request this, please change your password immediately.</p>
        <hr style="border: 0; border-top: 1px solid #1e293b; margin: 20px 0;">
        <p style="font-size: 12px; text-align: center; color: #64748b;">&copy; 2026 XploitArena. All rights reserved.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ 2FA Email sent successfully to ${to}. MessageId: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Failed to send 2FA email to ${to}:`, error);
    throw error;
  }
};

exports.sendPasswordResetEmail = async (to, resetUrl) => {
  const mailOptions = {
    from: `"XploitArena Security" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Password Reset Request - XploitArena',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #1e293b; border-radius: 12px; background-color: #0f172a; color: #f8fafc;">
        <h2 style="color: #6366f1; text-align: center;">XploitArena Security</h2>
        <p>Hello,</p>
        <p>You requested a password reset. Please click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #6366f1; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Reset Password</a>
        </div>
        <p style="font-size: 14px; color: #94a3b8;">This link will expire in 10 minutes. If you did not request this, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #1e293b; margin: 20px 0;">
        <p style="font-size: 12px; text-align: center; color: #64748b;">&copy; 2026 XploitArena. All rights reserved.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

exports.sendVerificationEmail = async (to, verifyUrl) => {
  const mailOptions = {
    from: `"XploitArena Accounts" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Verify Your Email Address - XploitArena',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #1e293b; border-radius: 12px; background-color: #0f172a; color: #f8fafc;">
        <h2 style="color: #6366f1; text-align: center;">Welcome to XploitArena</h2>
        <p>Hello,</p>
        <p>Thank you for signing up. Please click the button below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #6366f1; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Verify Email</a>
        </div>
        <p style="font-size: 14px; color: #94a3b8;">This link will expire in 24 hours.</p>
        <hr style="border: 0; border-top: 1px solid #1e293b; margin: 20px 0;">
        <p style="font-size: 12px; text-align: center; color: #64748b;">&copy; 2026 XploitArena. All rights reserved.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

exports.sendInvitationEmail = async (to, inviteUrl, customMessage) => {
  const mailOptions = {
    from: `"XploitArena Administration" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Secure Invitation to Join XploitArena Program',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #334155; border-radius: 24px; background-color: #0f172a; color: #f8fafc; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #6366f1; margin: 0; font-size: 28px; letter-spacing: -1px;">Xploit<span style="color: #ffffff;">Arena</span></h1>
          <p style="text-transform: uppercase; font-size: 10px; font-weight: 800; tracking: 0.1em; color: #94a3b8; margin-top: 5px;">Exclusive Partner Invitation</p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6;">Hello,</p>
        <p style="font-size: 16px; line-height: 1.6;">We are pleased to invite your organization to join the **XploitArena** ecosystem as a Corporate Partner.</p>
        
        ${customMessage ? `
        <div style="background-color: #1e293b; border-left: 4px solid #6366f1; padding: 20px; margin: 25px 0; font-style: italic; color: #e2e8f0; border-radius: 8px;">
          ${customMessage.replace(/\n/g, '<br>')}
        </div>
        ` : `
        <p style="font-size: 16px; line-height: 1.6;">As a partner, you will gain access to our elite network of security researchers, allowing you to launch and manage sophisticated bug bounty programs with complete transparency.</p>
        `}
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${inviteUrl}" style="background-color: #6366f1; color: #ffffff; padding: 18px 36px; border-radius: 14px; text-decoration: none; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3);">Initialize Partnership</a>
        </div>
        
        <p style="font-size: 13px; color: #94a3b8; text-align: center; line-height: 1.6;">*Please note: This invitation is time-sensitive and will expire in 48 hours. After registration, your account will undergo a final administrative review.*</p>
        
        <hr style="border: 0; border-top: 1px solid #1e293b; margin: 30px 0;">
        <p style="font-size: 11px; text-align: center; color: #64748b; line-height: 1.5;">You received this because an administrator invited your email to join the platform. <br> &copy; 2026 XploitArena Platform. All rights reserved.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

exports.sendApprovalEmail = async (to) => {
  const mailOptions = {
    from: `"XploitArena Administration" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your Company Account Has Been Approved!',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #1e293b; border-radius: 12px; background-color: #0f172a; color: #f8fafc;">
        <h2 style="color: #6366f1; text-align: center;">XploitArena Account Approved</h2>
        <p>Great news!</p>
        <p>Your Company Admin account on XploitArena has been reviewed and approved by our administrators.</p>
        <p>You can now log in to your dashboard and start creating programs.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background-color: #6366f1; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Login Now</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #1e293b; margin: 20px 0;">
        <p style="font-size: 12px; text-align: center; color: #64748b;">&copy; 2026 XploitArena. All rights reserved.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

exports.sendSlaBreachEmail = async (to, reportTitle, programName, deadline) => {
  const mailOptions = {
    from: `"XploitArena Monitor" <${process.env.EMAIL_USER}>`,
    to,
    subject: `🚨 URGENT: SLA Breach - ${reportTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ef4444; border-radius: 12px; background-color: #0f172a; color: #f8fafc;">
        <h2 style="color: #ef4444; text-align: center;">SLA Breach Detected</h2>
        <p>A high-priority event requires your immediate attention.</p>
        <div style="background-color: #1e293b; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Report:</strong> ${reportTitle}</p>
          <p><strong>Program:</strong> ${programName}</p>
          <p><strong>Missed Deadline:</strong> ${new Date(deadline).toLocaleString()}</p>
        </div>
        <p>This breach affects your overall compliance score. Please triage or respond to the report immediately.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background-color: #ef4444; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Review Report</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #1e293b; margin: 20px 0;">
        <p style="font-size: 12px; text-align: center; color: #64748b;">&copy; 2026 XploitArena. All rights reserved.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

exports.sendBudgetAlertEmail = async (to, programName, percentage, remainingBudget) => {
  const mailOptions = {
    from: `"XploitArena Billing" <${process.env.EMAIL_USER}>`,
    to,
    subject: `⚠️ Budget Alert: ${percentage}% Consumed - ${programName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #f59e0b; border-radius: 12px; background-color: #0f172a; color: #f8fafc;">
        <h2 style="color: #f59e0b; text-align: center;">Budget Threshold Reached</h2>
        <p>Your program budget for <strong>${programName}</strong> has reached the <strong>${percentage}%</strong> consumption threshold.</p>
        <div style="background-color: #1e293b; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="font-size: 24px; font-weight: bold; margin: 0;">${percentage}% Utilized</p>
          <p style="color: #94a3b8; margin-top: 5px;">Remaining Budget: $${remainingBudget.toLocaleString()}</p>
        </div>
        ${percentage === 100 ? `
          <p style="color: #ef4444; font-weight: bold;">CRITICAL: Your budget is completely exhausted. No further bounty payments can be authorized until the budget is increased.</p>
        ` : `
          <p>Consider increasing your budget soon to ensure uninterrupted bounty payments to researchers.</p>
        `}
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background-color: #f59e0b; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Manage Budget</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #1e293b; margin: 20px 0;">
        <p style="font-size: 12px; text-align: center; color: #64748b;">&copy; 2026 XploitArena. All rights reserved.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};
exports.sendSlaEscalationEmail = async (to, reportTitle, programName, companyName, deadline) => {
  const mailOptions = {
    from: `"XploitArena Compliance" <${process.env.EMAIL_USER}>`,
    to,
    subject: `⚠️ ESCALATION: Critical SLA Breach - ${reportTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #991b1b; border-radius: 12px; background-color: #0f172a; color: #f8fafc;">
        <h2 style="color: #ef4444; text-align: center;">Operational Escalation</h2>
        <p>A critical SLA breach has occurred and requires administrative intervention.</p>
        <div style="background-color: #1e293b; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Report:</strong> ${reportTitle}</p>
          <p><strong>Program:</strong> ${programName}</p>
          <p><strong>Organization:</strong> ${companyName}</p>
          <p><strong>Missed Deadline:</strong> ${new Date(deadline).toLocaleString()}</p>
        </div>
        <p>The company has failed to address this report within the mandated timeframe. Review and potential intervention recommended.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/dashboard" style="background-color: #991b1b; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Enter Admin Console</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #1e293b; margin: 20px 0;">
        <p style="font-size: 12px; text-align: center; color: #64748b;">&copy; 2026 XploitArena Management. All rights reserved.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};
