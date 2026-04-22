import { cookies } from "next/headers";

const ACCESS_COOKIE = "smallbus_access";

export async function hasDashboardAccess() {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_COOKIE)?.value === "granted";
}

export function getAccessCookieName() {
  return ACCESS_COOKIE;
}
