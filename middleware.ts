import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { hasPaidAccessFromRequest, readRoleFromRequest } from "@/lib/auth";

const protectedPages = ["/dashboard", "/routes", "/drivers", "/schedule", "/notifications"];
const protectedApis = ["/api/routes", "/api/drivers", "/api/schedule", "/api/notifications"];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  const requiresPageAccess = protectedPages.some((path) => pathname.startsWith(path));
  const requiresApiAccess = protectedApis.some((path) => pathname.startsWith(path));

  if (!requiresPageAccess && !requiresApiAccess) {
    return NextResponse.next();
  }

  if (!hasPaidAccessFromRequest(request)) {
    if (requiresApiAccess) {
      return NextResponse.json({ error: "Subscription required" }, { status: 402 });
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/pricing";
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = readRoleFromRequest(request);

  if (pathname.startsWith("/drivers") && role === "viewer") {
    const deniedUrl = request.nextUrl.clone();
    deniedUrl.pathname = "/dashboard";
    deniedUrl.searchParams.set("denied", "drivers");
    return NextResponse.redirect(deniedUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/routes/:path*", "/drivers/:path*", "/schedule/:path*", "/notifications/:path*", "/api/routes/:path*", "/api/drivers/:path*", "/api/schedule/:path*", "/api/notifications/:path*"]
};
