import { NextRequest, NextResponse } from "next/server";
import { invalidateSession, AUTH_COOKIE_NAME } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (token) {
    await invalidateSession(token);
  }

  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}
