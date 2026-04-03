import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter (singleton)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send email verification email
 * @param {string} email - Recipient email address
 * @param {string} firstName - User's first name
 * @param {string} verificationToken - Email verification token
 */
export const sendVerificationEmail = async (email, firstName, verificationToken) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@autosphere.com',
    to: email,
    subject: 'Verify Your AutoSphere Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Welcome to AutoSphere, ${firstName}!</h2>
        
        <p>Thank you for registering with AutoSphere. To complete your registration and start using our platform, please verify your email address by clicking the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        
        <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        
        <p><strong>This verification link will expire in 24 hours.</strong></p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <p style="color: #666; font-size: 14px;">
          If you didn't create an account with AutoSphere, please ignore this email.
        </p>
        
        <p style="color: #666; font-size: 14px;">
          Best regards,<br>
          The AutoSphere Team
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

/**
 * Send password reset email
 * @param {string} email - Recipient email address
 * @param {string} firstName - User's first name
 * @param {string} resetToken - Password reset token
 */
export const sendPasswordResetEmail = async (email, firstName, resetToken) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@autosphere.com',
    to: email,
    subject: 'Reset Your AutoSphere Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Password Reset Request</h2>
        
        <p>Hello ${firstName},</p>
        
        <p>We received a request to reset your password for your AutoSphere account. If you made this request, click the button below to reset your password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #dc004e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        
        <p><strong>This reset link will expire in 1 hour.</strong></p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <p style="color: #666; font-size: 14px;">
          If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
        </p>
        
        <p style="color: #666; font-size: 14px;">
          Best regards,<br>
          The AutoSphere Team
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

/**
 * Send welcome email after successful verification
 * @param {string} email - Recipient email address
 * @param {string} firstName - User's first name
 */
export const sendWelcomeEmail = async (email, firstName) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@autosphere.com',
    to: email,
    subject: 'Welcome to AutoSphere!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Welcome to AutoSphere, ${firstName}! 🚗</h2>
        
        <p>Your email has been successfully verified and your account is now active!</p>
        
        <p>You can now access all AutoSphere features:</p>
        <ul>
          <li>Browse and search vehicles for sale or rent</li>
          <li>Get AI-powered vehicle recommendations</li>
          <li>Book maintenance and car wash services</li>
          <li>Communicate directly with dealers and service providers</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${frontendUrl}/dashboard" 
             style="background-color: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Go to Dashboard
          </a>
        </div>
        
        <p>If you have any questions or need assistance, don't hesitate to contact our support team.</p>
        
        <p style="color: #666; font-size: 14px;">
          Best regards,<br>
          The AutoSphere Team
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    // Don't throw error for welcome email as it's not critical
    return { success: false, error: error.message };
  }
};

/**
 * Send booking confirmation email
 * @param {string} email - Recipient email address
 * @param {string} firstName - User's first name
 * @param {Object} bookingDetails - Booking information
 */
export const sendBookingConfirmationEmail = async (email, firstName, bookingDetails) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const bookingUrl = `${frontendUrl}/bookings/${bookingDetails.id}`;
  
  const formattedDate = new Date(bookingDetails.scheduledDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const formattedTime = bookingDetails.scheduledTime || 'TBD';

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@autosphere.com',
    to: email,
    subject: `Booking Confirmation - ${bookingDetails.serviceType}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Booking Confirmed! 🎉</h2>
        
        <p>Hello ${firstName},</p>
        
        <p>Your booking has been confirmed. Here are the details:</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Booking Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Service Type:</strong></td>
              <td style="padding: 8px 0;">${bookingDetails.serviceType}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Date:</strong></td>
              <td style="padding: 8px 0;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Time:</strong></td>
              <td style="padding: 8px 0;">${formattedTime}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Status:</strong></td>
              <td style="padding: 8px 0;"><span style="color: #4caf50; font-weight: 600;">${bookingDetails.status}</span></td>
            </tr>
            ${bookingDetails.notes ? `
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Notes:</strong></td>
              <td style="padding: 8px 0;">${bookingDetails.notes}</td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${bookingUrl}" 
             style="background-color: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Booking Details
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          If you need to reschedule or cancel your booking, please visit your dashboard or contact us directly.
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <p style="color: #666; font-size: 14px;">
          Best regards,<br>
          The AutoSphere Team
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Booking confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send booking confirmation email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send booking reminder email
 * @param {string} email - Recipient email address
 * @param {string} firstName - User's first name
 * @param {Object} bookingDetails - Booking information
 */
/**
 * Send booking status change email
 * @param {string} email - Recipient email address
 * @param {string} firstName - User's first name
 * @param {Object} bookingDetails - Booking information
 * @param {string} oldStatus - Previous status
 * @param {string} newStatus - New status
 */
export const sendBookingStatusChangeEmail = async (email, firstName, bookingDetails, oldStatus, newStatus) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const bookingUrl = `${frontendUrl}/bookings/${bookingDetails.id}`;
  
  const formattedDate = new Date(bookingDetails.scheduledDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const formattedTime = bookingDetails.scheduledTime || 'TBD';

  // Status-specific messaging
  const statusMessages = {
    confirmed: {
      title: 'Booking Confirmed',
      color: '#4caf50',
      message: 'Your booking has been confirmed by the service provider.'
    },
    in_progress: {
      title: 'Service In Progress',
      color: '#2196f3',
      message: 'Your service is currently in progress.'
    },
    completed: {
      title: 'Service Completed',
      color: '#4caf50',
      message: 'Your service has been completed. Thank you for choosing AutoSphere!'
    },
    cancelled: {
      title: 'Booking Cancelled',
      color: '#f44336',
      message: 'Your booking has been cancelled.'
    },
    no_show: {
      title: 'Missed Appointment',
      color: '#ff9800',
      message: 'You missed your scheduled appointment.'
    }
  };

  const statusInfo = statusMessages[newStatus] || {
    title: 'Booking Status Updated',
    color: '#666',
    message: `Your booking status has been updated to: ${newStatus}`
  };

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@autosphere.com',
    to: email,
    subject: `${statusInfo.title} - ${bookingDetails.serviceType}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${statusInfo.color};">${statusInfo.title}</h2>
        
        <p>Hello ${firstName},</p>
        
        <p>${statusInfo.message}</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Booking Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Service Type:</strong></td>
              <td style="padding: 8px 0;">${bookingDetails.serviceType}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Date:</strong></td>
              <td style="padding: 8px 0;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Time:</strong></td>
              <td style="padding: 8px 0;">${formattedTime}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Previous Status:</strong></td>
              <td style="padding: 8px 0;">${oldStatus}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>New Status:</strong></td>
              <td style="padding: 8px 0;"><span style="color: ${statusInfo.color}; font-weight: 600;">${newStatus}</span></td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${bookingUrl}" 
             style="background-color: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Booking Details
          </a>
        </div>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <p style="color: #666; font-size: 14px;">
          Best regards,<br>
          The AutoSphere Team
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Booking status change email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send booking status change email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send service provider booking notification
 * @param {string} email - Service provider email address
 * @param {string} providerName - Service provider's name
 * @param {Object} bookingDetails - Booking information
 * @param {Object} customerDetails - Customer information
 */
export const sendServiceProviderBookingNotification = async (email, providerName, bookingDetails, customerDetails) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const bookingUrl = `${frontendUrl}/dealer/bookings/${bookingDetails.id}`;
  
  const formattedDate = new Date(bookingDetails.scheduledDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const formattedTime = bookingDetails.scheduledTime || 'TBD';

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@autosphere.com',
    to: email,
    subject: `New Booking Request - ${bookingDetails.serviceType}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">New Booking Request 📋</h2>
        
        <p>Hello ${providerName},</p>
        
        <p>You have received a new booking request through AutoSphere.</p>
        
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1976d2;">
          <h3 style="margin-top: 0; color: #0d47a1;">Booking Information</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Service Type:</strong></td>
              <td style="padding: 8px 0;">${bookingDetails.serviceType}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Date:</strong></td>
              <td style="padding: 8px 0;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Time:</strong></td>
              <td style="padding: 8px 0;">${formattedTime}</td>
            </tr>
            ${bookingDetails.notes ? `
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Notes:</strong></td>
              <td style="padding: 8px 0;">${bookingDetails.notes}</td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Customer Information</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Name:</strong></td>
              <td style="padding: 8px 0;">${customerDetails.firstName} ${customerDetails.lastName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Email:</strong></td>
              <td style="padding: 8px 0;">${customerDetails.email}</td>
            </tr>
            ${customerDetails.phone ? `
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Phone:</strong></td>
              <td style="padding: 8px 0;">${customerDetails.phone}</td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${bookingUrl}" 
             style="background-color: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View & Manage Booking
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          Please review and confirm this booking at your earliest convenience.
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <p style="color: #666; font-size: 14px;">
          Best regards,<br>
          The AutoSphere Team
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Service provider booking notification sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send service provider booking notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send booking reschedule email
 * @param {string} email - Recipient email address
 * @param {string} firstName - User's first name
 * @param {Object} bookingDetails - Booking information
 * @param {string} oldDate - Previous date
 * @param {string} oldTime - Previous time
 */
export const sendBookingRescheduleEmail = async (email, firstName, bookingDetails, oldDate, oldTime) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const bookingUrl = `${frontendUrl}/bookings/${bookingDetails.id}`;
  
  const formattedOldDate = new Date(oldDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const formattedNewDate = new Date(bookingDetails.scheduledDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const formattedNewTime = bookingDetails.scheduledTime || 'TBD';

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@autosphere.com',
    to: email,
    subject: `Booking Rescheduled - ${bookingDetails.serviceType}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff9800;">Booking Rescheduled 📅</h2>
        
        <p>Hello ${firstName},</p>
        
        <p>Your booking has been rescheduled to a new date and time.</p>
        
        <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
          <h3 style="margin-top: 0; color: #e65100;">Previous Schedule</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Date:</strong></td>
              <td style="padding: 8px 0; text-decoration: line-through;">${formattedOldDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Time:</strong></td>
              <td style="padding: 8px 0; text-decoration: line-through;">${oldTime || 'TBD'}</td>
            </tr>
          </table>
        </div>
        
        <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
          <h3 style="margin-top: 0; color: #2e7d32;">New Schedule</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Service Type:</strong></td>
              <td style="padding: 8px 0;">${bookingDetails.serviceType}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Date:</strong></td>
              <td style="padding: 8px 0; font-weight: 600;">${formattedNewDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Time:</strong></td>
              <td style="padding: 8px 0; font-weight: 600;">${formattedNewTime}</td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${bookingUrl}" 
             style="background-color: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Booking Details
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          If you have any questions about this change, please contact us.
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <p style="color: #666; font-size: 14px;">
          Best regards,<br>
          The AutoSphere Team
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Booking reschedule email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send booking reschedule email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send booking cancellation email
 * @param {string} email - Recipient email address
 * @param {string} firstName - User's first name
 * @param {Object} bookingDetails - Booking information
 * @param {string} reason - Cancellation reason (optional)
 */
export const sendBookingCancellationEmail = async (email, firstName, bookingDetails, reason = null) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const bookServicesUrl = `${frontendUrl}/book-service`;
  
  const formattedDate = new Date(bookingDetails.scheduledDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const formattedTime = bookingDetails.scheduledTime || 'TBD';

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@autosphere.com',
    to: email,
    subject: `Booking Cancelled - ${bookingDetails.serviceType}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f44336;">Booking Cancelled</h2>
        
        <p>Hello ${firstName},</p>
        
        <p>Your booking has been cancelled.</p>
        
        <div style="background: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f44336;">
          <h3 style="margin-top: 0; color: #c62828;">Cancelled Booking Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Service Type:</strong></td>
              <td style="padding: 8px 0;">${bookingDetails.serviceType}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Date:</strong></td>
              <td style="padding: 8px 0;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Time:</strong></td>
              <td style="padding: 8px 0;">${formattedTime}</td>
            </tr>
            ${reason ? `
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Reason:</strong></td>
              <td style="padding: 8px 0;">${reason}</td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        <p>We're sorry to see your booking cancelled. If you'd like to book another appointment, we're here to help!</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${bookServicesUrl}" 
             style="background-color: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Book New Service
          </a>
        </div>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <p style="color: #666; font-size: 14px;">
          Best regards,<br>
          The AutoSphere Team
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Booking cancellation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send booking cancellation email:', error);
    return { success: false, error: error.message };
  }
};
