import { z } from "zod";

export const CREATE_TABLE_STATEMENTS = [
  `
  CREATE TABLE IF NOT EXISTS routes (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    stops JSONB NOT NULL DEFAULT '[]',
    default_start_time TEXT NOT NULL,
    estimated_minutes INTEGER NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS drivers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    license_number TEXT NOT NULL,
    availability JSONB NOT NULL DEFAULT '[]',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS schedules (
    id SERIAL PRIMARY KEY,
    route_id INTEGER NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    driver_id INTEGER NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    service_date DATE NOT NULL,
    departure_time TEXT NOT NULL,
    status TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    schedule_id INTEGER REFERENCES schedules(id) ON DELETE SET NULL,
    channel TEXT NOT NULL,
    recipient TEXT NOT NULL,
    message TEXT NOT NULL,
    scheduled_for TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS billing_events (
    id SERIAL PRIMARY KEY,
    event_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    order_id TEXT NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  `
] as const;

export const routeInputSchema = z.object({
  name: z.string().min(3).max(80),
  origin: z.string().min(2).max(80),
  destination: z.string().min(2).max(80),
  stops: z.array(z.string().min(2).max(80)).min(2).max(20),
  default_start_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/u, "Use HH:MM format"),
  estimated_minutes: z.number().int().min(10).max(480),
  active: z.boolean().default(true)
});

export const driverInputSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().min(7).max(30),
  license_number: z.string().min(4).max(40),
  availability: z.array(z.string().min(2).max(20)).min(1).max(7),
  active: z.boolean().default(true)
});

export const scheduleInputSchema = z.object({
  route_id: z.number().int().positive(),
  driver_id: z.number().int().positive(),
  service_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u),
  departure_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/u, "Use HH:MM format"),
  status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]),
  notes: z.string().max(300).default("")
});

export const notificationInputSchema = z.object({
  schedule_id: z.number().int().positive().nullable(),
  channel: z.enum(["sms", "email", "push"]),
  recipient: z.string().min(3).max(160),
  message: z.string().min(8).max(320),
  scheduled_for: z.string().datetime(),
  status: z.enum(["queued", "sent", "failed"]).default("queued")
});
