"use client";

import { useEffect, useState } from "react";
import { NotificationPanel } from "@/components/NotificationPanel";
import type { ScheduleRecord } from "@/lib/db/schema";

export default function NotificationsPage() {
  const [schedules, setSchedules] = useState<ScheduleRecord[]>([]);

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/schedules", { cache: "no-store" });
      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { schedules: ScheduleRecord[] };
      setSchedules(payload.schedules);
    };

    load();
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[#f0f6fc]">Passenger Notifications</h1>
        <p className="mt-1 text-sm text-[#8b949e]">
          Send rapid service updates and track delivery outcomes across all rider communication channels.
        </p>
      </header>
      <NotificationPanel schedules={schedules} />
    </div>
  );
}
