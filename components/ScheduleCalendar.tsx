"use client";

import { useMemo } from "react";
import {
  Calendar,
  Views,
  dateFnsLocalizer,
  type EventProps,
  type Event as CalendarEvent
} from "react-big-calendar";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import type { ScheduleView } from "@/lib/types";

const locales = {
  "en-US": enUS
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales
});

type ScheduleCalendarEvent = CalendarEvent & {
  resource: ScheduleView;
};

function getStatusColor(status: ScheduleView["status"]): string {
  switch (status) {
    case "in_progress":
      return "#0ea5e9";
    case "completed":
      return "#22c55e";
    case "cancelled":
      return "#ef4444";
    default:
      return "#1f9d8f";
  }
}

function EventBody({ event }: EventProps<ScheduleCalendarEvent>) {
  const schedule = event.resource;
  return (
    <div className="leading-tight">
      <p className="font-semibold">{schedule.route_name}</p>
      <p className="text-xs opacity-85">{schedule.driver_name}</p>
    </div>
  );
}

export function ScheduleCalendar({ schedules }: { schedules: ScheduleView[] }) {
  const events = useMemo<ScheduleCalendarEvent[]>(() => {
    return schedules.map((schedule) => {
      const start = new Date(`${schedule.service_date}T${schedule.departure_time}:00`);
      const end = new Date(start.getTime() + 60 * 60 * 1000);

      return {
        title: `${schedule.route_name} - ${schedule.driver_name}`,
        start,
        end,
        allDay: false,
        resource: schedule
      };
    });
  }, [schedules]);

  if (!schedules.length) {
    return (
      <div className="card flex min-h-72 items-center justify-center p-6 text-center text-slate-300">
        No scheduled trips yet. Add an assignment to populate the dispatch calendar.
      </div>
    );
  }

  return (
    <div className="card p-4 sm:p-6">
      <h3 className="mb-2 text-lg font-semibold text-slate-100">Dispatch Calendar</h3>
      <p className="mb-4 text-sm text-slate-400">View route departures by day and confirm staffing coverage.</p>

      <div className="h-[500px]">
        <Calendar
          localizer={localizer}
          events={events}
          defaultView={Views.WEEK}
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
          startAccessor="start"
          endAccessor="end"
          popup
          components={{
            event: EventBody
          }}
          eventPropGetter={(event) => ({
            style: {
              backgroundColor: getStatusColor(event.resource.status),
              borderRadius: "10px",
              border: "none",
              color: "#ffffff"
            }
          })}
        />
      </div>
    </div>
  );
}
