import nodemailer from "nodemailer";
import { generateOTPEmailHtml, OTPEmailParams } from "./templates";

export interface EmailSendResult {
  success: boolean;
  provider: "brevo" | "nodemailer" | "dev_fallback";
  messageId?: string;
  error?: string;
}

/**
 * Brevo Transactional Email Delivery (Primary Provider)
 */
async function sendViaBrevo(
  recipientEmail: string,
  subject: string,
  htmlContent: string,
  textContent: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not configured.");
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL || "security@interviewforge.ai";
  const senderName = process.env.BREVO_SENDER_NAME || "InterviewForge AI Security";

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: recipientEmail }],
    subject,
    htmlContent,
    textContent,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorBody = await res.text();
      return {
        success: false,
        error: `Brevo API HTTP ${res.status}: ${errorBody}`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      messageId: data.messageId || "brevo-accepted",
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    return {
      success: false,
      error: err.name === "AbortError" ? "Brevo API timed out (10s)" : err.message,
    };
  }
}

/**
 * Nodemailer SMTP Delivery (Automatic Fallback Provider)
 */
async function sendViaNodemailer(
  recipientEmail: string,
  subject: string,
  htmlContent: string,
  textContent: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) are not configured.");
  }

  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const from = process.env.SMTP_FROM || `InterviewForge AI <${user}>`;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
  });

  try {
    const info = await transporter.sendMail({
      from,
      to: recipientEmail,
      subject,
      text: textContent,
      html: htmlContent,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Nodemailer SMTP error: ${err.message}`,
    };
  }
}

/**
 * Dispatches an OTP Verification Email with strict Brevo-to-Nodemailer Fallback
 */
export async function sendOTPEmail(
  recipientEmail: string,
  params: OTPEmailParams
): Promise<EmailSendResult> {
  const { subject, html, text } = generateOTPEmailHtml({
    ...params,
    recipientEmail,
  });

  const brevoApiKey = process.env.BREVO_API_KEY;
  const hasSmtpConfig = !!(process.env.SMTP_HOST && process.env.SMTP_USER);

  // 1. Attempt Primary Provider: Brevo Transactional Email API
  if (brevoApiKey) {
    try {
      const brevoResult = await sendViaBrevo(recipientEmail, subject, html, text);
      if (brevoResult.success) {
        return {
          success: true,
          provider: "brevo",
          messageId: brevoResult.messageId,
        };
      }
      console.warn("[EmailService] Primary provider (Brevo) failed:", brevoResult.error);
    } catch (brevoErr: any) {
      console.warn("[EmailService] Primary provider (Brevo) error:", brevoErr.message);
    }
  }

  // 2. Attempt Fallback Provider: Nodemailer SMTP
  if (hasSmtpConfig) {
    try {
      const smtpResult = await sendViaNodemailer(recipientEmail, subject, html, text);
      if (smtpResult.success) {
        return {
          success: true,
          provider: "nodemailer",
          messageId: smtpResult.messageId,
        };
      }
      console.warn("[EmailService] Fallback provider (Nodemailer) failed:", smtpResult.error);
    } catch (smtpErr: any) {
      console.warn("[EmailService] Fallback provider (Nodemailer) error:", smtpErr.message);
    }
  }

  // 3. Development / Test Fallback (only when running locally/testing without live SMTP keys)
  if ((process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test" || !process.env.NODE_ENV) && !brevoApiKey && !hasSmtpConfig) {
    console.info(
      `[DEV ONLY EMAIL SIMULATION] OTP for ${recipientEmail}: ${params.otp} (Valid for ${params.expiresInMinutes || 5} min)`
    );
    return {
      success: true,
      provider: "dev_fallback",
      messageId: `dev-simulated-${Date.now()}`,
    };
  }

  // 4. Fail Closed: Both providers failed or neither is configured in production
  return {
    success: false,
    provider: "brevo",
    error: "Both Brevo API and Nodemailer SMTP email delivery failed. Authentication failed closed.",
  };
}
