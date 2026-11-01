import { NextResponse } from "next/server";
import crypto from "crypto";
import { getGoogleAuthUrl } from "@/lib/auth/google";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = crypto.randomBytes(16).toString("hex");
    const url = getGoogleAuthUrl(state);
    return NextResponse.redirect(url);
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Google OAuth is not configured yet.",
        message: err.message || "Please provide GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment variables.",
      },
      { status: 500 }
    );
  }
}
