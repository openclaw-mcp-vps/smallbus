"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, MapPinned, Plus, Route as RouteIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import RouteMap from "@/components/RouteMap";
import { Button } from "@/components/ui/button";
import type { BusRoute, RouteStop } from "@/lib/database";

const routeSchema = z.object({
  name: z.string().min(3, "Route name should be at least 3 characters."),
  startStop: z.string().min(2, "Start stop is required."),
  endStop: z.string().min(2, "End stop is required."),
  distanceKm: z.number().positive("Distance must be greater than 0."),
  active: z.boolean(),
  stopsText: z
    .string()
    .min(10, "Add at least two stops in the format stop|lat|lng."),
});

type RouteForm = z.infer<typeof routeSchema>;

type RoutesApiResponse = {
  routes: BusRoute[];
};

function parseStops(stopsText: string) {
  const stops = stopsText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, latText, lngText] = line.split("|").map((piece) => piece.trim());

      if (!name || !latText || !lngText) {
        throw new Error(
          "Each stop must follow: Stop Name|Latitude|Longitude",
        );
      }

      const lat = Number(latText);
      const lng = Number(lngText);

      if (Number.isNaN(lat) || lat < -90 || lat > 90) {
        throw new Error(`Invalid latitude for stop \"${name}\".`);
      }

      if (Number.isNaN(lng) || lng < -180 || lng > 180) {
        throw new Error(`Invalid longitude for stop \"${name}\".`);
      }

      return {
        name,
        lat,
        lng,
      } satisfies RouteStop;
    });

  if (stops.length < 2) {
    throw new Error("Add at least two stops to build a route.");
  }

  return stops;
}

export default function RoutesPage() {
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RouteForm>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      name: "",
      startStop: "",
      endStop: "",
      distanceKm: 12,
      active: true,
      stopsText:
        "Depot A|38.9724|-95.2441\nCedar & 9th|38.9808|-95.2329\nRidge Medical Center|39.0041|-95.2274",
    },
  });

  const selectedRoute = useMemo(
    () => routes.find((route) => route.id === selectedRouteId) ?? routes[0],
    [routes, selectedRouteId],
  );

  const fetchRoutes = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);

    try {
      const response = await fetch("/api/routes", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Could not load routes.");
      }

      const payload = (await response.json()) as RoutesApiResponse;
      setRoutes(payload.routes);
      if (payload.routes.length) {
        setSelectedRouteId((current) => current ?? payload.routes[0].id);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not load routes.";
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRoutes();
  }, [fetchRoutes]);

  async function onSubmit(values: RouteForm) {
    setApiError(null);

    try {
      const stops = parseStops(values.stopsText);

      const response = await fetch("/api/routes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name,
          startStop: values.startStop,
          endStop: values.endStop,
          distanceKm: values.distanceKm,
          active: values.active,
          stops,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Failed to create route.");
      }

      const payload = (await response.json()) as { route: BusRoute };
      setRoutes((prev) => [payload.route, ...prev]);
      setSelectedRouteId(payload.route.id);
      reset({
        name: "",
        startStop: "",
        endStop: "",
        distanceKm: values.distanceKm,
        active: true,
        stopsText: values.stopsText,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create route.";
      setApiError(message);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
      <section className="space-y-4 rounded-2xl border border-border bg-card/80 p-4">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-[0.12em] text-blue-200">
            Route planner
          </p>
          <h2 className="font-heading text-xl font-semibold text-white">
            Build a route in under 60 seconds
          </h2>
        </header>

        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-200">Route Name</span>
            <input
              className="w-full rounded-lg border border-border bg-[#111a2a] px-3 py-2 text-sm"
              placeholder="North Connector AM"
              {...register("name")}
            />
            {errors.name ? (
              <span className="mt-1 block text-xs text-red-300">{errors.name.message}</span>
            ) : null}
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-slate-200">Start Stop</span>
              <input
                className="w-full rounded-lg border border-border bg-[#111a2a] px-3 py-2 text-sm"
                placeholder="Depot B"
                {...register("startStop")}
              />
              {errors.startStop ? (
                <span className="mt-1 block text-xs text-red-300">
                  {errors.startStop.message}
                </span>
              ) : null}
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-slate-200">End Stop</span>
              <input
                className="w-full rounded-lg border border-border bg-[#111a2a] px-3 py-2 text-sm"
                placeholder="Industrial Park"
                {...register("endStop")}
              />
              {errors.endStop ? (
                <span className="mt-1 block text-xs text-red-300">{errors.endStop.message}</span>
              ) : null}
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block text-slate-200">Distance (km)</span>
            <input
              type="number"
              min={1}
              step="0.1"
              className="w-full rounded-lg border border-border bg-[#111a2a] px-3 py-2 text-sm"
              {...register("distanceKm", { valueAsNumber: true })}
            />
            {errors.distanceKm ? (
              <span className="mt-1 block text-xs text-red-300">
                {errors.distanceKm.message}
              </span>
            ) : null}
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input type="checkbox" {...register("active")} />
            Route is active for dispatch
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-slate-200">
              Stops (one per line, format: <code>name|lat|lng</code>)
            </span>
            <textarea
              rows={6}
              className="w-full rounded-lg border border-border bg-[#111a2a] px-3 py-2 text-sm"
              {...register("stopsText")}
            />
            {errors.stopsText ? (
              <span className="mt-1 block text-xs text-red-300">
                {errors.stopsText.message}
              </span>
            ) : null}
          </label>

          <Button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-400"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Save Route
          </Button>
        </form>

        {apiError ? (
          <p className="rounded-lg border border-red-300/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {apiError}
          </p>
        ) : null}
      </section>

      <section className="space-y-4">
        <div className="rounded-2xl border border-border bg-card/80 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-xl font-semibold text-white">
              Active route board
            </h2>
            <span className="text-sm text-muted-foreground">
              {routes.length} total routes
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading routes...
            </div>
          ) : routes.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {routes.map((route) => (
                <button
                  key={route.id}
                  type="button"
                  onClick={() => setSelectedRouteId(route.id)}
                  className={`space-y-2 rounded-xl border p-3 text-left transition ${
                    selectedRoute?.id === route.id
                      ? "border-blue-300/50 bg-blue-500/10"
                      : "border-border bg-[#111a2a] hover:bg-[#16233a]"
                  }`}
                >
                  <p className="flex items-center gap-2 font-medium text-slate-100">
                    <RouteIcon className="size-4 text-blue-300" />
                    {route.name}
                  </p>
                  <p className="text-xs text-slate-300">
                    {route.startStop} → {route.endStop}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{route.distanceKm.toFixed(1)} km</span>
                    <span>•</span>
                    <span>{route.stops.length} stops</span>
                    <span>•</span>
                    <span>{route.active ? "Active" : "Paused"}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              No routes yet. Add your first route from the form.
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card/80 p-4">
          <div className="mb-3 flex items-center gap-2">
            <MapPinned className="size-4 text-blue-300" />
            <h3 className="font-heading text-lg font-semibold text-white">
              {selectedRoute ? `${selectedRoute.name} map view` : "Route map"}
            </h3>
          </div>

          {selectedRoute ? (
            <RouteMap routeName={selectedRoute.name} stops={selectedRoute.stops} />
          ) : (
            <div className="flex h-[360px] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
              <AlertCircle className="mr-2 size-4" />
              Select a route to visualize stops.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
