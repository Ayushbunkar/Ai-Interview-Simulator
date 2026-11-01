import crypto from "crypto";
import { db, ensureDbInitialized } from "@/lib/db";
import { otpChallenges, users } from "@/lib/db/schema";
import { eq, and, desc, isNull, gt } from "drizzle-orm";
import { sendOTPEmail } from "@/lib/email/email-service";

export const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || "5", 10);
export const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || "5", 10);
export const OTP_RESEND_COOLDOWN_SECONDS = parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS || "60", 10);

/**
 * Generates an unguessable 6-digit numeric OTP using CSPRNG
 */
export function generateNumericOTP(): string {
  const code = crypto.randomInt(100000, 1000000);
  return code.toString();
}

/**
 * Computes a secure SHA-256 hash of the plaintext OTP
 */
export function hashOTP(otp: string): string {
  return crypto.createHash("sha256").update(otp.trim()).digest("hex");
}

/**
 * Mask an email for user-facing UI (e.g. j***e@example.com)
 */
export function maskEmail(email: string): string {
  const parts = email.split("@");
  if (parts.length !== 2) return email;
  const [local, domain] = parts;
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`;
  }
  const maskedLocal = `${local[0]}${"*".repeat(Math.min(5, local.length - 2))}${local[local.length - 1]}`;
  return `${maskedLocal}@${domain}`;
}

export interface CreateChallengeResult {
  challengeId: string;
  email: string;
  maskedEmail: string;
  expiresAt: Date;
  deliveryProvider: "brevo" | "nodemailer" | "dev_fallback";
  resendAvailableInSeconds: number;
}

/**
 * Creates a database-backed OTP challenge and dispatches the OTP email
 */
export async function createOTPChallenge(
  userId: string,
  email: string,
  purpose: "login" | "signup" | "password_reset",
  rememberMe: boolean = false
): Promise<CreateChallengeResult> {
  await ensureDbInitialized();

  // 1. Invalidate any existing unconsumed challenges for this user/purpose
  await db
    .update(otpChallenges)
    .set({ consumedAt: new Date() })
    .where(
      and(
        eq(otpChallenges.userId, userId),
        eq(otpChallenges.purpose, purpose),
        isNull(otpChallenges.consumedAt)
      )
    );

  // 2. Generate secure 6-digit OTP & compute cryptographic hash
  const rawOtp = generateNumericOTP();
  const otpHash = hashOTP(rawOtp);
  const challengeId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // 3. Dispatch Email via Brevo API with automatic Nodemailer fallback
  const emailResult = await sendOTPEmail(email, {
    otp: rawOtp,
    purpose,
    expiresInMinutes: OTP_EXPIRY_MINUTES,
    recipientEmail: email,
  });

  if (!emailResult.success) {
    throw new Error(emailResult.error || "Failed to deliver OTP email. Authentication aborted.");
  }

  // 4. Save Challenge in Database (stores hash only, never plaintext OTP)
  await db.insert(otpChallenges).values({
    id: challengeId,
    userId,
    email,
    otpHash,
    purpose,
    expiresAt,
    attempts: 0,
    maxAttempts: OTP_MAX_ATTEMPTS,
    deliveryProvider: emailResult.provider,
    rememberMe: !!rememberMe,
    lastResentAt: new Date(),
  });

  return {
    challengeId,
    email,
    maskedEmail: maskEmail(email),
    expiresAt,
    deliveryProvider: emailResult.provider,
    resendAvailableInSeconds: OTP_RESEND_COOLDOWN_SECONDS,
  };
}

export interface VerifyOTPResult {
  success: boolean;
  error?: string;
  challenge?: {
    id: string;
    userId: string;
    email: string;
    purpose: string;
    rememberMe: boolean;
  };
  attemptsRemaining?: number;
  locked?: boolean;
  expired?: boolean;
}

/**
 * Verifies a submitted 6-digit OTP against the stored cryptographic hash
 */
export async function verifyOTPChallenge(
  challengeId: string,
  submittedOtp: string
): Promise<VerifyOTPResult> {
  if (!challengeId || !submittedOtp) {
    return { success: false, error: "Challenge ID and verification code are required." };
  }

  const cleanOtp = submittedOtp.trim();
  if (!/^\d{6}$/.test(cleanOtp)) {
    return { success: false, error: "Verification code must be exactly 6 numeric digits." };
  }

  await ensureDbInitialized();

  // Retrieve challenge
  const challenges = await db
    .select()
    .from(otpChallenges)
    .where(eq(otpChallenges.id, challengeId))
    .limit(1);

  if (!challenges || challenges.length === 0) {
    return { success: false, error: "Invalid or expired verification session." };
  }

  const challenge = challenges[0];

  // Check if already consumed/verified
  if (challenge.consumedAt || challenge.verifiedAt) {
    return { success: false, error: "This verification code has already been used. Please log in again." };
  }

  // Check expiration
  if (new Date() > challenge.expiresAt) {
    return { success: false, error: "Verification code has expired. Please request a new code.", expired: true };
  }

  // Check max attempts limit
  if (challenge.attempts >= challenge.maxAttempts) {
    return {
      success: false,
      error: "Too many failed attempts. This verification challenge has been locked for security.",
      locked: true,
      attemptsRemaining: 0,
    };
  }

  // Increment attempts counter
  const newAttempts = challenge.attempts + 1;
  await db
    .update(otpChallenges)
    .set({ attempts: newAttempts })
    .where(eq(otpChallenges.id, challengeId));

  // Constant-time hash comparison
  const submittedHash = hashOTP(cleanOtp);
  const expectedHashBuffer = Buffer.from(challenge.otpHash, "utf-8");
  const submittedHashBuffer = Buffer.from(submittedHash, "utf-8");

  const isMatch =
    expectedHashBuffer.length === submittedHashBuffer.length &&
    crypto.timingSafeEqual(expectedHashBuffer, submittedHashBuffer);

  if (!isMatch) {
    const attemptsRemaining = Math.max(0, challenge.maxAttempts - newAttempts);
    if (attemptsRemaining === 0) {
      return {
        success: false,
        error: "Too many failed attempts. Verification challenge locked.",
        locked: true,
        attemptsRemaining: 0,
      };
    }
    return {
      success: false,
      error: `Incorrect verification code. ${attemptsRemaining} attempt${attemptsRemaining === 1 ? "" : "s"} remaining.`,
      attemptsRemaining,
    };
  }

  // Mark challenge verified and consumed
  await db
    .update(otpChallenges)
    .set({
      verifiedAt: new Date(),
      consumedAt: new Date(),
    })
    .where(eq(otpChallenges.id, challengeId));

  return {
    success: true,
    challenge: {
      id: challenge.id,
      userId: challenge.userId,
      email: challenge.email,
      purpose: challenge.purpose,
      rememberMe: challenge.rememberMe,
    },
  };
}

/**
 * Resends a fresh OTP code for an active challenge, enforcing cooldown
 */
export async function resendOTPChallenge(challengeId: string): Promise<{
  success: boolean;
  error?: string;
  expiresAt?: Date;
  resendAvailableInSeconds?: number;
}> {
  await ensureDbInitialized();

  const challenges = await db
    .select()
    .from(otpChallenges)
    .where(eq(otpChallenges.id, challengeId))
    .limit(1);

  if (!challenges || challenges.length === 0) {
    return { success: false, error: "Verification challenge not found." };
  }

  const challenge = challenges[0];

  if (challenge.consumedAt) {
    return { success: false, error: "Challenge already completed." };
  }

  // Enforce resend cooldown
  const elapsedSeconds = Math.floor((Date.now() - new Date(challenge.lastResentAt).getTime()) / 1000);
  if (elapsedSeconds < OTP_RESEND_COOLDOWN_SECONDS) {
    const remainingSeconds = OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds;
    return {
      success: false,
      error: `Please wait ${remainingSeconds} seconds before requesting a new code.`,
      resendAvailableInSeconds: remainingSeconds,
    };
  }

  // Generate new OTP & hash
  const rawOtp = generateNumericOTP();
  const otpHash = hashOTP(rawOtp);
  const newExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Send email
  const emailResult = await sendOTPEmail(challenge.email, {
    otp: rawOtp,
    purpose: challenge.purpose as any,
    expiresInMinutes: OTP_EXPIRY_MINUTES,
    recipientEmail: challenge.email,
  });

  if (!emailResult.success) {
    return { success: false, error: emailResult.error || "Failed to deliver email." };
  }

  // Update DB challenge with new hash, reset attempts counter, reset expiry
  await db
    .update(otpChallenges)
    .set({
      otpHash,
      attempts: 0,
      expiresAt: newExpiresAt,
      lastResentAt: new Date(),
      deliveryProvider: emailResult.provider,
    })
    .where(eq(otpChallenges.id, challengeId));

  return {
    success: true,
    expiresAt: newExpiresAt,
    resendAvailableInSeconds: OTP_RESEND_COOLDOWN_SECONDS,
  };
}
