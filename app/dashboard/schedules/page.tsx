"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { io, type Socket } from "socket.io-client";
import { Trash2 } from "lucide-react";
import { ScheduleCalendar } from "@/components/ScheduleCalendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import type { DriverRecord, RouteRecord, ScheduleRecord } from "@/lib/db/schema";
import { formatDateTime } from "@/lib/utils";

type ScheduleFormInput = {
  routeId: string;
  driverId: string;
  serviceDate: string;
  departureTime: string;
  arrivalTime: string;
  capacity: number;
  notes: string;
};

function scheduleBadgeVariant(status: ScheduleRecord["status"]) {
  if (status === "completed") {
    return "success" as const;
  }

  if (status === "cancelled") {
    return "danger" as const;
  }

  if (status === "in_service") {
    return "warning" as const;
  }

  return "neutral" as const;
}

export default function SchedulesPage() {
  const [routes, setRoutes] = useState<RouteRecord[]>([]);
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [schedules, setSchedules] = useState<ScheduleRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset } = useForm<ScheduleFormInput>();

  const routeMap = useMemo(() => new Map(routes.map((route) => [route.id, route])), [routes]);
  const driverMap = useMemo(() => new Map(drivers.map((driver) => [driver.id, driver])), [drivers]);

  async function refreshAll() {
    const [routeResponse, driverResponse, scheduleResponse] = await Promise.all([
      fetch("/api/routes", { cache: "no-store" }),
      fetch("/api/drivers", { cache: "no-store" }),
      fetch("/api/schedules", { cache: "no-store" })
    ]);

    if (routeResponse.ok) {
      const payload = (await routeResponse.json()) as { routes: RouteRecord[] };
      setRoutes(payload.routes);
    }

    if (driverResponse.ok) {
      const payload = (await driverResponse.json()) as { drivers: DriverRecord[] };
      setDrivers(payload.drivers);
    }

    if (scheduleResponse.ok) {
      const payload = (await scheduleResponse.json()) as { schedules: ScheduleRecord[] };
      setSchedules(payload.schedules);
    }
  }

  useEffect(() => {
    refreshAll();

    let socket: Socket | undefined;

    const connectSocket = async () => {
      await fetch("/api/socket");
      socket = io({ path: "/api/socket_io" });

      socket.on("smallbus:event", (event: { type: string }) => {
        if (event.type === "schedules.updated" || event.type === "routes.updated" || event.type === "drivers.updated") {
          refreshAll();
        }
      });
    };

    connectSocket();

    return () => {
      socket?.disconnect();
    };
  }, []);

  const onSubmit = handleSubmit(async (data) => {
    setLoading(true);
    setErrorMessage("");

    const departureISO = new Date(data.departureTime).toISOString();
    const arrivalISO = new Date(data.arrivalTime).toISOString();

    const response = await fetch("/api/schedules", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        routeId: Number.parseInt(data.routeId, 10),
        driverId: Number.parseInt(data.driverId, 10),
        serviceDate: data.serviceDate,
        departureTime: departureISO,
        arrivalTime: arrivalISO,
        capacity: Number(data.capacity),
        bookedSeats: 0,
        status: "scheduled",
        notes: data.notes
      })
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setErrorMessage(payload.error ?? "Unable to create schedule");
      setLoading(false);
      return;
    }

    reset();
    await refreshAll();
    setLoading(false);
  });

  const removeSchedule = async (scheduleId: number) => {
    await fetch(`/api/schedules/${scheduleId}`, { method: "DELETE" });
    await refreshAll();
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[#f0f6fc]">Schedule Operations</h1>
        <p className="mt-1 text-sm text-[#8b949e]">
          Create run sheets, assign operators, and monitor service windows on a live planning calendar.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Create Schedule</CardTitle>
            <CardDescription>Assign a route and driver to build an upcoming service run.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="routeId">Route</Label>
                <select
                  id="routeId"
                  className="h-10 w-full rounded-md border border-[#30363d] bg-[#0d1117] px-3 text-sm text-[#c9d1d9] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                  {...register("routeId", { required: true })}
                >
                  <option value="">Select route</option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="driverId">Driver</Label>
                <select
                  id="driverId"
                  className="h-10 w-full rounded-md border border-[#30363d] bg-[#0d1117] px-3 text-sm text-[#c9d1d9] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                  {...register("driverId", { required: true })}
                >
                  <option value="">Select driver</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceDate">Service date</Label>
                <Input id="serviceDate" type="date" {...register("serviceDate", { required: true })} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="departureTime">Departure</Label>
                  <Input
                    id="departureTime"
                    type="datetime-local"
                    {...register("departureTime", { required: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="arrivalTime">Arrival</Label>
                  <Input id="arrivalTime" type="datetime-local" {...register("arrivalTime", { required: true })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input id="capacity" type="number" min={1} max={120} {...register("capacity", { valueAsNumber: true })} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Dispatch note</Label>
                <Input
                  id="notes"
                  placeholder="Load priority passengers first at stop 2"
                  {...register("notes")}
                />
              </div>

              {errorMessage ? <p className="text-sm text-[#f85149]">{errorMessage}</p> : null}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Saving schedule..." : "Save schedule"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schedule Calendar</CardTitle>
            <CardDescription>Week view of assigned runs with route and driver context.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScheduleCalendar schedules={schedules} routes={routes} drivers={drivers} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Runs</CardTitle>
          <CardDescription>{schedules.length} scheduled services</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Departure</TableHead>
                <TableHead>Arrival</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((schedule) => {
                const route = routeMap.get(schedule.routeId);
                const driver = driverMap.get(schedule.driverId);

                return (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium text-[#f0f6fc]">{route?.name ?? `Route ${schedule.routeId}`}</TableCell>
                    <TableCell>{driver?.name ?? `Driver ${schedule.driverId}`}</TableCell>
                    <TableCell>{formatDateTime(schedule.departureTime)}</TableCell>
                    <TableCell>{formatDateTime(schedule.arrivalTime)}</TableCell>
                    <TableCell>
                      <Badge variant={scheduleBadgeVariant(schedule.status)}>{schedule.status.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell>
                      {schedule.bookedSeats}/{schedule.capacity}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        type="button"
                        aria-label={`Delete schedule ${schedule.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#f85149] hover:bg-[#161b22]"
                        onClick={() => removeSchedule(schedule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
