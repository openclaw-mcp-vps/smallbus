import { NextResponse } from "next/server";

import { applyPaidAccessCookie } from "@/lib/auth";
import { verifyCheckoutAccessToken } from "@/lib/lemon-squeezy";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const payload = verifyCheckoutAccessToken(token);

  if (!payload) {
    return NextResponse.redirect(new URL("/?purchase=failed#pricing", url.origin));
  }

  const redirectResponse = NextResponse.redirect(
    new URL("/dashboard/routes?purchase=success", url.origin),
  );

  applyPaidAccessCookie(redirectResponse, payload.role);
  return redirectResponse;
}
