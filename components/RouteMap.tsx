"use client";

import { useMemo } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import type { RouteRecord } from "@/lib/db/schema";

const stopIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export function RouteMap({ routes, selectedRouteId }: { routes: RouteRecord[]; selectedRouteId: number | null }) {
  const focusedRoute = useMemo(() => {
    if (selectedRouteId) {
      return routes.find((route) => route.id === selectedRouteId) ?? routes[0];
    }

    return routes[0];
  }, [routes, selectedRouteId]);

  const center: [number, number] = focusedRoute?.path?.[0]
    ? [focusedRoute.path[0].lat, focusedRoute.path[0].lng]
    : [30.2672, -97.7431];

  if (!focusedRoute) {
    return (
      <div className="flex h-[360px] items-center justify-center rounded-xl border border-[#30363d] bg-[#11161e] text-sm text-[#8b949e]">
        Add your first route to unlock map-based planning.
      </div>
    );
  }

  return (
    <div className="h-[360px] overflow-hidden rounded-xl border border-[#30363d] bg-[#11161e]">
      <MapContainer center={center} zoom={11} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Polyline
          positions={focusedRoute.path.map((point) => [point.lat, point.lng])}
          color="#1f6feb"
          weight={5}
          opacity={0.8}
        />

        {focusedRoute.path.map((point, index) => (
          <Marker key={`${point.label}-${index}`} position={[point.lat, point.lng]} icon={stopIcon}>
            <Popup>
              <div className="text-sm">
                <strong>{point.label}</strong>
                <div>
                  {index + 1} of {focusedRoute.path.length} stops
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
