import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { UserRole } from "@/lib/types";

export const ACCESS_COOKIE_NAME = "smallbus_access";
export const ROLE_COOKIE_NAME = "smallbus_role";

const roleList: UserRole[] = ["manager", "dispatcher", "viewer"];

export function sanitizeRole(input: unknown): UserRole {
  if (typeof input !== "string") {
    return "viewer";
  }

  return roleList.includes(input as UserRole) ? (input as UserRole) : "viewer";
}

export function hasPaidAccessFromRequest(request: NextRequest): boolean {
  return request.cookies.get(ACCESS_COOKIE_NAME)?.value === "active";
}

export function readRoleFromRequest(request: NextRequest): UserRole {
  return sanitizeRole(request.cookies.get(ROLE_COOKIE_NAME)?.value);
}

export async function readAccessFromCookies(): Promise<{ hasAccess: boolean; role: UserRole }> {
  const store = await cookies();

  return {
    hasAccess: store.get(ACCESS_COOKIE_NAME)?.value === "active",
    role: sanitizeRole(store.get(ROLE_COOKIE_NAME)?.value)
  };
}

export function applyAccessCookies(response: NextResponse, role: UserRole): NextResponse {
  const maxAge = 60 * 60 * 24 * 30;
  const common = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge
  };

  response.cookies.set(ACCESS_COOKIE_NAME, "active", common);
  response.cookies.set(ROLE_COOKIE_NAME, role, common);

  return response;
}

export function clearAccessCookies(response: NextResponse): NextResponse {
  response.cookies.set(ACCESS_COOKIE_NAME, "", { maxAge: 0, path: "/" });
  response.cookies.set(ROLE_COOKIE_NAME, "", { maxAge: 0, path: "/" });

  return response;
}
