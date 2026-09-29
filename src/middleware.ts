import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/modules/shared/infrastructure/tenant-context";

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
      await verifySessionToken(sessionCookie);
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
