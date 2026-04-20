"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { DriverItem, RouteItem, ScheduleItem } from "@/lib/types";

const assignmentSchema = z.object({
  route_id: z.coerce.number().int().positive(),
  driver_id: z.coerce.number().int().positive(),
  service_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u),
  departure_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/u),
  status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]),
  notes: z.string().max(300)
});

type AssignmentFormInput = z.input<typeof assignmentSchema>;
type AssignmentFormOutput = z.output<typeof assignmentSchema>;

export function DriverAssignment({
  routes,
  drivers,
  onCreated
}: {
  routes: RouteItem[];
  drivers: DriverItem[];
  onCreated?: (assignment: ScheduleItem) => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<AssignmentFormInput, unknown, AssignmentFormOutput>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      route_id: routes[0]?.id,
      driver_id: drivers[0]?.id,
      service_date: new Date().toISOString().slice(0, 10),
      departure_time: "06:30",
      status: "scheduled",
      notes: ""
    }
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      setIsSaving(true);
      setFormError(null);

      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(values)
      });

      const payload = (await response.json()) as {
        data?: ScheduleItem;
        error?: string;
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? "Unable to create assignment");
      }

      onCreated?.(payload.data);

      form.reset({
        ...values,
        notes: ""
      });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to save assignment");
    } finally {
      setIsSaving(false);
    }
  });

  if (!routes.length || !drivers.length) {
    return (
      <div className="card p-4 text-sm text-slate-300">
        Add at least one route and one driver before creating schedule assignments.
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h3 className="text-lg font-semibold text-slate-100">New Driver Assignment</h3>
      <p className="mt-1 text-sm text-slate-400">Assign a driver to a route and publish the departure to dispatch.</p>

      <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm text-slate-300">
          Route
          <select
            {...form.register("route_id")}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
          >
            {routes.map((route) => (
              <option key={route.id} value={route.id}>
                {route.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm text-slate-300">
          Driver
          <select
            {...form.register("driver_id")}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
          >
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm text-slate-300">
          Service Date
          <input
            type="date"
            {...form.register("service_date")}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
          />
        </label>

        <label className="grid gap-1 text-sm text-slate-300">
          Departure Time
          <input
            type="time"
            {...form.register("departure_time")}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
          />
        </label>

        <label className="grid gap-1 text-sm text-slate-300">
          Status
          <select
            {...form.register("status")}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
          >
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>

        <label className="grid gap-1 text-sm text-slate-300 sm:col-span-2">
          Dispatch Notes
          <textarea
            {...form.register("notes")}
            rows={3}
            placeholder="Gate instructions, wheelchair loading notes, expected delays..."
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500"
          />
        </label>

        {Object.keys(form.formState.errors).length > 0 ? (
          <p className="sm:col-span-2 text-sm text-rose-300">Please check the assignment fields and try again.</p>
        ) : null}

        {formError ? <p className="sm:col-span-2 text-sm text-rose-300">{formError}</p> : null}

        <button
          type="submit"
          disabled={isSaving}
          className="sm:col-span-2 rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving assignment..." : "Create Assignment"}
        </button>
      </form>
    </div>
  );
}
