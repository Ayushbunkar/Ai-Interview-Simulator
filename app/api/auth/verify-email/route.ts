import { NextRequest, NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/auth/tokens";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: "Verification token is required." }, { status: 400 });
    }

    const result = await verifyEmailToken(token);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Invalid or expired token." }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Email verified successfully! You can now log in.",
      email: result.email,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to verify email." }, { status: 500 });
  }
}
