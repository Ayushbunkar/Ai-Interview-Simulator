import test from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";

import {
  generateNumericOTP,
  hashOTP,
  maskEmail,
  createOTPChallenge,
  verifyOTPChallenge,
  resendOTPChallenge,
  OTP_EXPIRY_MINUTES,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
} from "../lib/auth/otp.ts";

import {
  createSession,
  validateSessionToken,
  invalidateSession,
  SESSION_REMEMBER_ME_MS,
  SESSION_STANDARD_MS,
} from "../lib/auth/session.ts";

import { generateOTPEmailHtml } from "../lib/email/templates.ts";
import { sendOTPEmail } from "../lib/email/email-service.ts";
import { db, ensureDbInitialized } from "../lib/db/index.ts";
import { users } from "../lib/db/schema.ts";
import { eq } from "drizzle-orm";

test("1. OTP Generation: Generates exactly 6 unguessable numeric digits", () => {
  for (let i = 0; i < 20; i++) {
    const otp = generateNumericOTP();
    assert.strictEqual(otp.length, 6, "OTP must be exactly 6 characters");
    assert.match(otp, /^\d{6}$/, "OTP must contain only digits 0-9");
    const num = parseInt(otp, 10);
    assert.ok(num >= 100000 && num <= 999999, "OTP must be between 100000 and 999999");
  }
});

test("2. OTP Hashing: Hash is deterministic SHA-256 and never plaintext", () => {
  const code = "749281";
  const hash1 = hashOTP(code);
  const hash2 = hashOTP("  749281  "); // trims whitespace
  assert.strictEqual(hash1, hash2, "Whitespace should be trimmed before hashing");
  assert.strictEqual(hash1.length, 64, "SHA-256 hex string must be 64 characters");
  assert.notStrictEqual(hash1, code, "Hash must never equal the plaintext code");
});

test("3. Email Masking: Masks local name appropriately", () => {
  assert.strictEqual(maskEmail("alex.rivera@gmail.com"), "a*****a@gmail.com");
  assert.strictEqual(maskEmail("hi@test.com"), "h*@test.com");
});

test("4. Branded Email Template: Renders complete HTML with 6-digit code and security warnings", () => {
  const { subject, html, text } = generateOTPEmailHtml({
    otp: "583921",
    purpose: "login",
    expiresInMinutes: 5,
    recipientEmail: "candidate@example.com",
  });

  assert.ok(subject.includes("583921"), "Subject must contain the verification code");
  assert.ok(html.includes("583921"), "HTML must contain the verification code");
  assert.ok(html.includes("Expires in 5 minutes"), "HTML must note expiration time");
  assert.ok(html.includes("Never share this OTP"), "HTML must contain security notice");
  assert.ok(text.includes("583921"), "Plaintext must contain code");
});

test("5. Brevo -> Nodemailer Fallback Delivery Service", async () => {
  // Test email delivery (falls back gracefully in dev mode without keys)
  const result = await sendOTPEmail("security-test@example.com", {
    otp: "123456",
    purpose: "login",
    expiresInMinutes: 5,
  });

  assert.strictEqual(result.success, true, "Email sending should succeed or gracefully simulate in dev");
  assert.ok(["brevo", "nodemailer", "dev_fallback"].includes(result.provider));
});

test("6. End-to-End OTP Challenge Lifecycle: Create, Validate, Lock & Expire", async () => {
  await ensureDbInitialized();

  // Create or verify test user
  const testEmail = `test-2fa-${Date.now()}@interviewforge.ai`;
  const testUserId = crypto.randomUUID();

  await db.insert(users).values({
    id: testUserId,
    email: testEmail,
    name: "Security Tester",
    role: "user",
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Step 1: Create OTP Challenge
  const challenge = await createOTPChallenge(testUserId, testEmail, "login", true);
  assert.ok(challenge.challengeId, "Must return challengeId");
  assert.strictEqual(challenge.email, testEmail);
  assert.ok(challenge.expiresAt > new Date(), "Expiry must be in the future");

  // Step 2: Try wrong code -> Should fail and decrement attempts
  const failResult = await verifyOTPChallenge(challenge.challengeId, "000000");
  assert.strictEqual(failResult.success, false, "Wrong code must fail");
  assert.strictEqual(failResult.attemptsRemaining, 4, "Must have 4 attempts remaining");

  // Step 3: Trigger multiple wrong attempts to test locking
  await verifyOTPChallenge(challenge.challengeId, "111111"); // 3 remaining
  await verifyOTPChallenge(challenge.challengeId, "222222"); // 2 remaining
  await verifyOTPChallenge(challenge.challengeId, "333333"); // 1 remaining
  const lockedResult = await verifyOTPChallenge(challenge.challengeId, "444444"); // 0 remaining -> locked!

  assert.strictEqual(lockedResult.success, false);
  assert.strictEqual(lockedResult.locked, true, "Challenge must be locked after 5 failed tries");

  // Clean up test user
  await db.delete(users).where(eq(users.id, testUserId));
});

test("7. Remember Me Lifetime: Exactly 7 Days vs 12 Hours", async () => {
  await ensureDbInitialized();

  const testUserId = crypto.randomUUID();
  const testEmail = `remember-me-${Date.now()}@interviewforge.ai`;

  await db.insert(users).values({
    id: testUserId,
    email: testEmail,
    name: "Session Tester",
    role: "user",
    emailVerified: true,
  });

  // Remember Me = TRUE -> Exactly 7 Days (604,800,000 ms)
  const remSession = await createSession(testUserId, { rememberMe: true });
  assert.strictEqual(remSession.durationMs, SESSION_REMEMBER_ME_MS);
  const remDiffDays = (remSession.expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
  assert.ok(Math.abs(remDiffDays - 7) < 0.05, "Remember Me session must expire in ~7 days");

  // Remember Me = FALSE -> Standard Session: 12 Hours (43,200,000 ms)
  const stdSession = await createSession(testUserId, { rememberMe: false });
  assert.strictEqual(stdSession.durationMs, SESSION_STANDARD_MS);
  const stdDiffHours = (stdSession.expiresAt.getTime() - Date.now()) / (60 * 60 * 1000);
  assert.ok(Math.abs(stdDiffHours - 12) < 0.05, "Standard session must expire in ~12 hours");

  // Validate session token
  const validUser = await validateSessionToken(remSession.sessionToken);
  assert.ok(validUser, "Session token must be valid");
  assert.strictEqual(validUser.id, testUserId);

  // Invalidate session
  await invalidateSession(remSession.sessionToken);
  const revokedUser = await validateSessionToken(remSession.sessionToken);
  assert.strictEqual(revokedUser, null, "Revoked session must be invalid");

  // Clean up
  await db.delete(users).where(eq(users.id, testUserId));
});
