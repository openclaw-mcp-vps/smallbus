"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock3, Plus } from "lucide-react";
import { RouteMap } from "@/components/RouteMap";
import type { RouteItem } from "@/lib/types";

const routeFormSchema = z.object({
  name: z.string().min(3).max(80),
  origin: z.string().min(2).max(80),
  destination: z.string().min(2).max(80),
  stopsInput: z.string().min(5),
  default_start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/u),
  estimated_minutes: z.coerce.number().int().min(10).max(480),
  active: z.boolean().default(true)
});

type RouteFormInput = z.input<typeof routeFormSchema>;
type RouteFormOutput = z.output<typeof routeFormSchema>;

function parseStops(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function RoutePlanner({ initialRoutes }: { initialRoutes: RouteItem[] }) {
  const [routes, setRoutes] = useState<RouteItem[]>(initialRoutes);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<RouteFormInput, unknown, RouteFormOutput>({
    resolver: zodResolver(routeFormSchema),
    defaultValues: {
      name: "",
      origin: "",
      destination: "",
      stopsInput: "",
      default_start_time: "06:30",
      estimated_minutes: 45,
      active: true
    }
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      setError(null);

      const stops = parseStops(values.stopsInput);
      if (stops.length < 2) {
        setError("Add at least two stops separated by commas.");
        return;
      }

      const response = await fetch("/api/routes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: values.name,
          origin: values.origin,
          destination: values.destination,
          stops,
          default_start_time: values.default_start_time,
          estimated_minutes: values.estimated_minutes,
          active: values.active
        })
      });

      const payload = (await response.json()) as {
        data?: RouteItem;
        error?: string;
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? "Could not create route");
      }

      setRoutes((current) => [payload.data as RouteItem, ...current]);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create route");
    }
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
      <RouteMap routes={routes} />

      <div className="card p-5">
        <h2 className="text-lg font-semibold text-slate-100">Create Route</h2>
        <p className="mt-1 text-sm text-slate-400">Define stops, departure time, and expected trip duration.</p>

        <form onSubmit={submit} className="mt-4 grid gap-4">
          <label className="grid gap-1 text-sm text-slate-300">
            Route Name
            <input
              type="text"
              {...form.register("name")}
              placeholder="Airport Connector"
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm text-slate-300">
              Origin
              <input
                type="text"
                {...form.register("origin")}
                placeholder="Depot B"
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500"
              />
            </label>

            <label className="grid gap-1 text-sm text-slate-300">
              Destination
              <input
                type="text"
                {...form.register("destination")}
                placeholder="Regional Airport"
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500"
              />
            </label>
          </div>

          <label className="grid gap-1 text-sm text-slate-300">
            Stops (comma separated)
            <textarea
              {...form.register("stopsInput")}
              rows={3}
              placeholder="Depot B, Main Street, Elm Terminal, Regional Airport"
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm text-slate-300">
              Default Start Time
              <input
                type="time"
                {...form.register("default_start_time")}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              />
            </label>

            <label className="grid gap-1 text-sm text-slate-300">
              Estimated Minutes
              <input
                type="number"
                min={10}
                {...form.register("estimated_minutes")}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" {...form.register("active")} />
            Keep this route active for assignment
          </label>

          {Object.keys(form.formState.errors).length > 0 ? (
            <p className="text-sm text-rose-300">Please complete all route fields with valid values.</p>
          ) : null}

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            <Plus className="h-4 w-4" />
            Save Route
          </button>
        </form>

        <div className="mt-6 border-t border-slate-800 pt-4">
          <h3 className="text-sm font-semibold text-slate-200">Recent Routes</h3>
          <div className="mt-3 grid gap-2">
            {routes.slice(0, 4).map((route) => (
              <article key={route.id} className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
                <p className="text-sm font-semibold text-slate-100">{route.name}</p>
                <p className="text-xs text-slate-400">
                  {route.origin} to {route.destination}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <Clock3 className="h-3.5 w-3.5" />
                  {route.default_start_time} / {route.estimated_minutes} min
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
