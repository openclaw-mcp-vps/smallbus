import fs from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";
import type {
  BillingEvent,
  DashboardStats,
  DriverItem,
  NotificationItem,
  RouteItem,
  ScheduleItem,
  ScheduleView
} from "@/lib/types";
import { CREATE_TABLE_STATEMENTS } from "@/lib/db/schema";

type LocalStore = {
  routes: RouteItem[];
  drivers: DriverItem[];
  schedules: ScheduleItem[];
  notifications: NotificationItem[];
  billingEvents: BillingEvent[];
  counters: {
    routes: number;
    drivers: number;
    schedules: number;
    notifications: number;
    billingEvents: number;
  };
};

const DATA_FILE_PATH = path.join(process.cwd(), "data", "smallbus-store.json");
const hasPostgres = Boolean(process.env.DATABASE_URL);

let pgPool: Pool | null = null;
let postgresInitialized = false;

function nowIso(): string {
  return new Date().toISOString();
}

function buildSeedStore(): LocalStore {
  const createdAt = nowIso();

  return {
    routes: [
      {
        id: 1,
        name: "North Loop",
        origin: "Depot A",
        destination: "Hospital District",
        stops: ["Depot A", "Elm Street", "City Hall", "Hospital District"],
        default_start_time: "06:30",
        estimated_minutes: 48,
        active: true,
        created_at: createdAt
      },
      {
        id: 2,
        name: "School Connector",
        origin: "River Park",
        destination: "Central High",
        stops: ["River Park", "Maple Ave", "Library", "Central High"],
        default_start_time: "07:10",
        estimated_minutes: 35,
        active: true,
        created_at: createdAt
      }
    ],
    drivers: [
      {
        id: 1,
        name: "Avery Brooks",
        phone: "+1-555-0141",
        license_number: "CDL-47391",
        availability: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        active: true,
        created_at: createdAt
      },
      {
        id: 2,
        name: "Mia Rivera",
        phone: "+1-555-0168",
        license_number: "CDL-56120",
        availability: ["Tue", "Wed", "Thu", "Fri", "Sat"],
        active: true,
        created_at: createdAt
      }
    ],
    schedules: [
      {
        id: 1,
        route_id: 1,
        driver_id: 1,
        service_date: new Date().toISOString().slice(0, 10),
        departure_time: "06:30",
        status: "scheduled",
        notes: "Morning healthcare worker run",
        created_at: createdAt
      },
      {
        id: 2,
        route_id: 2,
        driver_id: 2,
        service_date: new Date().toISOString().slice(0, 10),
        departure_time: "07:10",
        status: "scheduled",
        notes: "School first bell coverage",
        created_at: createdAt
      }
    ],
    notifications: [
      {
        id: 1,
        schedule_id: 1,
        channel: "sms",
        recipient: "+1-555-0001",
        message: "North Loop departs Depot A at 06:30. Reply HELP for support.",
        scheduled_for: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        status: "queued",
        created_at: createdAt
      }
    ],
    billingEvents: [],
    counters: {
      routes: 3,
      drivers: 3,
      schedules: 3,
      notifications: 2,
      billingEvents: 1
    }
  };
}

async function ensureLocalStore(): Promise<LocalStore> {
  try {
    const raw = await fs.readFile(DATA_FILE_PATH, "utf8");
    return JSON.parse(raw) as LocalStore;
  } catch {
    const seed = buildSeedStore();
    await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(seed, null, 2), "utf8");
    return seed;
  }
}

async function writeLocalStore(store: LocalStore): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(store, null, 2), "utf8");
}

function getPool(): Pool {
  if (!pgPool) {
    pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pgPool;
}

async function initializePostgres(): Promise<void> {
  if (!hasPostgres || postgresInitialized) {
    return;
  }

  const pool = getPool();

  for (const statement of CREATE_TABLE_STATEMENTS) {
    await pool.query(statement);
  }

  const routesCount = await pool.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM routes");

  if (Number(routesCount.rows[0]?.count ?? "0") === 0) {
    const today = new Date().toISOString().slice(0, 10);

    await pool.query(
      `INSERT INTO routes (name, origin, destination, stops, default_start_time, estimated_minutes, active)
       VALUES
       ('North Loop', 'Depot A', 'Hospital District', $1::jsonb, '06:30', 48, true),
       ('School Connector', 'River Park', 'Central High', $2::jsonb, '07:10', 35, true)`,
      [
        JSON.stringify(["Depot A", "Elm Street", "City Hall", "Hospital District"]),
        JSON.stringify(["River Park", "Maple Ave", "Library", "Central High"])
      ]
    );

    await pool.query(
      `INSERT INTO drivers (name, phone, license_number, availability, active)
       VALUES
       ('Avery Brooks', '+1-555-0141', 'CDL-47391', $1::jsonb, true),
       ('Mia Rivera', '+1-555-0168', 'CDL-56120', $2::jsonb, true)`,
      [JSON.stringify(["Mon", "Tue", "Wed", "Thu", "Fri"]), JSON.stringify(["Tue", "Wed", "Thu", "Fri", "Sat"])]
    );

    await pool.query(
      `INSERT INTO schedules (route_id, driver_id, service_date, departure_time, status, notes)
       VALUES
       (1, 1, $1::date, '06:30', 'scheduled', 'Morning healthcare worker run'),
       (2, 2, $1::date, '07:10', 'scheduled', 'School first bell coverage')`,
      [today]
    );

    await pool.query(
      `INSERT INTO notifications (schedule_id, channel, recipient, message, scheduled_for, status)
       VALUES (1, 'sms', '+1-555-0001', 'North Loop departs Depot A at 06:30. Reply HELP for support.', NOW() + INTERVAL '15 minutes', 'queued')`
    );
  }

  postgresInitialized = true;
}

function mapRouteRow(row: {
  id: number;
  name: string;
  origin: string;
  destination: string;
  stops: string[];
  default_start_time: string;
  estimated_minutes: number;
  active: boolean;
  created_at: string;
}): RouteItem {
  return {
    ...row,
    stops: Array.isArray(row.stops) ? row.stops : [],
    created_at: new Date(row.created_at).toISOString()
  };
}

function mapDriverRow(row: {
  id: number;
  name: string;
  phone: string;
  license_number: string;
  availability: string[];
  active: boolean;
  created_at: string;
}): DriverItem {
  return {
    ...row,
    availability: Array.isArray(row.availability) ? row.availability : [],
    created_at: new Date(row.created_at).toISOString()
  };
}

function mapScheduleRow(row: {
  id: number;
  route_id: number;
  driver_id: number;
  service_date: string;
  departure_time: string;
  status: ScheduleItem["status"];
  notes: string;
  created_at: string;
}): ScheduleItem {
  return {
    ...row,
    created_at: new Date(row.created_at).toISOString()
  };
}

function mapNotificationRow(row: {
  id: number;
  schedule_id: number | null;
  channel: NotificationItem["channel"];
  recipient: string;
  message: string;
  scheduled_for: string;
  status: NotificationItem["status"];
  created_at: string;
}): NotificationItem {
  return {
    ...row,
    scheduled_for: new Date(row.scheduled_for).toISOString(),
    created_at: new Date(row.created_at).toISOString()
  };
}

export async function listRoutes(): Promise<RouteItem[]> {
  if (hasPostgres) {
    await initializePostgres();
    const result = await getPool().query<{
      id: number;
      name: string;
      origin: string;
      destination: string;
      stops: string[];
      default_start_time: string;
      estimated_minutes: number;
      active: boolean;
      created_at: string;
    }>(
      `SELECT id, name, origin, destination, stops, default_start_time, estimated_minutes, active, created_at::text
       AS created_at
       FROM routes
       ORDER BY id DESC`
    );

    return result.rows.map(mapRouteRow);
  }

  const store = await ensureLocalStore();
  return [...store.routes].sort((a, b) => b.id - a.id);
}

export async function createRoute(input: Omit<RouteItem, "id" | "created_at">): Promise<RouteItem> {
  if (hasPostgres) {
    await initializePostgres();
    const result = await getPool().query<{
      id: number;
      name: string;
      origin: string;
      destination: string;
      stops: string[];
      default_start_time: string;
      estimated_minutes: number;
      active: boolean;
      created_at: string;
    }>(
      `INSERT INTO routes (name, origin, destination, stops, default_start_time, estimated_minutes, active)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7)
       RETURNING id, name, origin, destination, stops, default_start_time, estimated_minutes, active, created_at::text AS created_at`,
      [
        input.name,
        input.origin,
        input.destination,
        JSON.stringify(input.stops),
        input.default_start_time,
        input.estimated_minutes,
        input.active
      ]
    );

    return mapRouteRow(result.rows[0]);
  }

  const store = await ensureLocalStore();
  const route: RouteItem = {
    ...input,
    id: store.counters.routes,
    created_at: nowIso()
  };

  store.counters.routes += 1;
  store.routes.push(route);
  await writeLocalStore(store);

  return route;
}

export async function listDrivers(): Promise<DriverItem[]> {
  if (hasPostgres) {
    await initializePostgres();
    const result = await getPool().query<{
      id: number;
      name: string;
      phone: string;
      license_number: string;
      availability: string[];
      active: boolean;
      created_at: string;
    }>(
      `SELECT id, name, phone, license_number, availability, active, created_at::text AS created_at
       FROM drivers
       ORDER BY id DESC`
    );

    return result.rows.map(mapDriverRow);
  }

  const store = await ensureLocalStore();
  return [...store.drivers].sort((a, b) => b.id - a.id);
}

export async function createDriver(input: Omit<DriverItem, "id" | "created_at">): Promise<DriverItem> {
  if (hasPostgres) {
    await initializePostgres();
    const result = await getPool().query<{
      id: number;
      name: string;
      phone: string;
      license_number: string;
      availability: string[];
      active: boolean;
      created_at: string;
    }>(
      `INSERT INTO drivers (name, phone, license_number, availability, active)
       VALUES ($1, $2, $3, $4::jsonb, $5)
       RETURNING id, name, phone, license_number, availability, active, created_at::text AS created_at`,
      [input.name, input.phone, input.license_number, JSON.stringify(input.availability), input.active]
    );

    return mapDriverRow(result.rows[0]);
  }

  const store = await ensureLocalStore();
  const driver: DriverItem = {
    ...input,
    id: store.counters.drivers,
    created_at: nowIso()
  };

  store.counters.drivers += 1;
  store.drivers.push(driver);
  await writeLocalStore(store);

  return driver;
}

export async function listSchedules(): Promise<ScheduleView[]> {
  if (hasPostgres) {
    await initializePostgres();
    const result = await getPool().query<{
      id: number;
      route_id: number;
      driver_id: number;
      service_date: string;
      departure_time: string;
      status: ScheduleItem["status"];
      notes: string;
      created_at: string;
      route_name: string;
      driver_name: string;
    }>(
      `SELECT s.id,
              s.route_id,
              s.driver_id,
              TO_CHAR(s.service_date, 'YYYY-MM-DD') AS service_date,
              s.departure_time,
              s.status,
              s.notes,
              s.created_at::text AS created_at,
              r.name AS route_name,
              d.name AS driver_name
       FROM schedules s
       JOIN routes r ON r.id = s.route_id
       JOIN drivers d ON d.id = s.driver_id
       ORDER BY s.service_date DESC, s.departure_time ASC`
    );

    return result.rows.map((row) => ({
      ...mapScheduleRow(row),
      route_name: row.route_name,
      driver_name: row.driver_name
    }));
  }

  const store = await ensureLocalStore();

  return store.schedules
    .map((schedule) => {
      const route = store.routes.find((item) => item.id === schedule.route_id);
      const driver = store.drivers.find((item) => item.id === schedule.driver_id);

      return {
        ...schedule,
        route_name: route?.name ?? "Unknown Route",
        driver_name: driver?.name ?? "Unassigned"
      };
    })
    .sort((a, b) => `${b.service_date} ${b.departure_time}`.localeCompare(`${a.service_date} ${a.departure_time}`));
}

export async function createSchedule(input: Omit<ScheduleItem, "id" | "created_at">): Promise<ScheduleItem> {
  if (hasPostgres) {
    await initializePostgres();

    const routeExists = await getPool().query<{ id: number }>("SELECT id FROM routes WHERE id = $1", [input.route_id]);
    const driverExists = await getPool().query<{ id: number }>("SELECT id FROM drivers WHERE id = $1", [input.driver_id]);

    if (!routeExists.rowCount) {
      throw new Error("Route not found");
    }

    if (!driverExists.rowCount) {
      throw new Error("Driver not found");
    }

    const result = await getPool().query<{
      id: number;
      route_id: number;
      driver_id: number;
      service_date: string;
      departure_time: string;
      status: ScheduleItem["status"];
      notes: string;
      created_at: string;
    }>(
      `INSERT INTO schedules (route_id, driver_id, service_date, departure_time, status, notes)
       VALUES ($1, $2, $3::date, $4, $5, $6)
       RETURNING id,
                 route_id,
                 driver_id,
                 TO_CHAR(service_date, 'YYYY-MM-DD') AS service_date,
                 departure_time,
                 status,
                 notes,
                 created_at::text AS created_at`,
      [input.route_id, input.driver_id, input.service_date, input.departure_time, input.status, input.notes]
    );

    return mapScheduleRow(result.rows[0]);
  }

  const store = await ensureLocalStore();

  if (!store.routes.some((route) => route.id === input.route_id)) {
    throw new Error("Route not found");
  }

  if (!store.drivers.some((driver) => driver.id === input.driver_id)) {
    throw new Error("Driver not found");
  }

  const schedule: ScheduleItem = {
    ...input,
    id: store.counters.schedules,
    created_at: nowIso()
  };

  store.counters.schedules += 1;
  store.schedules.push(schedule);
  await writeLocalStore(store);

  return schedule;
}

export async function listNotifications(): Promise<NotificationItem[]> {
  if (hasPostgres) {
    await initializePostgres();
    const result = await getPool().query<{
      id: number;
      schedule_id: number | null;
      channel: NotificationItem["channel"];
      recipient: string;
      message: string;
      scheduled_for: string;
      status: NotificationItem["status"];
      created_at: string;
    }>(
      `SELECT id, schedule_id, channel, recipient, message, scheduled_for::text AS scheduled_for,
              status, created_at::text AS created_at
       FROM notifications
       ORDER BY scheduled_for DESC`
    );

    return result.rows.map(mapNotificationRow);
  }

  const store = await ensureLocalStore();
  return [...store.notifications].sort((a, b) => b.scheduled_for.localeCompare(a.scheduled_for));
}

export async function createNotification(
  input: Omit<NotificationItem, "id" | "created_at">
): Promise<NotificationItem> {
  if (hasPostgres) {
    await initializePostgres();
    const result = await getPool().query<{
      id: number;
      schedule_id: number | null;
      channel: NotificationItem["channel"];
      recipient: string;
      message: string;
      scheduled_for: string;
      status: NotificationItem["status"];
      created_at: string;
    }>(
      `INSERT INTO notifications (schedule_id, channel, recipient, message, scheduled_for, status)
       VALUES ($1, $2, $3, $4, $5::timestamptz, $6)
       RETURNING id,
                 schedule_id,
                 channel,
                 recipient,
                 message,
                 scheduled_for::text AS scheduled_for,
                 status,
                 created_at::text AS created_at`,
      [input.schedule_id, input.channel, input.recipient, input.message, input.scheduled_for, input.status]
    );

    return mapNotificationRow(result.rows[0]);
  }

  const store = await ensureLocalStore();
  const notification: NotificationItem = {
    ...input,
    id: store.counters.notifications,
    created_at: nowIso()
  };

  store.counters.notifications += 1;
  store.notifications.push(notification);
  await writeLocalStore(store);

  return notification;
}

export async function recordBillingEvent(input: Omit<BillingEvent, "id" | "created_at">): Promise<void> {
  if (hasPostgres) {
    await initializePostgres();

    await getPool().query(
      `INSERT INTO billing_events (event_name, customer_email, order_id, payload)
       VALUES ($1, $2, $3, $4::jsonb)`,
      [input.event_name, input.customer_email, input.order_id, input.payload]
    );

    return;
  }

  const store = await ensureLocalStore();
  store.billingEvents.push({
    ...input,
    id: store.counters.billingEvents,
    created_at: nowIso()
  });
  store.counters.billingEvents += 1;

  await writeLocalStore(store);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  if (hasPostgres) {
    await initializePostgres();

    const [routes, drivers, trips, notifications, avgMinutes] = await Promise.all([
      getPool().query<{ count: string }>("SELECT COUNT(*)::text AS count FROM routes WHERE active = true"),
      getPool().query<{ count: string }>("SELECT COUNT(*)::text AS count FROM drivers WHERE active = true"),
      getPool().query<{ count: string }>(
        "SELECT COUNT(*)::text AS count FROM schedules WHERE service_date = CURRENT_DATE AND status <> 'cancelled'"
      ),
      getPool().query<{ count: string }>("SELECT COUNT(*)::text AS count FROM notifications WHERE status = 'queued'"),
      getPool().query<{ value: string | null }>(
        "SELECT ROUND(COALESCE(AVG(estimated_minutes), 0), 1)::text AS value FROM routes WHERE active = true"
      )
    ]);

    return {
      activeRoutes: Number(routes.rows[0]?.count ?? "0"),
      activeDrivers: Number(drivers.rows[0]?.count ?? "0"),
      todaysTrips: Number(trips.rows[0]?.count ?? "0"),
      queuedNotifications: Number(notifications.rows[0]?.count ?? "0"),
      avgRouteMinutes: Number(avgMinutes.rows[0]?.value ?? "0")
    };
  }

  const store = await ensureLocalStore();
  const today = new Date().toISOString().slice(0, 10);
  const activeRoutes = store.routes.filter((route) => route.active).length;
  const activeDrivers = store.drivers.filter((driver) => driver.active).length;
  const todaysTrips = store.schedules.filter(
    (schedule) => schedule.service_date === today && schedule.status !== "cancelled"
  ).length;
  const queuedNotifications = store.notifications.filter((notification) => notification.status === "queued").length;
  const activeRouteMinutes = store.routes.filter((route) => route.active).map((route) => route.estimated_minutes);
  const avgRouteMinutes =
    activeRouteMinutes.length > 0
      ? Number((activeRouteMinutes.reduce((sum, value) => sum + value, 0) / activeRouteMinutes.length).toFixed(1))
      : 0;

  return {
    activeRoutes,
    activeDrivers,
    todaysTrips,
    queuedNotifications,
    avgRouteMinutes
  };
}
