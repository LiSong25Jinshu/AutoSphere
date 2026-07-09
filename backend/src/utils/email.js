import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// ─── Transporter ─────────────────────────────────────────────────────────────

let _transporter = null;

const escapeHtml = (str = '') =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export const resetTransporter = () => {
  _transporter = null;
};

const getTransporter = async () => {
  if (_transporter) return _transporter;

  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASS || '').trim();

  // Configured = real email + real password (not a placeholder)
  const isConfigured =
    smtpUser.includes('@') &&
    smtpPass.length >= 8 &&
    !smtpUser.toLowerCase().startsWith('your') &&
    !smtpUser.toLowerCase().includes('replace') &&
    !smtpPass.toLowerCase().startsWith('your') &&
    !smtpPass.toLowerCase().includes('replace');

  if (!isConfigured) {
    // Fall back to Ethereal for local dev — emails appear at ethereal.email
    const testAccount = await nodemailer.createTestAccount();
    console.log('📧 No SMTP config found — using Ethereal test account');
    console.log(`   User   : ${testAccount.user}`);
    console.log(`   Pass   : ${testAccount.pass}`);
    console.log('   Inbox  : https://ethereal.email/messages');

    _transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  } else {
    const smtpPort = Number(process.env.SMTP_PORT || 587);

    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });
  }

  try {
    await _transporter.verify();
    console.log('✅ SMTP server ready');
  } catch (err) {
    console.error('❌ SMTP verification failed:', err.message);
    _transporter = null;
    throw err;
  }

  return _transporter;
};

// ─── Send helper ─────────────────────────────────────────────────────────────

const sendMail = async (mailOptions) => {
  const transport = await getTransporter();
  const info = await transport.sendMail(mailOptions);

  // In dev, log Ethereal preview link so you can read the email in browser
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log('\n📧 ─────────────────────────────────────────');
    console.log(`   To      : ${mailOptions.to}`);
    console.log(`   Subject : ${mailOptions.subject}`);
    console.log(`   Preview : ${previewUrl}`);
    console.log('📧 ─────────────────────────────────────────\n');
  }

  return info;
};

// ─── OTP EMAIL ───────────────────────────────────────────────────────────────

export const sendOtpEmail = async (email, firstName, otp) => {
  try {
    const info = await sendMail({
      from: process.env.EMAIL_FROM || '"AutoSphere" <noreply@autosphere.com>',
      to: email,
      subject: `${otp} is your AutoSphere verification code`,
      text: `Your verification code is ${otp}. It expires in 10 minutes.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:32px 24px;border:1px solid #e9edef;border-radius:12px;">
          <h2 style="margin:0 0 16px;color:#1a1a1a;">AutoSphere</h2>
          <p style="color:#54656f;margin:0 0 8px;">Hi ${escapeHtml(firstName)}, here is your verification code:</p>
          <div style="background:#f0f2f5;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
            <span style="font-size:2.5rem;font-weight:700;letter-spacing:0.5rem;color:#1a1a1a;font-family:monospace;">
              ${otp}
            </span>
          </div>
          <p style="color:#54656f;font-size:0.875rem;">This code expires in <strong>10 minutes</strong>.</p>
          <p style="color:#8696a0;font-size:0.8rem;margin-top:24px;">
            If you did not create an AutoSphere account, you can safely ignore this email.
          </p>
        </div>
      `,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('OTP email failed:', error.message);
    return { success: false, error: error.message };
  }
};

// ─── EMAIL VERIFICATION (link-based) ─────────────────────────────────────────

export const sendVerificationEmail = async (email, firstName, verificationToken) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const url = `${frontendUrl}/verify-email?token=${verificationToken}`;

    const info = await sendMail({
      from: process.env.EMAIL_FROM || '"AutoSphere" <noreply@autosphere.com>',
      to: email,
      subject: 'Verify Your AutoSphere Account',
      text: `Verify your account: ${url}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
          <h2 style="color:#1976d2;">Welcome to AutoSphere, ${escapeHtml(firstName)}!</h2>
          <p>Click the button below to verify your email address:</p>
          <div style="text-align:center;margin:30px 0;">
            <a href="${url}" style="background:#1976d2;color:#fff;padding:12px 30px;text-decoration:none;border-radius:5px;display:inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color:#666;font-size:14px;">This link expires in 24 hours.</p>
        </div>
      `,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Verification email failed:', error.message);
    throw new Error('Failed to send verification email');
  }
};

// ─── PASSWORD RESET ───────────────────────────────────────────────────────────

export const sendPasswordResetEmail = async (email, firstName, resetToken) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const url = `${frontendUrl}/reset-password?token=${resetToken}`;

    const info = await sendMail({
      from: process.env.EMAIL_FROM || '"AutoSphere" <noreply@autosphere.com>',
      to: email,
      subject: 'Reset Your AutoSphere Password',
      text: `Reset your password: ${url}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
          <h2 style="color:#1976d2;">Password Reset Request</h2>
          <p>Hello ${escapeHtml(firstName)},</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align:center;margin:30px 0;">
            <a href="${url}" style="background:#dc004e;color:#fff;padding:12px 30px;text-decoration:none;border-radius:5px;display:inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color:#666;font-size:14px;">This link expires in 1 hour. If you did not request this, ignore this email.</p>
        </div>
      `,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Reset email failed:', error.message);
    throw new Error('Failed to send password reset email');
  }
};

// ─── WELCOME EMAIL ────────────────────────────────────────────────────────────

export const sendWelcomeEmail = async (email, firstName) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const info = await sendMail({
      from: process.env.EMAIL_FROM || '"AutoSphere" <noreply@autosphere.com>',
      to: email,
      subject: 'Welcome to AutoSphere!',
      text: `Welcome ${firstName}! Visit your dashboard: ${frontendUrl}/dashboard`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
          <h2 style="color:#1976d2;">Welcome to AutoSphere, ${escapeHtml(firstName)}! 🚗</h2>
          <p>Your email has been verified and your account is now active.</p>
          <div style="text-align:center;margin:30px 0;">
            <a href="${frontendUrl}/dashboard" style="background:#1976d2;color:#fff;padding:12px 30px;text-decoration:none;border-radius:5px;display:inline-block;">
              Go to Dashboard
            </a>
          </div>
        </div>
      `,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Welcome email failed:', error.message);
    return { success: false, error: error.message };
  }
};

// ─── BOOKING CONFIRMATION ─────────────────────────────────────────────────────

export const sendBookingConfirmationEmail = async (email, firstName, bookingDetails) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const bookingUrl = `${frontendUrl}/bookings/${bookingDetails.id}`;
    const formattedDate = new Date(bookingDetails.scheduledDate).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const info = await sendMail({
      from: process.env.EMAIL_FROM || '"AutoSphere" <noreply@autosphere.com>',
      to: email,
      subject: `Booking Confirmed — ${bookingDetails.serviceType.replace(/_/g, ' ')}`,
      text: `Your booking is confirmed for ${formattedDate}.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
          <h2 style="color:#4caf50;">Booking Confirmed 🎉</h2>
          <p>Hello ${escapeHtml(firstName)},</p>
          <div style="background:#f5f5f5;padding:20px;border-radius:8px;margin:20px 0;">
            <p><strong>Service:</strong> ${escapeHtml(bookingDetails.serviceType.replace(/_/g, ' '))}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${bookingDetails.scheduledTime || 'TBD'}</p>
            <p><strong>Status:</strong> <span style="color:#4caf50;">${bookingDetails.status}</span></p>
            ${bookingDetails.notes ? `<p><strong>Notes:</strong> ${escapeHtml(bookingDetails.notes)}</p>` : ''}
          </div>
          <a href="${bookingUrl}" style="background:#1976d2;color:#fff;padding:12px 24px;text-decoration:none;border-radius:5px;display:inline-block;">
            View Booking
          </a>
        </div>
      `,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Booking confirmation email failed:', error.message);
    return { success: false, error: error.message };
  }
};

// ─── BOOKING STATUS CHANGE ────────────────────────────────────────────────────

export const sendBookingStatusChangeEmail = async (email, firstName, bookingDetails, oldStatus, newStatus) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const bookingUrl = `${frontendUrl}/bookings/${bookingDetails.id}`;

    const statusColors = {
      confirmed: '#4caf50',
      in_progress: '#2196f3',
      completed: '#4caf50',
      cancelled: '#f44336',
      no_show: '#ff9800',
    };
    const color = statusColors[newStatus] || '#666';

    const info = await sendMail({
      from: process.env.EMAIL_FROM || '"AutoSphere" <noreply@autosphere.com>',
      to: email,
      subject: `Booking ${newStatus.replace(/_/g, ' ')} — ${bookingDetails.serviceType.replace(/_/g, ' ')}`,
      text: `Your booking status changed from ${oldStatus} to ${newStatus}.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
          <h2 style="color:${color};">Booking Status Updated</h2>
          <p>Hello ${escapeHtml(firstName)},</p>
          <div style="background:#f5f5f5;padding:20px;border-radius:8px;margin:20px 0;">
            <p><strong>Service:</strong> ${escapeHtml(bookingDetails.serviceType.replace(/_/g, ' '))}</p>
            <p><strong>Previous Status:</strong> ${escapeHtml(oldStatus)}</p>
            <p><strong>New Status:</strong> <span style="color:${color};font-weight:600;">${escapeHtml(newStatus.replace(/_/g, ' '))}</span></p>
          </div>
          <a href="${bookingUrl}" style="background:#1976d2;color:#fff;padding:12px 24px;text-decoration:none;border-radius:5px;display:inline-block;">
            View Booking
          </a>
        </div>
      `,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Status change email failed:', error.message);
    return { success: false, error: error.message };
  }
};

// ─── SERVICE PROVIDER NOTIFICATION ───────────────────────────────────────────

export const sendServiceProviderBookingNotification = async (email, providerName, bookingDetails, customerDetails) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const bookingUrl = `${frontendUrl}/dealer/bookings/${bookingDetails.id}`;
    const formattedDate = new Date(bookingDetails.scheduledDate).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const info = await sendMail({
      from: process.env.EMAIL_FROM || '"AutoSphere" <noreply@autosphere.com>',
      to: email,
      subject: `New Booking Request — ${bookingDetails.serviceType.replace(/_/g, ' ')}`,
      text: `New booking from ${customerDetails.firstName} ${customerDetails.lastName} for ${formattedDate}.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
          <h2 style="color:#1976d2;">New Booking Request 📋</h2>
          <p>Hello ${escapeHtml(providerName)},</p>
          <div style="background:#e3f2fd;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #1976d2;">
            <p><strong>Service:</strong> ${escapeHtml(bookingDetails.serviceType.replace(/_/g, ' '))}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${bookingDetails.scheduledTime || 'TBD'}</p>
            ${bookingDetails.notes ? `<p><strong>Notes:</strong> ${escapeHtml(bookingDetails.notes)}</p>` : ''}
          </div>
          <div style="background:#f5f5f5;padding:20px;border-radius:8px;margin:20px 0;">
            <p><strong>Customer:</strong> ${escapeHtml(customerDetails.firstName)} ${escapeHtml(customerDetails.lastName)}</p>
            <p><strong>Email:</strong> ${escapeHtml(customerDetails.email)}</p>
            ${customerDetails.phone ? `<p><strong>Phone:</strong> ${escapeHtml(customerDetails.phone)}</p>` : ''}
          </div>
          <a href="${bookingUrl}" style="background:#1976d2;color:#fff;padding:12px 24px;text-decoration:none;border-radius:5px;display:inline-block;">
            View &amp; Manage Booking
          </a>
        </div>
      `,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Provider notification email failed:', error.message);
    return { success: false, error: error.message };
  }
};

// ─── BOOKING RESCHEDULE ───────────────────────────────────────────────────────

export const sendBookingRescheduleEmail = async (email, firstName, bookingDetails, oldDate, oldTime) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const bookingUrl = `${frontendUrl}/bookings/${bookingDetails.id}`;
    const formattedOldDate = new Date(oldDate).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const formattedNewDate = new Date(bookingDetails.scheduledDate).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const info = await sendMail({
      from: process.env.EMAIL_FROM || '"AutoSphere" <noreply@autosphere.com>',
      to: email,
      subject: `Booking Rescheduled — ${bookingDetails.serviceType.replace(/_/g, ' ')}`,
      text: `Your booking has been rescheduled from ${formattedOldDate} to ${formattedNewDate}.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
          <h2 style="color:#ff9800;">Booking Rescheduled 📅</h2>
          <p>Hello ${escapeHtml(firstName)},</p>
          <p>Your <strong>${escapeHtml(bookingDetails.serviceType.replace(/_/g, ' '))}</strong> booking has been rescheduled.</p>
          <div style="background:#fff3e0;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #ff9800;">
            <strong>Previous:</strong><br>
            <span style="text-decoration:line-through;color:#888;">${formattedOldDate} at ${escapeHtml(oldTime || 'TBD')}</span>
          </div>
          <div style="background:#e8f5e9;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #4caf50;">
            <strong>New Schedule:</strong><br>
            ${formattedNewDate} at ${escapeHtml(bookingDetails.scheduledTime || 'TBD')}
          </div>
          <a href="${bookingUrl}" style="background:#1976d2;color:#fff;padding:12px 24px;text-decoration:none;border-radius:5px;display:inline-block;">
            View Booking
          </a>
        </div>
      `,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Reschedule email failed:', error.message);
    return { success: false, error: error.message };
  }
};

// ─── BOOKING CANCELLATION ─────────────────────────────────────────────────────

export const sendBookingCancellationEmail = async (email, firstName, bookingDetails, reason = null) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const formattedDate = new Date(bookingDetails.scheduledDate).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const info = await sendMail({
      from: process.env.EMAIL_FROM || '"AutoSphere" <noreply@autosphere.com>',
      to: email,
      subject: `Booking Cancelled — ${bookingDetails.serviceType.replace(/_/g, ' ')}`,
      text: `Your booking for ${formattedDate} has been cancelled.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
          <h2 style="color:#f44336;">Booking Cancelled</h2>
          <p>Hello ${escapeHtml(firstName)},</p>
          <div style="background:#ffebee;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #f44336;">
            <p><strong>Service:</strong> ${escapeHtml(bookingDetails.serviceType.replace(/_/g, ' '))}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            ${reason ? `<p><strong>Reason:</strong> ${escapeHtml(reason)}</p>` : ''}
          </div>
          <a href="${frontendUrl}/book-service" style="background:#1976d2;color:#fff;padding:12px 24px;text-decoration:none;border-radius:5px;display:inline-block;">
            Book Again
          </a>
        </div>
      `,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Cancellation email failed:', error.message);
    return { success: false, error: error.message };
  }
};

// ─── CONTACT FORM ─────────────────────────────────────────────────────────────

export const sendContactEmail = async ({ name, email, subject, message }) => {
  try {
    const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM || 'support@autosphere.com';

    const info = await sendMail({
      from: process.env.EMAIL_FROM || '"AutoSphere" <noreply@autosphere.com>',
      to: supportEmail,
      replyTo: email,
      subject: `[Contact] ${subject}`,
      text: message,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
          <h2>Contact Form Submission</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          <hr>
          <p>${escapeHtml(message)}</p>
        </div>
      `,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Contact email failed:', error.message);
    return { success: false, error: error.message };
  }
};
