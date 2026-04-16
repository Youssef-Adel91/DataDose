import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role as string | undefined;
    const path = req.nextUrl.pathname;

    // ─── SUPER_ADMIN-only routes ───────────────────────────────────────────
    if (path.startsWith("/dashboard/super-admin") && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/login?error=UnauthorizedAccess", req.url));
    }

    // ─── Admin routes: ADMIN or SUPER_ADMIN only (TC-2 critical fix) ──────
    if (
      path.startsWith("/dashboard/admin") &&
      role !== "ADMIN" &&
      role !== "SUPER_ADMIN"
    ) {
      return NextResponse.redirect(new URL("/login?error=UnauthorizedAccess", req.url));
    }

    // ─── Physician routes ─────────────────────────────────────────────────
    if (
      path.startsWith("/dashboard/physician") &&
      role !== "PHYSICIAN" &&
      role !== "ADMIN" &&
      role !== "SUPER_ADMIN"
    ) {
      return NextResponse.redirect(new URL("/login?error=UnauthorizedAccess", req.url));
    }

    // ─── Pharmacist routes ────────────────────────────────────────────────
    if (
      path.startsWith("/dashboard/pharmacist") &&
      role !== "PHARMACIST" &&
      role !== "ADMIN" &&
      role !== "SUPER_ADMIN"
    ) {
      return NextResponse.redirect(new URL("/login?error=UnauthorizedAccess", req.url));
    }

    // ─── Patient routes ───────────────────────────────────────────────────
    if (
      path.startsWith("/dashboard/patient") &&
      role !== "PATIENT" &&
      role !== "SUPER_ADMIN"
    ) {
      return NextResponse.redirect(new URL("/login?error=UnauthorizedAccess", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // First gate: must have a valid JWT token at all
      authorized: ({ token }) => !!token,
    },
    secret: process.env.NEXTAUTH_SECRET,
  }
);

// Protect all dashboard sub-routes
export const config = {
  matcher: ["/dashboard/:path*"],
};
