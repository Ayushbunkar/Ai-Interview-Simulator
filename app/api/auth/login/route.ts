import { NextRequest, NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/auth/password";
import { createOTPChallenge } from "@/lib/auth/otp";
import { setPending2FACookie } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const body = await req.json();
    const { email, password, rememberMe } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userRows = await db.select().from(users).where(eq(users.email, normalizedEmail));

    if (!userRows || userRows.length === 0) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const user = userRows[0];

    // If user registered with Google OAuth only
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "This account was registered using Google. Please click 'Continue with Google'." },
        { status: 400 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // MANDATORY 2FA: Generate 6-Digit OTP & Dispatch via Brevo -> Nodemailer
    // NO session is created here. Access to the app remains completely blocked.
    const challenge = await createOTPChallenge(user.id, user.email, "login", !!rememberMe);

    // Set short-lived secure cookie for the OTP challenge session
    setPending2FACookie(challenge.challengeId, user.email);

    return NextResponse.json({
      require2fa: true,
      challengeId: challenge.challengeId,
      email: challenge.maskedEmail,
      expiresAt: challenge.expiresAt,
      resendAvailableInSeconds: challenge.resendAvailableInSeconds,
      deliveryProvider: challenge.deliveryProvider,
    });
  } catch (error: any) {
    console.error("Login 2FA initialization error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initiate login verification. Please try again." },
      { status: 500 }
    );
  }
}
