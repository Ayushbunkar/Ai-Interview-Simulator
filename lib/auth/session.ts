import crypto from "crypto";
import { cookies } from "next/headers";
import { db, ensureDbInitialized } from "@/lib/db";
import { users, authSessions } from "@/lib/db/schema";
import { eq, and, gt, isNull } from "drizzle-orm";

export const AUTH_COOKIE_NAME = "interviewforge_auth_session";
export const PENDING_2FA_COOKIE_NAME = "interviewforge_2fa_pending";

// Remember Me: Exactly 7 Days; Standard Session: 12 Hours
export const SESSION_REMEMBER_ME_MS = 7 * 24 * 60 * 60 * 1000; // 7 Days
export const SESSION_STANDARD_MS = 12 * 60 * 60 * 1000; // 12 Hours

export interface SafeUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
}

export async function createSession(
  userId: string,
  options?: {
    rememberMe?: boolean;
    ip?: string;
    userAgent?: string;
  }
): Promise<{ sessionToken: string; expiresAt: Date; durationMs: number }> {
  await ensureDbInitialized();

  const isRememberMe = !!options?.rememberMe;
  const durationMs = isRememberMe ? SESSION_REMEMBER_ME_MS : SESSION_STANDARD_MS;
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + durationMs);

  await db.insert(authSessions).values({
    id: crypto.randomUUID(),
    userId,
    sessionToken,
    expiresAt,
    rememberMe: isRememberMe,
    ipAddress: options?.ip || null,
    userAgent: options?.userAgent || null,
    lastActivityAt: new Date(),
  });

  return { sessionToken, expiresAt, durationMs };
}

export async function validateSessionToken(token: string): Promise<SafeUser | null> {
  if (!token) return null;
  await ensureDbInitialized();

  const sessions = await db
    .select({
      session: authSessions,
      user: users,
    })
    .from(authSessions)
    .innerJoin(users, eq(authSessions.userId, users.id))
    .where(
      and(
        eq(authSessions.sessionToken, token),
        gt(authSessions.expiresAt, new Date()),
        isNull(authSessions.revokedAt)
      )
    );

  if (!sessions || sessions.length === 0) return null;

  const { session, user } = sessions[0];

  // Update last activity periodically (if last active > 10 min ago)
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  if (!session.lastActivityAt || new Date(session.lastActivityAt) < tenMinutesAgo) {
    db.update(authSessions)
      .set({ lastActivityAt: new Date() })
      .where(eq(authSessions.id, session.id))
      .catch(() => {});
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    emailVerified: user.emailVerified,
    image: user.image,
    createdAt: user.createdAt,
  };
}

export async function invalidateSession(sessionToken: string): Promise<void> {
  if (!sessionToken) return;
  await ensureDbInitialized();
  await db
    .update(authSessions)
    .set({ revokedAt: new Date() })
    .where(eq(authSessions.sessionToken, sessionToken));
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return await validateSessionToken(token);
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) {
    const error: any = new Error("Unauthorized");
    error.status = 401;
    throw error;
  }
  return user;
}

export async function requireAdmin(): Promise<SafeUser> {
  const user = await requireUser();
  if (user.role !== "admin") {
    const error: any = new Error("Forbidden: Admin access required");
    error.status = 403;
    throw error;
  }
  return user;
}

export function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = cookies();
  const maxAge = Math.floor((expiresAt.getTime() - Date.now()) / 1000);

  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(0, maxAge),
  });
}

export function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function setPending2FACookie(challengeId: string, email: string) {
  const cookieStore = cookies();
  const payload = JSON.stringify({ challengeId, email, issuedAt: Date.now() });

  cookieStore.set(PENDING_2FA_COOKIE_NAME, payload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60, // 10 minutes temporary window for OTP verification
  });
}

export function getPending2FACookie(): { challengeId: string; email: string } | null {
  try {
    const cookieStore = cookies();
    const raw = cookieStore.get(PENDING_2FA_COOKIE_NAME)?.value;
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearPending2FACookie() {
  const cookieStore = cookies();
  cookieStore.set(PENDING_2FA_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
