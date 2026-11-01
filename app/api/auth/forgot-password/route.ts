import { NextRequest, NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generatePasswordResetToken } from "@/lib/auth/tokens";

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
      // Avoid enumeration
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, password reset instructions have been generated.",
      });
    }

    const token = await generatePasswordResetToken(normalizedEmail);

    return NextResponse.json({
      success: true,
      message: "Password reset link generated.",
      resetToken: process.env.NODE_ENV !== "production" ? token : undefined,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process request." }, { status: 500 });
  }
}
