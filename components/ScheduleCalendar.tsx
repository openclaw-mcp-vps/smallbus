"use client";

import { useMemo } from "react";
import { Calendar, dateFnsLocalizer, type Event } from "react-big-calendar";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { enUS } from "date-fns/locale";
import type { DriverRecord, RouteRecord, ScheduleRecord } from "@/lib/db/schema";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: {
    "en-US": enUS
  }
});

export function ScheduleCalendar({
  schedules,
  routes,
  drivers
}: {
  schedules: ScheduleRecord[];
  routes: RouteRecord[];
  drivers: DriverRecord[];
}) {
  const events = useMemo<Event[]>(() => {
    return schedules.map((schedule) => {
      const route = routes.find((item) => item.id === schedule.routeId);
      const driver = drivers.find((item) => item.id === schedule.driverId);

      return {
        title: `${route?.name ?? "Route"} • ${driver?.name ?? "Unassigned"}`,
        start: new Date(schedule.departureTime),
        end: new Date(schedule.arrivalTime),
        allDay: false,
        resource: schedule
      };
    });
  }, [drivers, routes, schedules]);

  return (
    <div className="h-[520px] rounded-xl border border-[#30363d] bg-[#11161e] p-3">
      <Calendar
        localizer={localizer}
        events={events}
        views={["month", "week", "day", "agenda"]}
        defaultView="week"
        step={30}
        popup
      />
    </div>
  );
}
