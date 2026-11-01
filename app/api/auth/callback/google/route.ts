import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db, ensureDbInitialized } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { exchangeGoogleCodeForTokens, getGoogleUserProfile } from "@/lib/auth/google";
import { createSession, AUTH_COOKIE_NAME, SESSION_DURATION_MS } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const baseUrl = req.nextUrl.origin;

  if (error || !code) {
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(error || "Google authorization was cancelled.")}`);
  }

  try {
    await ensureDbInitialized();
    const { accessToken } = await exchangeGoogleCodeForTokens(code);
    const profile = await getGoogleUserProfile(accessToken);

    // Strict requirement: verify Google returned email_verified
    if (!profile.email_verified || !profile.email) {
      return NextResponse.redirect(
        `${baseUrl}/login?error=${encodeURIComponent("Google account email is not verified. Please use a verified Google account.")}`
      );
    }

    const normalizedEmail = profile.email.toLowerCase().trim();

    // Check existing user
    const existing = await db.select().from(users).where(eq(users.email, normalizedEmail));

    let userId: string;

    if (existing && existing.length > 0) {
      const user = existing[0];
      userId = user.id;

      // Secure account linking & ensure verified
      await db
        .update(users)
        .set({
          googleId: profile.sub,
          emailVerified: true,
          name: user.name || profile.name,
          image: user.image || profile.picture || null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
    } else {
      // Create user
      const userCountRes = await db.select({ count: sql<number>`count(*)` }).from(users);
      const userCount = Number(userCountRes[0]?.count || 0);
      const role = userCount === 0 ? "admin" : "user";

      userId = crypto.randomUUID();
      await db.insert(users).values({
        id: userId,
        email: normalizedEmail,
        name: profile.name || normalizedEmail.split("@")[0],
        googleId: profile.sub,
        role,
        emailVerified: true,
        image: profile.picture || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const ip = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const { sessionToken, expiresAt } = await createSession(userId, { ip, userAgent });

    const redirectResponse = NextResponse.redirect(`${baseUrl}/`);

    redirectResponse.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
      maxAge: Math.floor(SESSION_DURATION_MS / 1000),
    });

    return redirectResponse;
  } catch (err: any) {
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(err.message || "Failed to sign in with Google.")}`);
  }
}
