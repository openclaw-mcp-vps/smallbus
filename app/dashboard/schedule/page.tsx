"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, Loader2, Plus, TriangleAlert } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import DriverAssignment from "@/components/DriverAssignment";
import ScheduleCalendar from "@/components/ScheduleCalendar";
import { Button } from "@/components/ui/button";
import type { BusRoute, Driver, ScheduleEntry, ScheduleStatus } from "@/lib/database";

const scheduleSchema = z.object({
  routeId: z.number().int().positive(),
  driverId: z.number().int().positive(),
  startTime: z.string().min(1, "Start time is required."),
  endTime: z.string().min(1, "End time is required."),
  vehicleCode: z.string().min(2, "Vehicle code is required."),
  status: z.enum(["planned", "active", "completed", "delayed"]),
  notes: z.string().max(200).optional(),
});

type ScheduleForm = z.infer<typeof scheduleSchema>;

type ScheduleApiPayload = {
  schedules: ScheduleEntry[];
};

type DriversApiPayload = {
  drivers: Driver[];
};

type RoutesApiPayload = {
  routes: BusRoute[];
};

const statusOptions: ScheduleStatus[] = [
  "planned",
  "active",
  "delayed",
  "completed",
];

function toLocalDateTimeInput(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export default function SchedulePage() {
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      routeId: 0,
      driverId: 0,
      startTime: toLocalDateTimeInput(new Date(Date.now() + 60 * 60 * 1000)),
      endTime: toLocalDateTimeInput(new Date(Date.now() + 2 * 60 * 60 * 1000)),
      vehicleCode: "",
      status: "planned",
      notes: "",
    },
  });

  const selectedStartTime = watch("startTime");
  const selectedEndTime = watch("endTime");

  const hasTimeConflict = useMemo(() => {
    const start = new Date(selectedStartTime).getTime();
    const end = new Date(selectedEndTime).getTime();

    if (Number.isNaN(start) || Number.isNaN(end)) {
      return false;
    }

    return end <= start;
  }, [selectedEndTime, selectedStartTime]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);

    try {
      const [routesRes, driversRes, schedulesRes] = await Promise.all([
        fetch("/api/routes", { cache: "no-store" }),
        fetch("/api/drivers", { cache: "no-store" }),
        fetch("/api/schedule", { cache: "no-store" }),
      ]);

      if (!routesRes.ok || !driversRes.ok || !schedulesRes.ok) {
        throw new Error("Could not load scheduling data.");
      }

      const routesPayload = (await routesRes.json()) as RoutesApiPayload;
      const driversPayload = (await driversRes.json()) as DriversApiPayload;
      const schedulesPayload = (await schedulesRes.json()) as ScheduleApiPayload;

      setRoutes(routesPayload.routes);
      setDrivers(driversPayload.drivers);
      setSchedules(schedulesPayload.schedules);

      reset((current) => ({
        ...current,
        routeId: routesPayload.routes[0]?.id ?? 0,
        driverId: driversPayload.drivers[0]?.id ?? 0,
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not load scheduling data.";
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  async function onSubmit(values: ScheduleForm) {
    setApiError(null);

    if (new Date(values.endTime).getTime() <= new Date(values.startTime).getTime()) {
      setApiError("End time must be later than start time.");
      return;
    }

    try {
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          startTime: new Date(values.startTime).toISOString(),
          endTime: new Date(values.endTime).toISOString(),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Failed to create schedule entry.");
      }

      const payload = (await response.json()) as { schedule: ScheduleEntry };
      setSchedules((prev) => [...prev, payload.schedule]);
      reset((current) => ({
        ...current,
        startTime: toLocalDateTimeInput(
          new Date(Date.now() + 60 * 60 * 1000),
        ),
        endTime: toLocalDateTimeInput(new Date(Date.now() + 2 * 60 * 60 * 1000)),
        vehicleCode: "",
        notes: "",
        status: "planned",
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to create schedule entry.";
      setApiError(message);
    }
  }

  return (
    <div className="space-y-4">
      <section className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <div className="space-y-4 rounded-2xl border border-border bg-card/80 p-4">
          <header className="space-y-1">
            <p className="text-xs uppercase tracking-[0.12em] text-blue-200">
              Dispatch scheduling
            </p>
            <h2 className="font-heading text-xl font-semibold text-white">
              Assign routes and vehicle blocks
            </h2>
          </header>

          <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-200">Route</span>
              <select
                className="w-full rounded-lg border border-border bg-[#111a2a] px-3 py-2"
                {...register("routeId", { valueAsNumber: true })}
              >
                <option value={0}>Select route</option>
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.name}
                  </option>
                ))}
              </select>
              {errors.routeId ? (
                <span className="mt-1 block text-xs text-red-300">{errors.routeId.message}</span>
              ) : null}
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-slate-200">Driver</span>
              <select
                className="w-full rounded-lg border border-border bg-[#111a2a] px-3 py-2"
                {...register("driverId", { valueAsNumber: true })}
              >
                <option value={0}>Select driver</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name}
                  </option>
                ))}
              </select>
              {errors.driverId ? (
                <span className="mt-1 block text-xs text-red-300">{errors.driverId.message}</span>
              ) : null}
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block text-slate-200">Start</span>
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border border-border bg-[#111a2a] px-3 py-2"
                  {...register("startTime")}
                />
                {errors.startTime ? (
                  <span className="mt-1 block text-xs text-red-300">
                    {errors.startTime.message}
                  </span>
                ) : null}
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-slate-200">End</span>
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border border-border bg-[#111a2a] px-3 py-2"
                  {...register("endTime")}
                />
                {errors.endTime ? (
                  <span className="mt-1 block text-xs text-red-300">{errors.endTime.message}</span>
                ) : null}
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block text-slate-200">Vehicle Code</span>
                <input
                  className="w-full rounded-lg border border-border bg-[#111a2a] px-3 py-2"
                  placeholder="BUS-04"
                  {...register("vehicleCode")}
                />
                {errors.vehicleCode ? (
                  <span className="mt-1 block text-xs text-red-300">
                    {errors.vehicleCode.message}
                  </span>
                ) : null}
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-slate-200">Status</span>
                <select
                  className="w-full rounded-lg border border-border bg-[#111a2a] px-3 py-2"
                  {...register("status")}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block text-sm">
              <span className="mb-1 block text-slate-200">Dispatch Notes</span>
              <textarea
                rows={3}
                className="w-full rounded-lg border border-border bg-[#111a2a] px-3 py-2"
                placeholder="Bridge detour from 8:00-9:00 AM"
                {...register("notes")}
              />
            </label>

            {hasTimeConflict ? (
              <p className="rounded-lg border border-amber-300/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                End time must be later than start time.
              </p>
            ) : null}

            <Button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-400"
              disabled={isSubmitting || hasTimeConflict}
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Publish Assignment
            </Button>
          </form>

          {apiError ? (
            <p className="rounded-lg border border-red-300/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {apiError}
            </p>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card/80 p-4">
            <h2 className="mb-4 flex items-center gap-2 font-heading text-xl font-semibold text-white">
              <CalendarClock className="size-5 text-blue-300" />
              Schedule timeline
            </h2>

            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading schedule data...
              </div>
            ) : (
              <ScheduleCalendar entries={schedules} />
            )}
          </div>

          <DriverAssignment drivers={drivers} schedules={schedules} />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card/80 p-4">
        <h3 className="mb-3 font-heading text-lg font-semibold text-white">
          Upcoming assignments
        </h3>
        {schedules.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[...schedules]
              .sort(
                (a, b) =>
                  new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
              )
              .slice(0, 9)
              .map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-xl border border-border bg-[#111a2a] p-3"
                >
                  <p className="font-medium text-slate-100">{entry.routeName}</p>
                  <p className="text-xs text-slate-300">Driver: {entry.driverName}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(entry.startTime).toLocaleString()} -{" "}
                    {new Date(entry.endTime).toLocaleTimeString()}
                  </p>
                  <p className="mt-2 inline-flex rounded-full bg-[#1f3354] px-2 py-1 text-xs text-blue-100">
                    {entry.vehicleCode} • {entry.status}
                  </p>
                </article>
              ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            <TriangleAlert className="size-4" />
            No schedule entries yet. Publish your first assignment.
          </div>
        )}
      </section>
    </div>
  );
}
