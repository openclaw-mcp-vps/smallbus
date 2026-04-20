import { Bell, Bus, Clock3, UserSquare2 } from "lucide-react";
import { DashboardCharts } from "@/components/DashboardCharts";
import { MainNav } from "@/components/MainNav";
import { readAccessFromCookies } from "@/lib/auth";
import { getDashboardStats, listNotifications, listRoutes, listSchedules } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const access = await readAccessFromCookies();
  const [stats, routes, schedules, notifications, params] = await Promise.all([
    getDashboardStats(),
    listRoutes(),
    listSchedules(),
    listNotifications(),
    searchParams
  ]);

  const widgets = [
    {
      label: "Active Routes",
      value: stats.activeRoutes,
      helper: "Operational route templates",
      icon: Bus
    },
    {
      label: "Active Drivers",
      value: stats.activeDrivers,
      helper: "Drivers ready for assignment",
      icon: UserSquare2
    },
    {
      label: "Trips Today",
      value: stats.todaysTrips,
      helper: "Non-cancelled departures",
      icon: Clock3
    },
    {
      label: "Queued Alerts",
      value: stats.queuedNotifications,
      helper: "Passenger notices waiting to send",
      icon: Bell
    }
  ];

  const upcomingSchedules = schedules.slice(0, 6);
  const latestNotifications = notifications.slice(0, 5);

  return (
    <main className="pb-12">
      <MainNav role={access.role} />

      <section className="mx-auto mt-8 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mono text-xs uppercase tracking-[0.2em] text-cyan-300">Operations Command</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-50 sm:text-4xl">Dispatch dashboard</h1>
            <p className="mt-2 text-sm text-slate-300">Monitor routes, staffing, and rider communication from one screen.</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
            Average active route duration: <span className="font-semibold text-cyan-300">{stats.avgRouteMinutes} min</span>
          </div>
        </div>

        {params.denied === "drivers" ? (
          <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
            Your current role cannot manage driver records. Ask an operations manager for elevated access.
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {widgets.map((widget) => (
            <article key={widget.label} className="card p-5">
              <widget.icon className="h-5 w-5 text-cyan-300" />
              <p className="mt-3 text-3xl font-semibold text-slate-100">{widget.value}</p>
              <p className="mt-1 text-sm text-slate-300">{widget.label}</p>
              <p className="mt-2 text-xs text-slate-500">{widget.helper}</p>
            </article>
          ))}
        </div>

        <div className="mt-6">
          <DashboardCharts routes={routes} schedules={schedules} />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <section className="card p-5">
            <h2 className="text-lg font-semibold text-slate-100">Upcoming Departures</h2>
            <div className="mt-3 grid gap-3">
              {upcomingSchedules.map((schedule) => (
                <article key={schedule.id} className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
                  <p className="text-sm font-semibold text-slate-100">{schedule.route_name}</p>
                  <p className="text-sm text-slate-300">
                    {schedule.service_date} at {schedule.departure_time}
                  </p>
                  <p className="text-xs text-slate-400">Driver: {schedule.driver_name}</p>
                </article>
              ))}
              {upcomingSchedules.length === 0 ? (
                <p className="text-sm text-slate-400">No upcoming trips scheduled yet.</p>
              ) : null}
            </div>
          </section>

          <section className="card p-5">
            <h2 className="text-lg font-semibold text-slate-100">Recent Notifications</h2>
            <div className="mt-3 grid gap-3">
              {latestNotifications.map((notice) => (
                <article key={notice.id} className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
                  <p className="text-sm text-slate-100">{notice.message}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                    {notice.channel} to {notice.recipient}
                  </p>
                </article>
              ))}
              {latestNotifications.length === 0 ? (
                <p className="text-sm text-slate-400">No notifications queued yet.</p>
              ) : null}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
