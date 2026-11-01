import crypto from "crypto";
import { cookies } from "next/headers";
import { db, ensureDbInitialized } from "@/lib/db";
import { users, authSessions } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";

export const AUTH_COOKIE_NAME = "interviewforge_auth_session";
export const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 Days

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
  reqHeaders?: { ip?: string; userAgent?: string }
): Promise<{ sessionToken: string; expiresAt: Date }> {
  await ensureDbInitialized();
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.insert(authSessions).values({
    id: crypto.randomUUID(),
    userId,
    sessionToken,
    expiresAt,
    ipAddress: reqHeaders?.ip || null,
    userAgent: reqHeaders?.userAgent || null,
  });

  return { sessionToken, expiresAt };
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
    .where(and(eq(authSessions.sessionToken, token), gt(authSessions.expiresAt, new Date())));

  if (!sessions || sessions.length === 0) return null;

  const { user } = sessions[0];
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
  await db.delete(authSessions).where(eq(authSessions.sessionToken, sessionToken));
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
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireAdmin(): Promise<SafeUser> {
  const user = await requireUser();
  if (user.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
  return user;
}
