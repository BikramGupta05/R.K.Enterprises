import nodemailer from 'nodemailer';

const createTransporter = () => {
  const {
    EMAIL_SERVICE,
    EMAIL_HOST,
    EMAIL_PORT,
    EMAIL_USER,
    EMAIL_PASS,
    EMAIL_SECURE
  } = process.env;

  if (!EMAIL_USER || !EMAIL_PASS) {
    return null;
  }

  const transportConfig = {
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS
    }
  };

  if (EMAIL_SERVICE) {
    transportConfig.service = EMAIL_SERVICE;
  } else if (EMAIL_HOST) {
    transportConfig.host = EMAIL_HOST;
    transportConfig.port = Number(EMAIL_PORT || 587);
    transportConfig.secure = EMAIL_SECURE === 'true' || Number(EMAIL_PORT || 587) === 465;
  } else {
    return null;
  }

  return nodemailer.createTransport(transportConfig);
};

const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn('Email transport is not configured. Password reset email was not sent.');
    return { success: false, reason: 'missing-config' };
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error.message);
    return { success: false, reason: 'send-failed' };
  }
};

const sendResetPasswordEmail = async ({ to, resetUrl }) => {
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;">
      <h2>Password Reset Request</h2>
      <p>You requested to reset your password. Click the link below to update it.</p>
      <a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;">Reset Password</a>
      <p>If you did not request this, you can safely ignore this email.</p>
    </div>
  `;

  const result = await sendEmail({
    to,
    subject: 'Reset your password',
    html
  });

  if (!result.success && result.reason === 'missing-config') {
    console.info(`[dev] Password reset link: ${resetUrl}`);
  }

  return result;
};

export { sendResetPasswordEmail };
