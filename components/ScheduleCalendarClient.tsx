"use client";

import { useMemo } from "react";
import { dateFnsLocalizer, Calendar as BigCalendar } from "react-big-calendar";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { enUS } from "date-fns/locale";

import type { ScheduleEntry } from "@/lib/database";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

type ScheduleCalendarClientProps = {
  entries: ScheduleEntry[];
};

export default function ScheduleCalendarClient({
  entries,
}: ScheduleCalendarClientProps) {
  const events = useMemo(
    () =>
      entries.map((entry) => ({
        id: entry.id,
        title: `${entry.routeName ?? "Route"} • ${entry.driverName ?? "Unassigned"}`,
        start: new Date(entry.startTime),
        end: new Date(entry.endTime),
        resource: entry,
      })),
    [entries],
  );

  return (
    <div className="space-y-3">
      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        popup
        style={{ height: 560 }}
        eventPropGetter={(event) => {
          const entry = event.resource as ScheduleEntry;

          const palette: Record<
            ScheduleEntry["status"],
            { backgroundColor: string; color: string }
          > = {
            planned: { backgroundColor: "#1d4ed8", color: "#eff6ff" },
            active: { backgroundColor: "#047857", color: "#ecfdf5" },
            delayed: { backgroundColor: "#b45309", color: "#fffbeb" },
            completed: { backgroundColor: "#374151", color: "#f3f4f6" },
          };

          return {
            style: {
              borderRadius: "8px",
              border: "0px",
              ...palette[entry.status],
            },
          };
        }}
      />
      <p className="text-xs text-muted-foreground">
        Drag-and-drop is disabled intentionally to preserve auditability. Edit
        assignments using the schedule form.
      </p>
    </div>
  );
}
