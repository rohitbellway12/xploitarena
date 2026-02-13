const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.send2FACode = async (to, code) => {
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

  return transporter.sendMail(mailOptions);
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
