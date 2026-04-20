import { NextResponse } from "next/server";
import { applyAccessCookies, clearAccessCookies, sanitizeRole } from "@/lib/auth";

export async function POST(request: Request): Promise<NextResponse> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const formData = await request.formData();

    if (formData.get("intent") === "logout") {
      const redirect = NextResponse.redirect(new URL("/", request.url));
      return clearAccessCookies(redirect);
    }
  }

  const body = (await request.json().catch(() => ({}))) as {
    role?: string;
  };

  const role = sanitizeRole(body.role);
  const response = NextResponse.json({ success: true, role });
  return applyAccessCookies(response, role);
}

export async function DELETE(): Promise<NextResponse> {
  const response = NextResponse.json({ success: true });
  return clearAccessCookies(response);
}
