import sgMail from '@sendgrid/mail';
import logger from '../utils/logger';

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@zetapay.io';
const FROM_NAME = process.env.FROM_NAME || 'ZetaPay';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
} else {
  logger.warn('SendGrid API key not configured. Email notifications disabled.');
}

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email via SendGrid
 */
export async function sendEmail(template: EmailTemplate): Promise<void> {
  if (!SENDGRID_API_KEY) {
    logger.warn(`Email not sent (SendGrid not configured): ${template.subject}`);
    return;
  }

  try {
    await sgMail.send({
      to: template.to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: template.subject,
      html: template.html,
      text: template.text || template.html.replace(/<[^>]*>/g, ''),
    });

    logger.info(`Email sent to ${template.to}: ${template.subject}`);
  } catch (error: any) {
    logger.error('SendGrid email error:', error);
    if (error.response) {
      logger.error('SendGrid error body:', error.response.body);
    }
    throw error;
  }
}

/**
 * Payment confirmation email
 */
export async function sendPaymentConfirmation(
  email: string,
  paymentDetails: {
    paymentId: string;
    amount: string;
    currency: string;
    merchantName: string;
    transactionHash?: string;
  }
): Promise<void> {
  const { paymentId, amount, currency, merchantName, transactionHash } = paymentDetails;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Payment Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .detail-row { margin: 15px 0; padding: 10px; background: white; border-radius: 5px; }
        .label { font-weight: bold; color: #667eea; }
        .value { color: #333; }
        .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Payment Confirmed</h1>
        </div>
        <div class="content">
          <p>Your payment has been successfully processed!</p>
          
          <div class="detail-row">
            <div class="label">Payment ID:</div>
            <div class="value">${paymentId}</div>
          </div>
          
          <div class="detail-row">
            <div class="label">Amount:</div>
            <div class="value">${amount} ${currency}</div>
          </div>
          
          <div class="detail-row">
            <div class="label">Merchant:</div>
            <div class="value">${merchantName}</div>
          </div>
          
          ${transactionHash ? `
          <div class="detail-row">
            <div class="label">Transaction Hash:</div>
            <div class="value" style="word-break: break-all;">${transactionHash}</div>
          </div>
          <a href="https://explorer.zetachain.com/evm/tx/${transactionHash}" class="button" style="color: white;">View on Explorer</a>
          ` : ''}
          
          <p style="margin-top: 30px;">Thank you for using ZetaPay!</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ZetaPay. All rights reserved.</p>
          <p>This is an automated message. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: `Payment Confirmed - ${amount} ${currency}`,
    html,
  });
}

/**
 * KYC status update email
 */
export async function sendKYCStatusUpdate(
  email: string,
  details: {
    merchantName: string;
    status: 'approved' | 'rejected' | 'pending' | 'in_review';
    reason?: string;
  }
): Promise<void> {
  const { merchantName, status, reason } = details;

  const statusEmoji = {
    approved: '✅',
    rejected: '❌',
    pending: '⏳',
    in_review: '🔍',
  };

  const statusMessage = {
    approved: 'Your KYC verification has been approved! You can now process payments.',
    rejected: 'Your KYC verification was not approved.',
    pending: 'Your KYC verification is pending review.',
    in_review: 'Your KYC verification is currently under review.',
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>KYC Status Update</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .status-badge { display: inline-block; padding: 10px 20px; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .approved { background: #10b981; color: white; }
        .rejected { background: #ef4444; color: white; }
        .pending { background: #f59e0b; color: white; }
        .in_review { background: #3b82f6; color: white; }
        .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${statusEmoji[status]} KYC Status Update</h1>
        </div>
        <div class="content">
          <p>Hello ${merchantName},</p>
          
          <div class="status-badge ${status}">
            Status: ${status.toUpperCase().replace('_', ' ')}
          </div>
          
          <p>${statusMessage[status]}</p>
          
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          
          ${status === 'approved' ? `
            <a href="${process.env.FRONTEND_URL}/dashboard" class="button" style="color: white;">Go to Dashboard</a>
          ` : ''}
          
          ${status === 'rejected' ? `
            <p>You can resubmit your KYC verification with updated information.</p>
            <a href="${process.env.FRONTEND_URL}/kyc" class="button" style="color: white;">Resubmit KYC</a>
          ` : ''}
          
          <p style="margin-top: 30px;">If you have any questions, please contact our support team.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ZetaPay. All rights reserved.</p>
          <p>This is an automated message. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: `KYC ${status.toUpperCase().replace('_', ' ')} - ZetaPay`,
    html,
  });
}

/**
 * Transaction alert notification email
 */
export async function sendTransactionAlert(
  email: string,
  alert: {
    merchantName: string;
    alertType: string;
    severity: string;
    description: string;
    paymentId: string;
    amount: string;
  }
): Promise<void> {
  const { merchantName, alertType, severity, description, paymentId, amount } = alert;

  const severityColor: Record<string, string> = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
    critical: '#dc2626',
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Transaction Alert</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ef4444; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .alert-box { background: white; border-left: 4px solid ${severityColor[severity.toLowerCase()] || '#ef4444'}; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .detail-row { margin: 10px 0; }
        .label { font-weight: bold; color: #667eea; }
        .value { color: #333; }
        .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Transaction Alert</h1>
        </div>
        <div class="content">
          <p>Hello ${merchantName},</p>
          
          <p>We detected a transaction that requires your attention.</p>
          
          <div class="alert-box">
            <div class="detail-row">
              <span class="label">Alert Type:</span>
              <span class="value">${alertType}</span>
            </div>
            
            <div class="detail-row">
              <span class="label">Severity:</span>
              <span class="value" style="color: ${severityColor[severity.toLowerCase()] || '#ef4444'}; font-weight: bold;">${severity.toUpperCase()}</span>
            </div>
            
            <div class="detail-row">
              <span class="label">Payment ID:</span>
              <span class="value">${paymentId}</span>
            </div>
            
            <div class="detail-row">
              <span class="label">Amount:</span>
              <span class="value">${amount}</span>
            </div>
            
            <div class="detail-row" style="margin-top: 20px;">
              <span class="label">Description:</span>
              <p>${description}</p>
            </div>
          </div>
          
          <a href="${process.env.FRONTEND_URL}/compliance/alerts" class="button" style="color: white;">View Alert Details</a>
          
          <p style="margin-top: 30px;">Please review this transaction and take appropriate action if necessary.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ZetaPay. All rights reserved.</p>
          <p>This is an automated message. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: `${severity.toUpperCase()} Alert: ${alertType} - ZetaPay`,
    html,
  });
}

/**
 * Welcome email for new merchants
 */
export async function sendWelcomeEmail(
  email: string,
  details: {
    merchantName: string;
    apiKey: string;
  }
): Promise<void> {
  const { merchantName, apiKey } = details;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Welcome to ZetaPay</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .api-key-box { background: #1f2937; color: #10b981; padding: 15px; border-radius: 5px; font-family: monospace; word-break: break-all; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .feature-list { list-style: none; padding: 0; }
        .feature-list li { padding: 10px 0; padding-left: 30px; position: relative; }
        .feature-list li:before { content: "✓"; position: absolute; left: 0; color: #10b981; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to ZetaPay!</h1>
        </div>
        <div class="content">
          <p>Hello ${merchantName},</p>
          
          <p>Thank you for joining ZetaPay! Your account has been created successfully.</p>
          
          <h3>Your API Key:</h3>
          <div class="api-key-box">${apiKey}</div>
          <p style="color: #ef4444; font-size: 14px;"><strong>⚠️ Keep this key secure!</strong> Never share it publicly or commit it to version control.</p>
          
          <h3>Getting Started:</h3>
          <ul class="feature-list">
            <li>Complete your KYC verification to start accepting payments</li>
            <li>Integrate our SDK into your application</li>
            <li>Configure webhook endpoints for payment notifications</li>
            <li>Test payments in testnet mode</li>
            <li>Go live and start accepting crypto payments!</li>
          </ul>
          
          <a href="${process.env.FRONTEND_URL}/dashboard" class="button" style="color: white;">Go to Dashboard</a>
          <a href="https://docs.zetapay.io" class="button" style="color: white; background: #1f2937;">View Documentation</a>
          
          <p style="margin-top: 30px;">If you have any questions, our support team is here to help!</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ZetaPay. All rights reserved.</p>
          <p>This is an automated message. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Welcome to ZetaPay - Get Started!',
    html,
  });
}

/**
 * Password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  details: {
    merchantName: string;
    resetToken: string;
  }
): Promise<void> {
  const { merchantName, resetToken } = details;
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Password Reset</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hello ${merchantName},</p>
          
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          
          <a href="${resetUrl}" class="button" style="color: white;">Reset Password</a>
          
          <p>This link will expire in 1 hour.</p>
          
          <div class="warning">
            <strong>⚠️ Didn't request this?</strong><br>
            If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
          </div>
          
          <p style="margin-top: 30px; color: #888; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:<br>${resetUrl}</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ZetaPay. All rights reserved.</p>
          <p>This is an automated message. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Reset Your Password - ZetaPay',
    html,
  });
}
