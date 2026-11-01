import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const AUTH_COOKIE_NAME = "interviewforge_auth_session";

// Routes that strictly require authentication
const PROTECTED_PREFIXES = [
  "/interview/new",
  "/interview/",
  "/settings",
  "/admin",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  const isProtected = PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix));

  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If already logged in, visiting /login or /signup redirects to dashboard
  if ((pathname === "/login" || pathname === "/signup") && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/interview/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/login",
    "/signup",
  ],
};
