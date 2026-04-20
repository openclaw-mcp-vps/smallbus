"use client";

import { useState } from "react";
import { DriverAssignment } from "@/components/DriverAssignment";
import { ScheduleCalendar } from "@/components/ScheduleCalendar";
import type { DriverItem, RouteItem, ScheduleItem, ScheduleView, UserRole } from "@/lib/types";

export function ScheduleWorkspace({
  routes,
  drivers,
  initialSchedules,
  role
}: {
  routes: RouteItem[];
  drivers: DriverItem[];
  initialSchedules: ScheduleView[];
  role: UserRole;
}) {
  const [schedules, setSchedules] = useState<ScheduleView[]>(initialSchedules);

  const handleCreated = (assignment: ScheduleItem): void => {
    const routeName = routes.find((item) => item.id === assignment.route_id)?.name ?? "Unknown Route";
    const driverName = drivers.find((item) => item.id === assignment.driver_id)?.name ?? "Unassigned";

    setSchedules((current) => [
      {
        ...assignment,
        route_name: routeName,
        driver_name: driverName
      },
      ...current
    ]);
  };

  return (
    <div className="grid gap-6">
      {role === "viewer" ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
          Viewer role can review schedules but cannot create new assignments.
        </div>
      ) : (
        <DriverAssignment routes={routes} drivers={drivers} onCreated={handleCreated} />
      )}

      <ScheduleCalendar schedules={schedules} />

      <section className="card p-5">
        <h3 className="text-lg font-semibold text-slate-100">Trip Assignment Log</h3>
        <p className="mt-1 text-sm text-slate-400">Latest route and driver pairings for dispatch review.</p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] border-separate border-spacing-y-2 text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="px-3">Date</th>
                <th className="px-3">Time</th>
                <th className="px-3">Route</th>
                <th className="px-3">Driver</th>
                <th className="px-3">Status</th>
                <th className="px-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {schedules.slice(0, 12).map((schedule) => (
                <tr key={schedule.id} className="rounded-lg bg-slate-900/60 text-slate-200">
                  <td className="rounded-l-lg px-3 py-2">{schedule.service_date}</td>
                  <td className="px-3 py-2">{schedule.departure_time}</td>
                  <td className="px-3 py-2">{schedule.route_name}</td>
                  <td className="px-3 py-2">{schedule.driver_name}</td>
                  <td className="px-3 py-2 capitalize">{schedule.status.replace("_", " ")}</td>
                  <td className="rounded-r-lg px-3 py-2 text-slate-400">{schedule.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
