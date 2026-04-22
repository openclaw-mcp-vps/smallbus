"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, BusFront, CalendarCheck2, LogOut, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard/routes", label: "Routes", icon: BusFront },
  { href: "/dashboard/schedules", label: "Schedules", icon: CalendarCheck2 },
  { href: "/dashboard/drivers", label: "Drivers", icon: UsersRound },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell }
] as const;

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/paywall/unlock", {
      method: "DELETE"
    });

    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <header className="sticky top-0 z-30 border-b border-[#21262d] bg-[#0d1117]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
          <Link href="/dashboard/routes" className="text-lg font-bold tracking-tight text-[#f0f6fc]">
            small_bus
          </Link>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:grid-cols-[220px_1fr] md:px-8">
        <aside className="md:sticky md:top-20 md:h-fit">
          <nav className="grid grid-cols-2 gap-2 rounded-xl border border-[#21262d] bg-[#11161e] p-2 md:grid-cols-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = (pathname ?? "").startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                    isActive
                      ? "bg-[#1f6feb] text-white"
                      : "text-[#8b949e] hover:bg-[#161b22] hover:text-[#c9d1d9]"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="space-y-6">{children}</section>
      </div>
    </div>
  );
}
