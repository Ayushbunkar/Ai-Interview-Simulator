import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const AUTH_COOKIE_NAME = "interviewforge_auth_session";
export const PENDING_2FA_COOKIE_NAME = "interviewforge_2fa_pending";

// Routes that strictly require completed two-factor authentication
const PROTECTED_PREFIXES = [
  "/interview/new",
  "/interview/",
  "/reports",
  "/settings",
  "/admin",
];

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const pending2fa = request.cookies.get(PENDING_2FA_COOKIE_NAME)?.value;

  const isProtected = PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix));

  // 1. Strict route protection: unauthenticated users MUST NOT access protected application routes
  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. If already logged in with full session, visiting login/signup/verify-otp redirects to dashboard
  if ((pathname === "/login" || pathname === "/signup" || pathname === "/verify-otp") && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 3. Visiting /verify-otp with no challenge in query and no pending cookie -> redirect to login
  if (pathname === "/verify-otp" && !searchParams.get("challenge") && !searchParams.get("challengeId") && !pending2fa) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/interview/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/login",
    "/signup",
    "/verify-otp",
  ],
};
