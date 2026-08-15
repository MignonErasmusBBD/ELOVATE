import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  if (sessionCookie === null || sessionCookie === "") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/courses",
    "/courses/:path*",
    "/educator",
    "/educator/:path*",
    "/admin",
    "/admin/:path*",
    "/community",
    "/community/:path*",
    "/platform",
    "/platform/:path*",
    "/student/:path*",
    "/dashboard",
  ],
};
