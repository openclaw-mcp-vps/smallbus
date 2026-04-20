import dynamic from "next/dynamic";

import type { ScheduleEntry } from "@/lib/database";

const ScheduleCalendarClient = dynamic(
  () => import("@/components/ScheduleCalendarClient"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[560px] items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground">
        Loading schedule calendar...
      </div>
    ),
  },
);

type ScheduleCalendarProps = {
  entries: ScheduleEntry[];
};

export default function ScheduleCalendar(props: ScheduleCalendarProps) {
  return <ScheduleCalendarClient {...props} />;
}
