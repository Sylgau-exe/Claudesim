// lib/email.js - Email service using Resend (adapted for ClaudeSim)
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'ClaudeSim <noreply@claudesim.app>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'sgauthier@executiveproducer.ca';
const APP_NAME = 'ClaudeSim';
const APP_URL = process.env.FRONTEND_URL || 'https://claudesim.app';
const ACCENT_COLOR = '#1e40af';
const ACCENT_GRADIENT = 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)';

export async function sendEmail({ to, subject, html, text, replyTo }) {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not configured');
    throw new Error('Email service not configured');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      reply_to: replyTo,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('Resend API error:', data);
    throw new Error(data.message || 'Failed to send email');
  }
  return data;
}

export async function sendPasswordResetEmail({ name, email, resetToken, resetUrl }) {
  const firstName = name ? name.split(' ')[0] : 'there';
  const fullResetUrl = resetUrl || `${APP_URL}?reset_token=${resetToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f3f4f6; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: ${ACCENT_GRADIENT}; color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 40px 30px; }
        .cta { text-align: center; margin: 32px 0; }
        .cta a { display: inline-block; background: ${ACCENT_GRADIENT}; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 24px 0; font-size: 14px; }
        .footer { text-align: center; padding: 24px; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="header">
            <h1>🔑 Reset Your Password</h1>
          </div>
          <div class="content">
            <p>Hi ${firstName},</p>
            <p>We received a request to reset your ${APP_NAME} password. Click the button below to create a new password:</p>
            <div class="cta">
              <a href="${fullResetUrl}">Reset Password</a>
            </div>
            <div class="warning">
              ⚠️ This link expires in 1 hour. If you didn't request this reset, you can safely ignore this email.
            </div>
            <p>If the button doesn't work, copy and paste this URL into your browser:</p>
            <p style="word-break: break-all; color: ${ACCENT_COLOR};">${fullResetUrl}</p>
          </div>
          <div class="footer">
            <p>© 2026 ${APP_NAME} by Panda Projet Inc.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Reset Your Password\n\nHi ${firstName},\n\nVisit this link to reset your ${APP_NAME} password:\n${fullResetUrl}\n\nThis link expires in 1 hour.\n\n- ${APP_NAME}`;

  return sendEmail({
    to: email,
    subject: `Reset your ${APP_NAME} password`,
    html,
    text,
  });
}

export async function sendWelcomeEmail({ name, email }) {
  const firstName = name ? name.split(' ')[0] : 'there';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f3f4f6; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: ${ACCENT_GRADIENT}; color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0 0 8px 0; font-size: 28px; }
        .content { padding: 40px 30px; }
        .features { background: #f0f4ff; border-radius: 12px; padding: 24px; margin: 24px 0; }
        .cta { text-align: center; margin: 32px 0; }
        .cta a { display: inline-block; background: ${ACCENT_GRADIENT}; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; }
        .footer { text-align: center; padding: 24px; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="header">
            <h1>🎯 Welcome to ${APP_NAME}!</h1>
            <p>Learn Claude by doing.</p>
          </div>
          <div class="content">
            <p>Hi ${firstName},</p>
            <p>Welcome to ${APP_NAME}! You now have access to our AI literacy simulation platform where you'll master Claude through real-world professional scenarios.</p>
            
            <div class="features">
              <p>🎮 <strong>Interactive Simulations</strong> — Real professional scenarios with Claude</p>
              <p>🤖 <strong>ARIA Coach</strong> — Real-time feedback on your prompting technique</p>
              <p>📊 <strong>6 Competencies</strong> — Track your AI literacy progression</p>
              <p>📋 <strong>Detailed Debriefs</strong> — Learn from every simulation</p>
            </div>
            
            <div class="cta">
              <a href="${APP_URL}/dashboard">Start Your First Simulation →</a>
            </div>
            
            <p>Happy learning!<br><strong>The ${APP_NAME} Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2026 ${APP_NAME} by Panda Projet Inc.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Welcome to ${APP_NAME}, ${firstName}! 🎯`,
    html,
    text: `Welcome to ${APP_NAME}, ${firstName}! Start your first simulation at ${APP_URL}/dashboard`,
    replyTo: ADMIN_EMAIL,
  });
}
