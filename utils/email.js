const nodemailer = require('nodemailer');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.username.split(' ')[0];
    this.url = url;
    this.from = `Kashida <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV.trim() === 'production') {
      // Brevo SMTP Configuration for production
      return nodemailer.createTransport({
        host: process.env.BREVO_HOST,
        port: process.env.BREVO_PORT, // Use 465 for SSL or 587 for TLS
        auth: {
          user: process.env.BREVO_EMAIL,
          pass: process.env.BREVO_PASSWORD
        }
      });
    }

    // Development transport for local testing
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // Send the actual email
  async send(subject, htmlContent) {
    // 1) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html: htmlContent,
      text: htmlToText.htmlToText(htmlContent) // Convert HTML to plain text
    };

    // 2) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h1>Welcome to Kashida, ${this.firstName}!</h1>
        <p>We’re excited to have you onboard. Please visit the link below to get started:</p>
        <a href="${this.url}" style="color: #007bff; text-decoration: none;">Get Started</a>
        <p>If you have any questions, feel free to contact us.</p>
        <p>Cheers,<br>The Kashida Team</p>
      </div>
    `;
    await this.send('Welcome to Kashida!', htmlContent);
  }

  async sendPasswordReset() {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h1>Password Reset Request</h1>
        <p>Hello ${this.firstName},</p>
        <p>You requested a password reset. Click the link below to reset your password. This link is valid for 10 minutes:</p>
        <a href="${this.url}" style="color: #007bff; text-decoration: none;">Reset Password</a>
        <p>If you didn’t request this, please ignore this email or contact us.</p>
        <p>Best regards,<br>The Kashida Team</p>
      </div>
    `;
    await this.send('Password Reset Request', htmlContent);
  }

  async sendReport(reportType, reportId, reporterName) {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h1>New Report Received</h1>
        <p>Hello Admin,</p>
        <p>A new report has been submitted:</p>
        <ul>
          <li><strong>Report Type:</strong> ${reportType}</li>
          <li><strong>Report ID:</strong> ${reportId}</li>
          <li><strong>Reporter:</strong> ${reporterName}</li>
        </ul>
        <p>Please review the report and take necessary action.</p>
        <p>Best regards,<br>Your Social App</p>
      </div>
    `;
    await this.send(`New Report: ${reportType}`, htmlContent);
  }
};
