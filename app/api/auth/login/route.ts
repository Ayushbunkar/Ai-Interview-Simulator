import { NextRequest, NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, AUTH_COOKIE_NAME, SESSION_DURATION_MS } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const body = await req.json();
    const { email, password } = body;

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

    // Require email verification
    if (!user.emailVerified) {
      return NextResponse.json(
        {
          error: "EMAIL_NOT_VERIFIED",
          message: "Please verify your email address before logging in.",
          email: user.email,
        },
        { status: 403 }
      );
    }

    const ip = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const { sessionToken, expiresAt } = await createSession(user.id, { ip, userAgent });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
      maxAge: Math.floor(SESSION_DURATION_MS / 1000),
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Authentication error." }, { status: 500 });
  }
}
