import { MainNav } from "@/components/MainNav";
import { ScheduleWorkspace } from "@/components/ScheduleWorkspace";
import { readAccessFromCookies } from "@/lib/auth";
import { listDrivers, listRoutes, listSchedules } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Schedule",
  description: "Assign drivers, manage departures, and monitor trip execution timelines."
};

export default async function SchedulePage() {
  const access = await readAccessFromCookies();
  const [routes, drivers, schedules] = await Promise.all([listRoutes(), listDrivers(), listSchedules()]);

  return (
    <main className="pb-12">
      <MainNav role={access.role} />

      <section className="mx-auto mt-8 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold text-slate-50 sm:text-4xl">Service Scheduling</h1>
        <p className="mt-2 text-sm text-slate-300">
          Coordinate route departures with available drivers and keep dispatch synchronized.
        </p>

        <div className="mt-6">
          <ScheduleWorkspace routes={routes} drivers={drivers} initialSchedules={schedules} role={access.role} />
        </div>
      </section>
    </main>
  );
}
