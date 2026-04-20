import Link from "next/link";
import type { UserRole } from "@/lib/types";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/routes", label: "Routes" },
  { href: "/drivers", label: "Drivers" },
  { href: "/schedule", label: "Schedule" },
  { href: "/notifications", label: "Notifications" }
] as const;

export function MainNav({ role }: { role: UserRole }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/70 bg-[#0d1117]/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-cyan-300">
            small_bus
          </Link>
          <span className="mono rounded-full border border-slate-700 px-2 py-1 text-xs uppercase tracking-wide text-slate-300">
            {role}
          </span>
        </div>

        <nav className="hidden items-center gap-2 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-cyan-300"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <form action="/api/access/activate" method="post" className="flex items-center gap-2">
          <input type="hidden" name="intent" value="logout" />
          <button
            type="submit"
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-rose-400 hover:text-rose-300"
          >
            Sign out
          </button>
        </form>
      </div>

      <nav className="mx-auto flex w-full max-w-7xl items-center gap-2 overflow-x-auto px-4 pb-3 md:hidden sm:px-6 lg:px-8">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="shrink-0 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-300 transition hover:border-cyan-600 hover:text-cyan-300"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
