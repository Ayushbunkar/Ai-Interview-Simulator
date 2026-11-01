import { NextRequest, NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyPasswordResetToken } from "@/lib/auth/tokens";
import { hashPassword } from "@/lib/auth/password";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Reset token and new password are required." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 400 });
    }

    const verification = await verifyPasswordResetToken(token);
    if (!verification.success || !verification.email) {
      return NextResponse.json({ error: verification.error || "Reset token is invalid or expired." }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.email, verification.email.toLowerCase()));

    // Delete used token
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));

    return NextResponse.json({
      success: true,
      message: "Password reset successfully! You can now log in with your new password.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to reset password." }, { status: 500 });
  }
}
