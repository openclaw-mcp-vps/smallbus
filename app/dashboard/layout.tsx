import Link from "next/link";
import { BellRing, BusFront, CalendarRange, MapPinned, Users } from "lucide-react";

import { requirePaidAccess } from "@/lib/auth";

const navItems = [
  { href: "/dashboard/routes", label: "Routes", icon: MapPinned },
  { href: "/dashboard/drivers", label: "Drivers", icon: Users },
  { href: "/dashboard/schedule", label: "Schedule", icon: CalendarRange },
  {
    href: "/dashboard/notifications",
    label: "Notifications",
    icon: BellRing,
  },
];

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requirePaidAccess("dispatcher");

  return (
    <div className="min-h-screen bg-transparent px-4 pb-10 pt-6 sm:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-border bg-[#101b2c]/95 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1 text-xs uppercase tracking-[0.12em] text-blue-200">
                <BusFront className="size-3.5" />
                small_bus operations console
              </p>
              <h1 className="mt-3 font-heading text-2xl font-semibold text-white">
                Fleet command dashboard
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Role: <span className="font-medium text-blue-200">{session.role}</span>
              </p>
            </div>
            <Link
              href="/"
              className="rounded-lg border border-border bg-[#0f1828] px-3 py-2 text-sm text-slate-200 transition hover:bg-[#18243c]"
            >
              Back to landing page
            </Link>
          </div>

          <nav className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-[#132037] px-3 py-2 text-sm text-slate-100 transition hover:border-blue-300/30 hover:bg-[#1a2a45]"
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <section>{children}</section>
      </div>
    </div>
  );
}
