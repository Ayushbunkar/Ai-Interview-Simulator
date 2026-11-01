/**
 * Professional Branded HTML Email Templates for InterviewForge AI
 * Compatible across Gmail, Apple Mail, Outlook, and mobile email clients.
 */

export interface OTPEmailParams {
  otp: string;
  purpose: "login" | "signup" | "password_reset";
  expiresInMinutes?: number;
  recipientEmail?: string;
}

export function generateOTPEmailHtml({
  otp,
  purpose,
  expiresInMinutes = 5,
  recipientEmail,
}: OTPEmailParams): { subject: string; html: string; text: string } {
  const purposeTitle =
    purpose === "signup"
      ? "Verify Your Email Address"
      : purpose === "password_reset"
      ? "Password Reset Verification"
      : "Two-Factor Login Verification";

  const purposeDescription =
    purpose === "signup"
      ? "Thank you for creating an account on InterviewForge AI. Please use the 6-digit verification code below to verify your email address and activate your account."
      : purpose === "password_reset"
      ? "We received a request to reset your password. Use the 6-digit verification code below to proceed with resetting your password."
      : "A sign-in attempt was detected for your InterviewForge AI account. To complete the login process, enter the 6-digit verification code below.";

  const subject = `Your AI Simulator Login Verification Code: ${otp}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f4f5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #09090b;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f4f4f5;
      padding: 40px 16px;
    }
    .card {
      max-width: 520px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      border: 1px solid #e4e4e7;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
    }
    .header {
      padding: 32px 32px 24px;
      border-bottom: 1px solid #f4f4f5;
      text-align: left;
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
    }
    .brand-icon {
      width: 32px;
      height: 32px;
      background-color: #2563eb;
      border-radius: 8px;
      display: inline-block;
      text-align: center;
      line-height: 32px;
      color: #ffffff;
      font-weight: bold;
      font-size: 16px;
    }
    .brand-name {
      font-size: 18px;
      font-weight: 700;
      color: #09090b;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 32px;
    }
    .title {
      font-size: 20px;
      font-weight: 700;
      color: #09090b;
      margin: 0 0 12px;
      letter-spacing: -0.3px;
    }
    .text {
      font-size: 14px;
      line-height: 1.6;
      color: #52525b;
      margin: 0 0 24px;
    }
    .otp-container {
      background-color: #09090b;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 28px 0;
    }
    .otp-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #a1a1aa;
      margin-bottom: 8px;
    }
    .otp-code {
      font-family: 'SF Pro Mono', 'Consolas', 'Roboto Mono', Menlo, Courier, monospace;
      font-size: 38px;
      font-weight: 800;
      letter-spacing: 12px;
      color: #ffffff;
      margin: 0;
      padding-left: 12px; /* balance letter-spacing */
    }
    .expiry-badge {
      display: inline-block;
      margin-top: 10px;
      font-size: 12px;
      color: #fbbf24;
      font-weight: 500;
    }
    .security-notice {
      background-color: #fef2f2;
      border: 1px solid #fee2e2;
      border-radius: 10px;
      padding: 14px 16px;
      margin: 24px 0 0;
    }
    .security-notice-title {
      font-size: 12px;
      font-weight: 700;
      color: #991b1b;
      margin: 0 0 4px;
    }
    .security-notice-text {
      font-size: 12px;
      line-height: 1.5;
      color: #b91c1c;
      margin: 0;
    }
    .footer {
      padding: 24px 32px 32px;
      border-top: 1px solid #f4f4f5;
      background-color: #fafafa;
      text-align: center;
    }
    .footer-text {
      font-size: 12px;
      color: #71717a;
      line-height: 1.5;
      margin: 0 0 8px;
    }
    .footer-muted {
      font-size: 11px;
      color: #a1a1aa;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <div class="brand">
          <div class="brand-icon">⚡</div>
          <span class="brand-name">InterviewForge AI</span>
        </div>
      </div>
      
      <div class="content">
        <h1 class="title">${purposeTitle}</h1>
        <p class="text">${purposeDescription}</p>

        <div class="otp-container">
          <div class="otp-label">Your Verification Code</div>
          <div class="otp-code">${otp}</div>
          <div class="expiry-badge">⏱ Expires in ${expiresInMinutes} minutes</div>
        </div>

        <p class="text" style="font-size: 13px; margin-bottom: 0;">
          Enter this code into the AI Simulator verification window to confirm your identity.
        </p>

        <div class="security-notice">
          <div class="security-notice-title">Security Notice</div>
          <p class="security-notice-text">
            Never share this OTP with anyone. Our support team will never ask for your code. If you did not initiate this login attempt, please secure your account credentials immediately.
          </p>
        </div>
      </div>

      <div class="footer">
        <p class="footer-text">
          InterviewForge AI • Calibrated Technical Hiring Simulator & Speech Drill
        </p>
        <p class="footer-muted">
          This is an automated security transmission. Responses to this email address are not monitored.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;

  const text = `${purposeTitle}

${purposeDescription}

Your 6-Digit Verification Code:
----------------------------------------
${otp}
----------------------------------------

* Expires in ${expiresInMinutes} minutes.
* SECURITY NOTICE: Never share this OTP with anyone. If you did not initiate this attempt, please ignore this email.

--
InterviewForge AI
Technical Hiring Simulator & Speech Drill`;

  return { subject, html, text };
}
