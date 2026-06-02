import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// ─── Transporter factory ───────────────────────────────────────────────

let _transporter = null;

/**
 * Escape HTML to prevent injection
 */
const escapeHtml = (str = '') =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

/**
 * Force transporter reset
 */
export const resetTransporter = () => {
  _transporter = null;
};

/**
 * Get or create transporter
 */
const getTransporter = async () => {
  if (_transporter) return _transporter;

  const isConfigured =
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    !process.env.SMTP_USER.includes('your-email') &&
    !process.env.SMTP_PASS.includes('your-app-password') &&
    process.env.SMTP_USER.includes('@');

  if (process.env.NODE_ENV !== 'production' && !isConfigured) {
    const testAccount = await nodemailer.createTestAccount();

    console.log('📧 Using Ethereal test account');
    console.log(`User: ${testAccount.user}`);
    console.log(`Pass: ${testAccount.pass}`);
    console.log('Preview: https://ethereal.email/messages');

    _transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } else {
    const smtpPort = Number(process.env.SMTP_PORT || 587);

    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  try {
    await _transporter.verify();
    console.log('✅ SMTP server ready');
  } catch (err) {
    console.error('❌ SMTP verification failed:', err.message);
  }

  return _transporter;
};

/**
 * Send mail helper
 */
const sendMail = async (mailOptions) => {
  const transport = await getTransporter();
  const info = await transport.sendMail(mailOptions);

  if (process.env.NODE_ENV !== 'production') {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('\n📧 Email Sent');
      console.log(`To: ${mailOptions.to}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`Preview: ${previewUrl}\n`);
    }
  }

  return info;
};

/**
 * ─────────────────────────────────────────────
 * OTP EMAIL
 * ─────────────────────────────────────────────
 */
export const sendOtpEmail = async (email, firstName, otp) => {
  try {
    const mailOptions = {
      from:
        process.env.EMAIL_FROM ||
        '"AutoSphere" <noreply@autosphere.com>',
      to: email,
      subject: `${otp} is your AutoSphere verification code`,
      text: `Your verification code is ${otp}. It expires in 10 minutes.`,
      html: `
        <div style="font-family: Arial; max-width: 500px; margin: auto;">
          <h2>Verify Email</h2>
          <p>Hi ${escapeHtml(firstName)}, use this code:</p>
          <div style="font-size:32px; font-weight:bold;">
            ${otp}
          </div>
        </div>
      `,
    };

    const info = await sendMail(mailOptions);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('OTP email failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * EMAIL VERIFICATION
 */
export const sendVerificationEmail = async (
  email,
  firstName,
  verificationToken
) => {
  try {
    const frontendUrl =
      process.env.FRONTEND_URL || 'http://localhost:3000';

    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from:
        process.env.EMAIL_FROM ||
        '"AutoSphere" <noreply@autosphere.com>',
      to: email,
      subject: 'Verify Your AutoSphere Account',
      text: `Verify your account: ${verificationUrl}`,
      html: `
        <h2>Welcome ${escapeHtml(firstName)}</h2>
        <p>Please verify your email:</p>
        <a href="${verificationUrl}">Verify Email</a>
      `,
    };

    const info = await sendMail(mailOptions);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Verification email failed:', error);
    throw new Error('Failed to send verification email');
  }
};

/**
 * PASSWORD RESET
 */
export const sendPasswordResetEmail = async (
  email,
  firstName,
  resetToken
) => {
  try {
    const frontendUrl =
      process.env.FRONTEND_URL || 'http://localhost:3000';

    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from:
        process.env.EMAIL_FROM ||
        '"AutoSphere" <noreply@autosphere.com>',
      to: email,
      subject: 'Reset Your Password',
      text: `Reset link: ${resetUrl}`,
      html: `
        <h2>Password Reset</h2>
        <p>Hello ${escapeHtml(firstName)}</p>
        <a href="${resetUrl}">Reset Password</a>
      `,
    };

    const info = await sendMail(mailOptions);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Reset email failed:', error);
    throw new Error('Failed to send reset email');
  }
};

/**
 * WELCOME EMAIL
 */
export const sendWelcomeEmail = async (email, firstName) => {
  try {
    const frontendUrl =
      process.env.FRONTEND_URL || 'http://localhost:3000';

    const mailOptions = {
      from:
        process.env.EMAIL_FROM ||
        '"AutoSphere" <noreply@autosphere.com>',
      to: email,
      subject: 'Welcome to AutoSphere!',
      text: `Welcome ${firstName}!`,
      html: `
        <h2>Welcome ${escapeHtml(firstName)} 🚗</h2>
        <a href="${frontendUrl}/dashboard">Go to Dashboard</a>
      `,
    };

    const info = await sendMail(mailOptions);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Welcome email failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * BOOKING CONFIRMATION
 */
export const sendBookingConfirmationEmail = async (
  email,
  firstName,
  bookingDetails
) => {
  try {
    const frontendUrl =
      process.env.FRONTEND_URL || 'http://localhost:3000';

    const bookingUrl = `${frontendUrl}/bookings/${bookingDetails.id}`;

    const formattedDate = new Date(
      bookingDetails.scheduledDate
    ).toLocaleDateString();

    const mailOptions = {
      from:
        process.env.EMAIL_FROM ||
        '"AutoSphere" <noreply@autosphere.com>',
      to: email,
      subject: `Booking Confirmed - ${bookingDetails.serviceType}`,
      text: `Your booking is confirmed for ${formattedDate}`,
      html: `
        <h2>Booking Confirmed</h2>
        <p>Hello ${escapeHtml(firstName)}</p>
        <p>${bookingDetails.serviceType}</p>
        <p>${formattedDate}</p>
        <a href="${bookingUrl}">View Booking</a>
      `,
    };

    const info = await sendMail(mailOptions);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * BOOKING STATUS CHANGE
 */
export const sendBookingStatusChangeEmail = async (
  email,
  firstName,
  bookingDetails,
  oldStatus,
  newStatus
) => {
  try {
    const frontendUrl =
      process.env.FRONTEND_URL || 'http://localhost:3000';

    const bookingUrl = `${frontendUrl}/bookings/${bookingDetails.id}`;

    const mailOptions = {
      from:
        process.env.EMAIL_FROM ||
        '"AutoSphere" <noreply@autosphere.com>',
      to: email,
      subject: `Booking ${newStatus}`,
      text: `Status changed from ${oldStatus} to ${newStatus}`,
      html: `
        <h2>Status Updated</h2>
        <p>${escapeHtml(firstName)}</p>
        <p>${oldStatus} → ${newStatus}</p>
        <a href="${bookingUrl}">View Booking</a>
      `,
    };

    const info = await sendMail(mailOptions);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * SERVICE PROVIDER NOTIFICATION
 */
export const sendServiceProviderBookingNotification = async (
  email,
  providerName,
  bookingDetails,
  customerDetails
) => {
  try {
    const frontendUrl =
      process.env.FRONTEND_URL || 'http://localhost:3000';

    const bookingUrl = `${frontendUrl}/dealer/bookings/${bookingDetails.id}`;

    const mailOptions = {
      from:
        process.env.EMAIL_FROM ||
        '"AutoSphere" <noreply@autosphere.com>',
      to: email,
      subject: `New Booking - ${bookingDetails.serviceType}`,
      text: `New booking received`,
      html: `
        <h2>New Booking</h2>
        <p>${escapeHtml(providerName)}</p>
        <p>${bookingDetails.serviceType}</p>
        <p>${escapeHtml(customerDetails.firstName)} ${escapeHtml(
        customerDetails.lastName
      )}</p>
        <a href="${bookingUrl}">Manage Booking</a>
      `,
    };

    const info = await sendMail(mailOptions);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * BOOKING CANCELLATION
 */
export const sendBookingCancellationEmail = async (
  email,
  firstName,
  bookingDetails,
  reason
) => {
  try {
    const frontendUrl =
      process.env.FRONTEND_URL || 'http://localhost:3000';

    const bookUrl = `${frontendUrl}/book-service`;

    const mailOptions = {
      from:
        process.env.EMAIL_FROM ||
        '"AutoSphere" <noreply@autosphere.com>',
      to: email,
      subject: `Booking Cancelled - ${bookingDetails.serviceType}`,
      text: `Booking cancelled`,
      html: `
        <h2>Cancelled</h2>
        <p>${escapeHtml(firstName)}</p>
        ${reason ? `<p>${escapeHtml(reason)}</p>` : ''}
        <a href="${bookUrl}">Book Again</a>
      `,
    };

    const info = await sendMail(mailOptions);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * CONTACT FORM EMAIL
 */
export const sendContactEmail = async ({
  name,
  email,
  subject,
  message,
}) => {
  try {
    const supportEmail =
      process.env.SUPPORT_EMAIL ||
      process.env.EMAIL_FROM ||
      'support@autosphere.com';

    const mailOptions = {
      from:
        process.env.EMAIL_FROM ||
        '"AutoSphere" <noreply@autosphere.com>',
      to: supportEmail,
      replyTo: email,
      subject: `[Contact] ${subject}`,
      text: message,
      html: `
        <h2>Contact Form</h2>
        <p>${escapeHtml(name)}</p>
        <p>${escapeHtml(email)}</p>
        <p>${escapeHtml(subject)}</p>
        <p>${escapeHtml(message)}</p>
      `,
    };

    const info = await sendMail(mailOptions);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    return { success: false, error: error.message };
  }
};