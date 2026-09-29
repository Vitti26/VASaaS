import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED_ROUTES = [
  "/agenda",
  "/billing",
  "/branches",
  "/customers",
  "/remitos",
  "/services",
  "/settings",
  "/stock",
  "/subscription",
  "/users",
];

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || "f7a93b8214cd0e2fa8b619d45e73091c6258a31e847029bd4912c01948d0eef3";
  return new TextEncoder().encode(secret);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtectedRoute) {
    const sessionCookie = req.cookies.get("vasaas_session")?.value;

    if (!sessionCookie) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      await jwtVerify(sessionCookie, getJwtSecret());
    } catch (err) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("vasaas_session");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/agenda/:path*",
    "/billing/:path*",
    "/branches/:path*",
    "/customers/:path*",
    "/remitos/:path*",
    "/services/:path*",
    "/settings/:path*",
    "/stock/:path*",
    "/subscription/:path*",
    "/users/:path*",
  ],
};
