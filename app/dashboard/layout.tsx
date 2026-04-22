import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const accessCookie = cookieStore.get("smallbus_access")?.value;

  if (accessCookie !== "granted") {
    redirect("/unlock");
  }

  return <DashboardShell>{children}</DashboardShell>;
}
