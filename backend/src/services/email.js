const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Send email function
async function sendEmail({ to, subject, html, text }) {
  try {
    // If no SMTP configured, log to console (for development)
    if (!process.env.SMTP_USER) {
      console.log('📧 Email would be sent:');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('---');
      return { success: true, messageId: 'dev-mode' };
    }

    const info = await transporter.sendMail({
      from: `"Relay" <${process.env.SMTP_FROM || 'noreply@relay.ai'}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '')
    });

    console.log('📧 Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error);
    throw error;
  }
}

module.exports = { sendEmail };
