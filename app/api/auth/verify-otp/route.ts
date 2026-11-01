import { NextRequest, NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyOTPChallenge } from "@/lib/auth/otp";
import {
  createSession,
  AUTH_COOKIE_NAME,
  PENDING_2FA_COOKIE_NAME,
} from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const body = await req.json();
    const { challengeId, otp } = body;

    if (!challengeId || !otp) {
      return NextResponse.json(
        { error: "Challenge ID and verification code are required." },
        { status: 400 }
      );
    }

    const verificationResult = await verifyOTPChallenge(challengeId, otp);

    if (!verificationResult.success || !verificationResult.challenge) {
      const statusCode = verificationResult.locked ? 429 : verificationResult.expired ? 410 : 400;
      return NextResponse.json(
        {
          success: false,
          error: verificationResult.error || "Verification failed.",
          attemptsRemaining: verificationResult.attemptsRemaining,
          locked: verificationResult.locked,
          expired: verificationResult.expired,
        },
        { status: statusCode }
      );
    }

    const { challenge } = verificationResult;

    // Retrieve user
    const userRows = await db.select().from(users).where(eq(users.id, challenge.userId));
    if (!userRows || userRows.length === 0) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }
    const user = userRows[0];

    // If verification was for signup, mark account email as verified
    if (challenge.purpose === "signup" || !user.emailVerified) {
      await db
        .update(users)
        .set({ emailVerified: true, updatedAt: new Date() })
        .where(eq(users.id, user.id));
    }

    // CREATE AUTHENTICATED APPLICATION SESSION
    // Remember Me: Exactly 7 days; Standard session: 12 hours
    const ip = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const { sessionToken, expiresAt } = await createSession(user.id, {
      rememberMe: challenge.rememberMe,
      ip,
      userAgent,
    });

    const redirectUrl = user.role === "admin" ? "/admin" : "/";

    const response = NextResponse.json({
      success: true,
      message: "Two-factor authentication successful.",
      redirectUrl,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    // Set secure HTTP-Only auth session cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });

    // Clear temporary 2FA pending cookie
    response.cookies.set({
      name: PENDING_2FA_COOKIE_NAME,
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error: any) {
    console.error("OTP verification error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify OTP code." },
      { status: 500 }
    );
  }
}
