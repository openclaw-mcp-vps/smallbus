"use client";

import { BusFront, Clock3, UserRound } from "lucide-react";

import type { Driver, ScheduleEntry } from "@/lib/database";

type DriverAssignmentProps = {
  drivers: Driver[];
  schedules: ScheduleEntry[];
};

export default function DriverAssignment({
  drivers,
  schedules,
}: DriverAssignmentProps) {
  const assignments = drivers.map((driver) => {
    const upcoming = schedules.filter(
      (entry) =>
        entry.driverId === driver.id && new Date(entry.endTime).getTime() >= Date.now(),
    );

    return {
      driver,
      upcoming,
    };
  });

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card/80 p-4">
      <header className="flex items-center gap-2">
        <UserRound className="size-4 text-blue-300" />
        <h3 className="font-heading text-base font-semibold">Driver Assignment Snapshot</h3>
      </header>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {assignments.map(({ driver, upcoming }) => (
          <article
            key={driver.id}
            className="space-y-2 rounded-xl border border-border bg-[#121f34] p-3"
          >
            <div className="flex items-center justify-between">
              <p className="font-medium">{driver.name}</p>
              <span className="rounded-full bg-[#1d3457] px-2 py-1 text-xs text-blue-100">
                {driver.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{driver.phone}</p>
            {upcoming.length ? (
              <div className="space-y-2">
                {upcoming.slice(0, 2).map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-lg border border-border bg-[#0f1828] p-2 text-xs"
                  >
                    <p className="flex items-center gap-1 font-medium text-slate-100">
                      <BusFront className="size-3.5" />
                      {entry.routeName}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-slate-300">
                      <Clock3 className="size-3.5" />
                      {new Date(entry.startTime).toLocaleString()} -{" "}
                      {new Date(entry.endTime).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No active assignments in the current schedule window.
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
