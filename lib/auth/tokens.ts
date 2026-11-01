import crypto from "crypto";
import { db, ensureDbInitialized } from "@/lib/db";
import { emailVerificationTokens, passwordResetTokens, users } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";

export async function generateVerificationToken(email: string): Promise<string> {
  await ensureDbInitialized();
  // 6-character clean numeric code or 32-char token
  const token = crypto.randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Delete any existing tokens for this email
  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.email, email.toLowerCase()));

  await db.insert(emailVerificationTokens).values({
    id: crypto.randomUUID(),
    email: email.toLowerCase(),
    token,
    expiresAt,
  });

  return token;
}

export async function verifyEmailToken(token: string): Promise<{ success: boolean; email?: string; error?: string }> {
  await ensureDbInitialized();
  if (!token) return { success: false, error: "Missing token" };

  const rows = await db
    .select()
    .from(emailVerificationTokens)
    .where(and(eq(emailVerificationTokens.token, token), gt(emailVerificationTokens.expiresAt, new Date())));

  if (!rows || rows.length === 0) {
    return { success: false, error: "Verification link is invalid or has expired." };
  }

  const record = rows[0];
  const email = record.email.toLowerCase();

  // Mark user as email_verified
  await db.update(users).set({ emailVerified: true, updatedAt: new Date() }).where(eq(users.email, email));

  // Delete used token
  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.id, record.id));

  return { success: true, email };
}

export async function generatePasswordResetToken(email: string): Promise<string> {
  await ensureDbInitialized();
  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.email, email.toLowerCase()));

  await db.insert(passwordResetTokens).values({
    id: crypto.randomUUID(),
    email: email.toLowerCase(),
    token,
    expiresAt,
  });

  return token;
}

export async function verifyPasswordResetToken(token: string): Promise<{ success: boolean; email?: string; error?: string }> {
  await ensureDbInitialized();
  if (!token) return { success: false, error: "Missing token" };

  const rows = await db
    .select()
    .from(passwordResetTokens)
    .where(and(eq(passwordResetTokens.token, token), gt(passwordResetTokens.expiresAt, new Date())));

  if (!rows || rows.length === 0) {
    return { success: false, error: "Password reset link is invalid or has expired." };
  }

  return { success: true, email: rows[0].email };
}
