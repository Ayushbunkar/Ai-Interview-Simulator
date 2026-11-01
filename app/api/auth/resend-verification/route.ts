import { NextRequest, NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateVerificationToken } from "@/lib/auth/tokens";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const rows = await db.select().from(users).where(eq(users.email, normalizedEmail));

    if (!rows || rows.length === 0) {
      // Return success anyway to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a new verification link has been generated.",
      });
    }

    const user = rows[0];
    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: "This email is already verified. You can log in directly.",
        alreadyVerified: true,
      });
    }

    const token = await generateVerificationToken(normalizedEmail);

    return NextResponse.json({
      success: true,
      message: "Verification link sent! Please check your inbox.",
      verificationToken: process.env.NODE_ENV !== "production" ? token : undefined,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to resend verification." }, { status: 500 });
  }
}
