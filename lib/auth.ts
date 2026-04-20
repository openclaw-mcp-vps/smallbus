import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextResponse } from "next/server";

export type UserRole = "dispatcher" | "manager" | "owner";

export const ACCESS_COOKIE = "smallbus_paid";
export const ROLE_COOKIE = "smallbus_role";

const rolePriority: Record<UserRole, number> = {
  dispatcher: 1,
  manager: 2,
  owner: 3,
};

export function isRoleAtLeast(role: UserRole, minimumRole: UserRole) {
  return rolePriority[role] >= rolePriority[minimumRole];
}

function normalizeRole(value?: string): UserRole {
  if (value === "dispatcher" || value === "manager" || value === "owner") {
    return value;
  }

  return "manager";
}

export async function getSessionContext() {
  const store = await cookies();
  const paid = store.get(ACCESS_COOKIE)?.value === "true";
  const role = normalizeRole(store.get(ROLE_COOKIE)?.value);

  return {
    paid,
    role,
  };
}

export async function requirePaidAccess(minimumRole: UserRole = "dispatcher") {
  const session = await getSessionContext();

  if (!session.paid) {
    redirect("/?paywall=locked#pricing");
  }

  if (!isRoleAtLeast(session.role, minimumRole)) {
    redirect("/dashboard/routes?access=denied");
  }

  return session;
}

export function applyPaidAccessCookie(
  response: NextResponse,
  role: UserRole = "manager",
) {
  const isProduction = process.env.NODE_ENV === "production";

  response.cookies.set(ACCESS_COOKIE, "true", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  response.cookies.set(ROLE_COOKIE, role, {
    httpOnly: false,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}

export function clearPaidAccessCookie(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, "false", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set(ROLE_COOKIE, "manager", {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
