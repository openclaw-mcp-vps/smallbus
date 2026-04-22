import { Pool, type QueryResultRow } from "pg";
import {
  createTablesSQL,
  type DriverRecord,
  driverInputSchema,
  type NotificationRecord,
  notificationInputSchema,
  type RouteRecord,
  routeInputSchema,
  type ScheduleRecord,
  scheduleInputSchema
} from "@/lib/db/schema";

type InputRoute = Omit<RouteRecord, "id" | "createdAt">;
type InputDriver = Omit<DriverRecord, "id" | "createdAt">;
type InputSchedule = Omit<ScheduleRecord, "id" | "createdAt">;
type InputNotification = Omit<NotificationRecord, "id" | "createdAt" | "status">;

type MemoryStore = {
  routes: RouteRecord[];
  drivers: DriverRecord[];
  schedules: ScheduleRecord[];
  notifications: NotificationRecord[];
  paidCustomers: Set<string>;
  counters: {
    routes: number;
    drivers: number;
    schedules: number;
    notifications: number;
  };
};

const globalStore = globalThis as typeof globalThis & {
  __smallbusMemoryStore?: MemoryStore;
};

const seedNow = new Date();

const seedRoutes: RouteRecord[] = [
  {
    id: 1,
    name: "North Loop Commuter",
    origin: "Cedar Park",
    destination: "Downtown Transit Hub",
    stops: ["Cedar Park", "Oak Ridge", "Market Square", "Transit Hub"],
    path: [
      { lat: 30.5052, lng: -97.8203, label: "Cedar Park" },
      { lat: 30.4438, lng: -97.767, label: "Oak Ridge" },
      { lat: 30.2809, lng: -97.7386, label: "Market Square" },
      { lat: 30.2664, lng: -97.7421, label: "Transit Hub" }
    ],
    estimatedMinutes: 46,
    active: true,
    createdAt: seedNow.toISOString()
  },
  {
    id: 2,
    name: "Airport Connector",
    origin: "Riverbend Park-and-Ride",
    destination: "Regional Airport",
    stops: ["Riverbend", "South Station", "Airport"],
    path: [
      { lat: 30.2058, lng: -97.7835, label: "Riverbend" },
      { lat: 30.1948, lng: -97.7492, label: "South Station" },
      { lat: 30.196, lng: -97.6665, label: "Regional Airport" }
    ],
    estimatedMinutes: 34,
    active: true,
    createdAt: seedNow.toISOString()
  }
];

const seedDrivers: DriverRecord[] = [
  {
    id: 1,
    name: "Marta Silva",
    phone: "+1-512-555-0147",
    licenseNumber: "TX-CDL-88214",
    status: "available",
    maxHoursPerDay: 9,
    createdAt: seedNow.toISOString()
  },
  {
    id: 2,
    name: "Derek Owens",
    phone: "+1-512-555-0162",
    licenseNumber: "TX-CDL-55671",
    status: "on_route",
    maxHoursPerDay: 8,
    createdAt: seedNow.toISOString()
  }
];

const today = new Date();
const later = new Date(today.getTime() + 90 * 60 * 1000);

const seedSchedules: ScheduleRecord[] = [
  {
    id: 1,
    routeId: 1,
    driverId: 2,
    serviceDate: today.toISOString().slice(0, 10),
    departureTime: today.toISOString(),
    arrivalTime: later.toISOString(),
    capacity: 28,
    bookedSeats: 19,
    status: "in_service",
    notes: "Add extra stop near Oak Ridge school if needed.",
    createdAt: seedNow.toISOString()
  }
];

const seedNotifications: NotificationRecord[] = [
  {
    id: 1,
    scheduleId: 1,
    channel: "sms",
    recipient: "+15125550199",
    message: "North Loop is running 8 minutes late due to traffic near Market Square.",
    status: "sent",
    createdAt: seedNow.toISOString()
  }
];

const memoryStore: MemoryStore =
  globalStore.__smallbusMemoryStore ??
  (globalStore.__smallbusMemoryStore = {
    routes: seedRoutes,
    drivers: seedDrivers,
    schedules: seedSchedules,
    notifications: seedNotifications,
    paidCustomers: new Set<string>(),
    counters: {
      routes: seedRoutes.length,
      drivers: seedDrivers.length,
      schedules: seedSchedules.length,
      notifications: seedNotifications.length
    }
  });

const hasDatabase = Boolean(process.env.DATABASE_URL);

const pool = hasDatabase
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
    })
  : null;

let schemaReady = false;

async function ensureSchema() {
  if (!pool || schemaReady) {
    return;
  }

  await pool.query(createTablesSQL);
  schemaReady = true;
}

function mapRouteRow(row: {
  id: number;
  name: string;
  origin: string;
  destination: string;
  stops: string[];
  path: RouteRecord["path"];
  estimated_minutes: number;
  active: boolean;
  created_at: string;
}): RouteRecord {
  return {
    id: row.id,
    name: row.name,
    origin: row.origin,
    destination: row.destination,
    stops: row.stops,
    path: row.path,
    estimatedMinutes: row.estimated_minutes,
    active: row.active,
    createdAt: row.created_at
  };
}

function mapDriverRow(row: {
  id: number;
  name: string;
  phone: string;
  license_number: string;
  status: DriverRecord["status"];
  max_hours_per_day: number;
  created_at: string;
}): DriverRecord {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    licenseNumber: row.license_number,
    status: row.status,
    maxHoursPerDay: row.max_hours_per_day,
    createdAt: row.created_at
  };
}

function mapScheduleRow(row: {
  id: number;
  route_id: number;
  driver_id: number;
  service_date: string;
  departure_time: string;
  arrival_time: string;
  capacity: number;
  booked_seats: number;
  status: ScheduleRecord["status"];
  notes: string;
  created_at: string;
}): ScheduleRecord {
  return {
    id: row.id,
    routeId: row.route_id,
    driverId: row.driver_id,
    serviceDate: row.service_date,
    departureTime: row.departure_time,
    arrivalTime: row.arrival_time,
    capacity: row.capacity,
    bookedSeats: row.booked_seats,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at
  };
}

function mapNotificationRow(row: {
  id: number;
  schedule_id: number | null;
  channel: NotificationRecord["channel"];
  recipient: string;
  message: string;
  status: NotificationRecord["status"];
  created_at: string;
}): NotificationRecord {
  return {
    id: row.id,
    scheduleId: row.schedule_id,
    channel: row.channel,
    recipient: row.recipient,
    message: row.message,
    status: row.status,
    createdAt: row.created_at
  };
}

async function dbQuery<T extends QueryResultRow>(queryText: string, values: unknown[] = []) {
  if (!pool) {
    throw new Error("No database pool available");
  }

  await ensureSchema();
  const result = await pool.query<T>(queryText, values);
  return result.rows;
}

export async function getRoutes(): Promise<RouteRecord[]> {
  if (!pool) {
    return [...memoryStore.routes].sort((a, b) => a.name.localeCompare(b.name));
  }

  const rows = await dbQuery<{
    id: number;
    name: string;
    origin: string;
    destination: string;
    stops: string[];
    path: RouteRecord["path"];
    estimated_minutes: number;
    active: boolean;
    created_at: string;
  }>("SELECT * FROM routes ORDER BY created_at DESC");

  return rows.map(mapRouteRow);
}

export async function createRoute(payload: InputRoute): Promise<RouteRecord> {
  const parsed = routeInputSchema.parse(payload);

  if (!pool) {
    const record: RouteRecord = {
      id: ++memoryStore.counters.routes,
      ...parsed,
      createdAt: new Date().toISOString()
    };

    memoryStore.routes.unshift(record);
    return record;
  }

  const rows = await dbQuery<{
    id: number;
    name: string;
    origin: string;
    destination: string;
    stops: string[];
    path: RouteRecord["path"];
    estimated_minutes: number;
    active: boolean;
    created_at: string;
  }>(
    `INSERT INTO routes (name, origin, destination, stops, path, estimated_minutes, active)
     VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7)
     RETURNING *`,
    [
      parsed.name,
      parsed.origin,
      parsed.destination,
      JSON.stringify(parsed.stops),
      JSON.stringify(parsed.path),
      parsed.estimatedMinutes,
      parsed.active
    ]
  );

  return mapRouteRow(rows[0]);
}

export async function deleteRoute(routeId: number): Promise<boolean> {
  if (!pool) {
    const initialLength = memoryStore.routes.length;
    memoryStore.routes = memoryStore.routes.filter((route) => route.id !== routeId);
    memoryStore.schedules = memoryStore.schedules.filter((schedule) => schedule.routeId !== routeId);
    return memoryStore.routes.length < initialLength;
  }

  const rows = await dbQuery<{ id: number }>("DELETE FROM routes WHERE id = $1 RETURNING id", [routeId]);
  return rows.length > 0;
}

export async function getDrivers(): Promise<DriverRecord[]> {
  if (!pool) {
    return [...memoryStore.drivers].sort((a, b) => a.name.localeCompare(b.name));
  }

  const rows = await dbQuery<{
    id: number;
    name: string;
    phone: string;
    license_number: string;
    status: DriverRecord["status"];
    max_hours_per_day: number;
    created_at: string;
  }>("SELECT * FROM drivers ORDER BY created_at DESC");

  return rows.map(mapDriverRow);
}

export async function createDriver(payload: InputDriver): Promise<DriverRecord> {
  const parsed = driverInputSchema.parse(payload);

  if (!pool) {
    const record: DriverRecord = {
      id: ++memoryStore.counters.drivers,
      ...parsed,
      createdAt: new Date().toISOString()
    };

    memoryStore.drivers.unshift(record);
    return record;
  }

  const rows = await dbQuery<{
    id: number;
    name: string;
    phone: string;
    license_number: string;
    status: DriverRecord["status"];
    max_hours_per_day: number;
    created_at: string;
  }>(
    `INSERT INTO drivers (name, phone, license_number, status, max_hours_per_day)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [parsed.name, parsed.phone, parsed.licenseNumber, parsed.status, parsed.maxHoursPerDay]
  );

  return mapDriverRow(rows[0]);
}

export async function updateDriverStatus(
  driverId: number,
  status: DriverRecord["status"]
): Promise<DriverRecord | null> {
  driverInputSchema.pick({ status: true }).parse({ status });

  if (!pool) {
    const target = memoryStore.drivers.find((driver) => driver.id === driverId);
    if (!target) {
      return null;
    }

    target.status = status;
    return target;
  }

  const rows = await dbQuery<{
    id: number;
    name: string;
    phone: string;
    license_number: string;
    status: DriverRecord["status"];
    max_hours_per_day: number;
    created_at: string;
  }>("UPDATE drivers SET status = $1 WHERE id = $2 RETURNING *", [status, driverId]);

  if (!rows[0]) {
    return null;
  }

  return mapDriverRow(rows[0]);
}

export async function deleteDriver(driverId: number): Promise<boolean> {
  if (!pool) {
    const initialLength = memoryStore.drivers.length;
    memoryStore.drivers = memoryStore.drivers.filter((driver) => driver.id !== driverId);
    return memoryStore.drivers.length < initialLength;
  }

  const rows = await dbQuery<{ id: number }>("DELETE FROM drivers WHERE id = $1 RETURNING id", [driverId]);
  return rows.length > 0;
}

export async function getSchedules(): Promise<ScheduleRecord[]> {
  if (!pool) {
    return [...memoryStore.schedules].sort(
      (a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
    );
  }

  const rows = await dbQuery<{
    id: number;
    route_id: number;
    driver_id: number;
    service_date: string;
    departure_time: string;
    arrival_time: string;
    capacity: number;
    booked_seats: number;
    status: ScheduleRecord["status"];
    notes: string;
    created_at: string;
  }>("SELECT * FROM schedules ORDER BY departure_time ASC");

  return rows.map(mapScheduleRow);
}

export async function createSchedule(payload: InputSchedule): Promise<ScheduleRecord> {
  const parsed = scheduleInputSchema.parse(payload);

  if (!pool) {
    const record: ScheduleRecord = {
      id: ++memoryStore.counters.schedules,
      ...parsed,
      createdAt: new Date().toISOString()
    };

    memoryStore.schedules.push(record);
    return record;
  }

  const rows = await dbQuery<{
    id: number;
    route_id: number;
    driver_id: number;
    service_date: string;
    departure_time: string;
    arrival_time: string;
    capacity: number;
    booked_seats: number;
    status: ScheduleRecord["status"];
    notes: string;
    created_at: string;
  }>(
    `INSERT INTO schedules
      (route_id, driver_id, service_date, departure_time, arrival_time, capacity, booked_seats, status, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      parsed.routeId,
      parsed.driverId,
      parsed.serviceDate,
      parsed.departureTime,
      parsed.arrivalTime,
      parsed.capacity,
      parsed.bookedSeats,
      parsed.status,
      parsed.notes
    ]
  );

  return mapScheduleRow(rows[0]);
}

export async function deleteSchedule(scheduleId: number): Promise<boolean> {
  if (!pool) {
    const initialLength = memoryStore.schedules.length;
    memoryStore.schedules = memoryStore.schedules.filter((schedule) => schedule.id !== scheduleId);
    return memoryStore.schedules.length < initialLength;
  }

  const rows = await dbQuery<{ id: number }>("DELETE FROM schedules WHERE id = $1 RETURNING id", [scheduleId]);
  return rows.length > 0;
}

export async function getNotifications(): Promise<NotificationRecord[]> {
  if (!pool) {
    return [...memoryStore.notifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  const rows = await dbQuery<{
    id: number;
    schedule_id: number | null;
    channel: NotificationRecord["channel"];
    recipient: string;
    message: string;
    status: NotificationRecord["status"];
    created_at: string;
  }>("SELECT * FROM notifications ORDER BY created_at DESC");

  return rows.map(mapNotificationRow);
}

export async function createNotification(payload: InputNotification): Promise<NotificationRecord> {
  const parsed = notificationInputSchema.parse(payload);

  if (!pool) {
    const record: NotificationRecord = {
      id: ++memoryStore.counters.notifications,
      ...parsed,
      status: "queued",
      createdAt: new Date().toISOString()
    };

    memoryStore.notifications.unshift(record);
    setTimeout(() => {
      const target = memoryStore.notifications.find((notification) => notification.id === record.id);
      if (target) {
        target.status = "sent";
      }
    }, 1200);

    return record;
  }

  const rows = await dbQuery<{
    id: number;
    schedule_id: number | null;
    channel: NotificationRecord["channel"];
    recipient: string;
    message: string;
    status: NotificationRecord["status"];
    created_at: string;
  }>(
    `INSERT INTO notifications (schedule_id, channel, recipient, message, status)
     VALUES ($1, $2, $3, $4, 'queued')
     RETURNING *`,
    [parsed.scheduleId, parsed.channel, parsed.recipient, parsed.message]
  );

  const inserted = mapNotificationRow(rows[0]);
  await dbQuery("UPDATE notifications SET status = 'sent' WHERE id = $1", [inserted.id]);

  return {
    ...inserted,
    status: "sent"
  };
}

export async function addPaidCustomer(email: string, source = "stripe"): Promise<void> {
  const normalized = email.trim().toLowerCase();

  if (!pool) {
    memoryStore.paidCustomers.add(normalized);
    return;
  }

  await dbQuery(
    `INSERT INTO paid_customers (email, source, last_purchase_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (email)
     DO UPDATE SET source = EXCLUDED.source, last_purchase_at = NOW()`,
    [normalized, source]
  );
}

export async function isPaidCustomer(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();

  if (!pool) {
    return memoryStore.paidCustomers.has(normalized);
  }

  const rows = await dbQuery<{ email: string }>("SELECT email FROM paid_customers WHERE email = $1", [
    normalized
  ]);

  return Boolean(rows[0]);
}

export function isDatabaseConnected() {
  return Boolean(pool);
}
