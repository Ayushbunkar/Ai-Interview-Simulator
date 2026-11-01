import { NextRequest, NextResponse } from "next/server";
import { resendOTPChallenge } from "@/lib/auth/otp";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { challengeId } = body;

    if (!challengeId) {
      return NextResponse.json({ error: "Challenge ID is required." }, { status: 400 });
    }

    const result = await resendOTPChallenge(challengeId);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || "Failed to resend verification code.",
          resendAvailableInSeconds: result.resendAvailableInSeconds,
        },
        { status: result.resendAvailableInSeconds ? 429 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "A new 6-digit verification code has been sent to your email.",
      expiresAt: result.expiresAt,
      resendAvailableInSeconds: result.resendAvailableInSeconds || 60,
    });
  } catch (error: any) {
    console.error("Resend OTP error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to resend verification code." },
      { status: 500 }
    );
  }
}
