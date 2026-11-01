import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db, ensureDbInitialized } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { exchangeGoogleCodeForTokens, getGoogleUserProfile } from "@/lib/auth/google";
import { createOTPChallenge } from "@/lib/auth/otp";
import { PENDING_2FA_COOKIE_NAME } from "@/lib/auth/session";

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

    // MANDATORY 2FA FOR GOOGLE LOGIN:
    // Generate 6-digit OTP and send to verified email address.
    // DO NOT create an authenticated session yet.
    const challenge = await createOTPChallenge(userId, normalizedEmail, "login", true);

    const redirectResponse = NextResponse.redirect(
      `${baseUrl}/verify-otp?challenge=${challenge.challengeId}&email=${encodeURIComponent(normalizedEmail)}`
    );

    redirectResponse.cookies.set({
      name: PENDING_2FA_COOKIE_NAME,
      value: JSON.stringify({ challengeId: challenge.challengeId, email: normalizedEmail, issuedAt: Date.now() }),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60,
    });

    return redirectResponse;
  } catch (err: any) {
    console.error("Google OAuth Callback Error:", err);
    return NextResponse.redirect(
      `${baseUrl}/login?error=${encodeURIComponent(err.message || "Authentication failed during Google login.")}`
    );
  }
}
