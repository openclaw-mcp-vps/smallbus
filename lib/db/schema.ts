import { z } from "zod";

export type RouteStopPoint = {
  lat: number;
  lng: number;
  label: string;
};

export type RouteRecord = {
  id: number;
  name: string;
  origin: string;
  destination: string;
  stops: string[];
  path: RouteStopPoint[];
  estimatedMinutes: number;
  active: boolean;
  createdAt: string;
};

export type DriverRecord = {
  id: number;
  name: string;
  phone: string;
  licenseNumber: string;
  status: "available" | "on_route" | "offline";
  maxHoursPerDay: number;
  createdAt: string;
};

export type ScheduleRecord = {
  id: number;
  routeId: number;
  driverId: number;
  serviceDate: string;
  departureTime: string;
  arrivalTime: string;
  capacity: number;
  bookedSeats: number;
  status: "scheduled" | "in_service" | "completed" | "cancelled";
  notes: string;
  createdAt: string;
};

export type NotificationRecord = {
  id: number;
  scheduleId: number | null;
  channel: "sms" | "email" | "push";
  recipient: string;
  message: string;
  status: "queued" | "sent" | "failed";
  createdAt: string;
};

export const routeInputSchema = z.object({
  name: z.string().min(3).max(80),
  origin: z.string().min(2).max(80),
  destination: z.string().min(2).max(80),
  stops: z.array(z.string().min(2).max(80)).min(1).max(20),
  path: z
    .array(
      z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        label: z.string().min(1).max(80)
      })
    )
    .min(2)
    .max(40),
  estimatedMinutes: z.number().int().min(10).max(960),
  active: z.boolean().optional().default(true)
});

export const driverInputSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().min(7).max(20),
  licenseNumber: z.string().min(3).max(40),
  status: z.enum(["available", "on_route", "offline"]).default("available"),
  maxHoursPerDay: z.number().int().min(4).max(16).default(8)
});

export const scheduleInputSchema = z.object({
  routeId: z.number().int().positive(),
  driverId: z.number().int().positive(),
  serviceDate: z.string().date(),
  departureTime: z.string().datetime({ offset: true }),
  arrivalTime: z.string().datetime({ offset: true }),
  capacity: z.number().int().min(1).max(120),
  bookedSeats: z.number().int().min(0).max(120).default(0),
  status: z
    .enum(["scheduled", "in_service", "completed", "cancelled"])
    .default("scheduled"),
  notes: z.string().max(400).default("")
});

export const notificationInputSchema = z.object({
  scheduleId: z.number().int().positive().nullable().optional().default(null),
  channel: z.enum(["sms", "email", "push"]),
  recipient: z.string().min(3).max(120),
  message: z.string().min(8).max(500)
});

export const unlockInputSchema = z.object({
  email: z.string().email()
});

export const createTablesSQL = `
CREATE TABLE IF NOT EXISTS routes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  stops JSONB NOT NULL,
  path JSONB NOT NULL,
  estimated_minutes INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drivers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  license_number TEXT NOT NULL,
  status TEXT NOT NULL,
  max_hours_per_day INTEGER NOT NULL DEFAULT 8,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schedules (
  id SERIAL PRIMARY KEY,
  route_id INTEGER NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  driver_id INTEGER NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  service_date DATE NOT NULL,
  departure_time TIMESTAMPTZ NOT NULL,
  arrival_time TIMESTAMPTZ NOT NULL,
  capacity INTEGER NOT NULL,
  booked_seats INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  schedule_id INTEGER REFERENCES schedules(id) ON DELETE SET NULL,
  channel TEXT NOT NULL,
  recipient TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS paid_customers (
  email TEXT PRIMARY KEY,
  source TEXT NOT NULL DEFAULT 'stripe',
  last_purchase_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;
