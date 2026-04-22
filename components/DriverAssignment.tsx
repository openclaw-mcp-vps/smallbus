"use client";

import { useState } from "react";
import type { DriverRecord } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

function statusVariant(status: DriverRecord["status"]) {
  if (status === "available") {
    return "success" as const;
  }

  if (status === "on_route") {
    return "warning" as const;
  }

  return "neutral" as const;
}

export function DriverAssignment({
  drivers,
  onStatusChange
}: {
  drivers: DriverRecord[];
  onStatusChange: (driverId: number, status: DriverRecord["status"]) => Promise<void>;
}) {
  const [pendingId, setPendingId] = useState<number | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Driver Availability Board</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {drivers.length === 0 ? (
          <p className="text-sm text-[#8b949e]">No drivers yet. Add your first operator to start assigning routes.</p>
        ) : null}

        {drivers.map((driver) => (
          <div key={driver.id} className="rounded-lg border border-[#30363d] bg-[#0d1117] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-[#f0f6fc]">{driver.name}</p>
                <p className="text-sm text-[#8b949e]">{driver.phone}</p>
              </div>
              <Badge variant={statusVariant(driver.status)}>{driver.status.replace("_", " ")}</Badge>
            </div>
            <div className="mt-3 space-y-2">
              <Label htmlFor={`status-${driver.id}`}>Set status</Label>
              <select
                id={`status-${driver.id}`}
                defaultValue={driver.status}
                disabled={pendingId === driver.id}
                className="h-10 w-full rounded-md border border-[#30363d] bg-[#0d1117] px-3 text-sm text-[#c9d1d9] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                onChange={async (event) => {
                  const nextStatus = event.currentTarget.value as DriverRecord["status"];
                  setPendingId(driver.id);
                  await onStatusChange(driver.id, nextStatus);
                  setPendingId(null);
                }}
              >
                <option value="available">Available</option>
                <option value="on_route">On Route</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
