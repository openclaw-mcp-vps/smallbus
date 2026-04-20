"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import L from "leaflet";
import { MapPinned } from "lucide-react";
import type { RouteItem } from "@/lib/types";

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then((mod) => mod.Polyline), { ssr: false });

const markerIcon = L.icon({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function buildStopCoordinates(stops: string[]): [number, number][] {
  return stops.map((_, index) => {
    const latitude = 40.71 + index * 0.016;
    const longitude = -73.98 + (index % 2 === 0 ? 0.012 : -0.01);
    return [latitude, longitude];
  });
}

export function RouteMap({ routes }: { routes: RouteItem[] }) {
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(routes[0]?.id ?? null);

  const selectedRoute = useMemo(
    () => routes.find((route) => route.id === selectedRouteId) ?? routes[0],
    [routes, selectedRouteId]
  );

  const coordinates = useMemo(() => {
    if (!selectedRoute) {
      return [] as [number, number][];
    }

    return buildStopCoordinates(selectedRoute.stops);
  }, [selectedRoute]);

  if (!routes.length) {
    return (
      <div className="card flex min-h-72 items-center justify-center p-6 text-center text-slate-300">
        Create your first route to see stop sequencing on the map.
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-slate-800/80 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Route Coverage Map</h3>
          <p className="text-sm text-slate-400">Visualize stop order and route footprint for dispatch handoff.</p>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-200">
          <MapPinned className="h-4 w-4 text-cyan-300" />
          Route
          <select
            value={selectedRoute?.id}
            onChange={(event) => setSelectedRouteId(Number(event.target.value))}
            className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
          >
            {routes.map((route) => (
              <option key={route.id} value={route.id}>
                {route.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="h-80 w-full sm:h-[430px]">
        <MapContainer center={coordinates[0] ?? [40.72, -73.98]} zoom={12} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {coordinates.length > 1 ? <Polyline positions={coordinates} pathOptions={{ color: "#26d0ce", weight: 4 }} /> : null}

          {coordinates.map((position, index) => (
            <Marker key={`${position[0]}-${position[1]}-${index}`} position={position} icon={markerIcon}>
              <Popup>
                <strong>{selectedRoute?.stops[index]}</strong>
                <div>
                  Stop {index + 1} of {selectedRoute?.stops.length}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="grid gap-2 p-4 text-sm text-slate-300 sm:grid-cols-2">
        <p>
          <span className="text-slate-100">Route:</span> {selectedRoute?.name}
        </p>
        <p>
          <span className="text-slate-100">Travel target:</span> {selectedRoute?.estimated_minutes} min
        </p>
        <p>
          <span className="text-slate-100">Origin:</span> {selectedRoute?.origin}
        </p>
        <p>
          <span className="text-slate-100">Destination:</span> {selectedRoute?.destination}
        </p>
      </div>
    </div>
  );
}
