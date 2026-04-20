"use client";

import { useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";

import type { RouteStop } from "@/lib/database";

const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

type RouteMapClientProps = {
  stops: RouteStop[];
  routeName: string;
};

export default function RouteMapClient({
  stops,
  routeName,
}: RouteMapClientProps) {
  const center = useMemo(() => {
    if (!stops.length) {
      return [39.0119, -98.4842] as [number, number];
    }

    const total = stops.reduce(
      (acc, stop) => {
        acc.lat += stop.lat;
        acc.lng += stop.lng;
        return acc;
      },
      { lat: 0, lng: 0 },
    );

    return [total.lat / stops.length, total.lng / stops.length] as [number, number];
  }, [stops]);

  if (!stops.length) {
    return (
      <div className="flex h-[360px] items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground">
        Add route stops to preview the map.
      </div>
    );
  }

  return (
    <div className="h-[360px] overflow-hidden rounded-xl border border-border">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline
          positions={stops.map((stop) => [stop.lat, stop.lng] as [number, number])}
          pathOptions={{ color: "#2f81f7", weight: 4 }}
        />
        {stops.map((stop, index) => (
          <Marker key={`${stop.name}-${index}`} position={[stop.lat, stop.lng]}>
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold">{stop.name}</p>
                <p className="text-xs text-slate-600">{routeName}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
