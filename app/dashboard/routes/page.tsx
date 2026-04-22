"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { io, type Socket } from "socket.io-client";
import { Trash2 } from "lucide-react";
import type { RouteRecord, RouteStopPoint } from "@/lib/db/schema";
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

const RouteMap = dynamic(() => import("@/components/RouteMap").then((mod) => mod.RouteMap), {
  ssr: false
});

type RouteFormInput = {
  name: string;
  origin: string;
  destination: string;
  stops: string;
  estimatedMinutes: number;
};

function generatePath(stops: string[]): RouteStopPoint[] {
  const baseLat = 30.2672;
  const baseLng = -97.7431;

  return stops.map((label, index) => {
    const lat = baseLat + index * 0.032 + (Math.random() * 0.012 - 0.006);
    const lng = baseLng + index * 0.025 + (Math.random() * 0.012 - 0.006);

    return {
      label,
      lat,
      lng
    };
  });
}

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RouteRecord[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset } = useForm<RouteFormInput>({
    defaultValues: {
      estimatedMinutes: 45
    }
  });

  async function refreshRoutes() {
    const response = await fetch("/api/routes", { cache: "no-store" });
    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { routes: RouteRecord[] };
    setRoutes(payload.routes);

    if (!selectedRouteId && payload.routes[0]) {
      setSelectedRouteId(payload.routes[0].id);
    }
  }

  useEffect(() => {
    refreshRoutes();

    let socket: Socket | undefined;

    const connectSocket = async () => {
      await fetch("/api/socket");
      socket = io({ path: "/api/socket_io" });

      socket.on("smallbus:event", (event: { type: string }) => {
        if (event.type === "routes.updated") {
          refreshRoutes();
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

    const stops = data.stops
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

    const response = await fetch("/api/routes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: data.name,
        origin: data.origin,
        destination: data.destination,
        stops,
        path: generatePath(stops),
        estimatedMinutes: Number(data.estimatedMinutes),
        active: true
      })
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setErrorMessage(payload.error ?? "Could not save route");
      setLoading(false);
      return;
    }

    reset({ estimatedMinutes: 45, stops: "" });
    await refreshRoutes();
    setLoading(false);
  });

  const removeRoute = async (routeId: number) => {
    await fetch(`/api/routes/${routeId}`, {
      method: "DELETE"
    });

    await refreshRoutes();
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[#f0f6fc]">Route Planning</h1>
        <p className="mt-1 text-sm text-[#8b949e]">
          Design reliable service loops, preview stop order, and keep travel times realistic for dispatch.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Create Route</CardTitle>
            <CardDescription>
              Enter route details and stop sequence. Map coordinates are generated automatically for quick planning.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Route name</Label>
                <Input id="name" placeholder="East Valley Shuttle" {...register("name", { required: true })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="origin">Origin</Label>
                  <Input id="origin" placeholder="Hillside Depot" {...register("origin", { required: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination</Label>
                  <Input
                    id="destination"
                    placeholder="Downtown Transfer"
                    {...register("destination", { required: true })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stops">Stops (comma-separated)</Label>
                <Input
                  id="stops"
                  placeholder="Hillside Depot, Riverfront, Main St, Downtown Transfer"
                  {...register("stops", { required: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedMinutes">Estimated run time (minutes)</Label>
                <Input
                  id="estimatedMinutes"
                  type="number"
                  min={10}
                  max={960}
                  {...register("estimatedMinutes", { required: true, valueAsNumber: true })}
                />
              </div>
              {errorMessage ? <p className="text-sm text-[#f85149]">{errorMessage}</p> : null}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Saving route..." : "Save route"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Route Map</CardTitle>
            <CardDescription>Click a route in the table to focus the map and inspect stop order.</CardDescription>
          </CardHeader>
          <CardContent>
            <RouteMap routes={routes} selectedRouteId={selectedRouteId} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configured Routes</CardTitle>
          <CardDescription>{routes.length} active route definitions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Origin</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Stops</TableHead>
                <TableHead>Minutes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routes.map((route) => (
                <TableRow key={route.id} onClick={() => setSelectedRouteId(route.id)} className="cursor-pointer">
                  <TableCell className="font-medium text-[#f0f6fc]">{route.name}</TableCell>
                  <TableCell>{route.origin}</TableCell>
                  <TableCell>{route.destination}</TableCell>
                  <TableCell>{route.stops.length}</TableCell>
                  <TableCell>{route.estimatedMinutes}</TableCell>
                  <TableCell className="text-right">
                    <button
                      type="button"
                      aria-label={`Delete route ${route.name}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#f85149] hover:bg-[#161b22]"
                      onClick={async (event) => {
                        event.stopPropagation();
                        await removeRoute(route.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
