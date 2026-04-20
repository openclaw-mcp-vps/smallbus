import { promises as fs } from "node:fs";
import path from "node:path";

import { Pool } from "pg";

export type RouteStop = {
  name: string;
  lat: number;
  lng: number;
};

export type BusRoute = {
  id: number;
  name: string;
  startStop: string;
  endStop: string;
  distanceKm: number;
  active: boolean;
  stops: RouteStop[];
  createdAt: string;
};

export type DriverStatus = "available" | "on-route" | "off-duty" | "leave";

export type Driver = {
  id: number;
  name: string;
  phone: string;
  licenseNumber: string;
  status: DriverStatus;
  createdAt: string;
};

export type ScheduleStatus = "planned" | "active" | "completed" | "delayed";

export type ScheduleEntry = {
  id: number;
  routeId: number;
  driverId: number;
  routeName: string | null;
  driverName: string | null;
  startTime: string;
  endTime: string;
  vehicleCode: string;
  status: ScheduleStatus;
  notes: string;
  createdAt: string;
};

export type NotificationChannel = "sms" | "email" | "in-app";

export type NotificationEntry = {
  id: number;
  routeId: number | null;
  routeName: string | null;
  channel: NotificationChannel;
  targetGroup: string;
  message: string;
  sentAt: string;
  createdAt: string;
};

export type NewRouteInput = Omit<BusRoute, "id" | "createdAt">;
export type NewDriverInput = Omit<Driver, "id" | "createdAt">;
export type NewScheduleInput = Omit<
  ScheduleEntry,
  "id" | "createdAt" | "routeName" | "driverName"
>;
export type NewNotificationInput = Omit<
  NotificationEntry,
  "id" | "createdAt" | "routeName" | "sentAt"
>;

const DATABASE_URL = process.env.DATABASE_URL;
const FILE_STORE_PATH = path.join(process.cwd(), "data", "smallbus.json");

type FileStore = {
  routes: BusRoute[];
  drivers: Driver[];
  schedules: ScheduleEntry[];
  notifications: NotificationEntry[];
  nextIds: {
    route: number;
    driver: number;
    schedule: number;
    notification: number;
  };
};

const seedStore: FileStore = {
  routes: [
    {
      id: 1,
      name: "Morning East Loop",
      startStop: "Depot A",
      endStop: "Ridge Medical Center",
      distanceKm: 18.4,
      active: true,
      stops: [
        { name: "Depot A", lat: 38.9724, lng: -95.2441 },
        { name: "Cedar & 9th", lat: 38.9808, lng: -95.2329 },
        { name: "College Transit Hub", lat: 38.9917, lng: -95.2432 },
        { name: "Ridge Medical Center", lat: 39.0041, lng: -95.2274 },
      ],
      createdAt: new Date().toISOString(),
    },
  ],
  drivers: [
    {
      id: 1,
      name: "Daniel Foster",
      phone: "+1-785-555-0142",
      licenseNumber: "KS-7345102",
      status: "available",
      createdAt: new Date().toISOString(),
    },
  ],
  schedules: [
    {
      id: 1,
      routeId: 1,
      driverId: 1,
      routeName: "Morning East Loop",
      driverName: "Daniel Foster",
      startTime: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 3).toISOString(),
      vehicleCode: "BUS-12",
      status: "planned",
      notes: "Wheelchair ramp check before departure.",
      createdAt: new Date().toISOString(),
    },
  ],
  notifications: [
    {
      id: 1,
      routeId: 1,
      routeName: "Morning East Loop",
      channel: "sms",
      targetGroup: "route-passengers",
      message:
        "Morning East Loop departs Depot A at 6:30 AM. Expect a 5-minute delay near Cedar & 9th.",
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  ],
  nextIds: {
    route: 2,
    driver: 2,
    schedule: 2,
    notification: 2,
  },
};

let fileMutationQueue = Promise.resolve();

async function ensureFileStore() {
  try {
    await fs.access(FILE_STORE_PATH);
  } catch {
    await fs.mkdir(path.dirname(FILE_STORE_PATH), { recursive: true });
    await fs.writeFile(FILE_STORE_PATH, JSON.stringify(seedStore, null, 2), "utf8");
  }
}

async function readFileStore() {
  await ensureFileStore();
  const raw = await fs.readFile(FILE_STORE_PATH, "utf8");
  return JSON.parse(raw) as FileStore;
}

async function writeFileStore(store: FileStore) {
  await fs.writeFile(FILE_STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

async function mutateFileStore<T>(
  mutator: (store: FileStore) => Promise<T> | T,
): Promise<T> {
  const operation = fileMutationQueue.then(async () => {
    const store = await readFileStore();
    const value = await mutator(store);
    await writeFileStore(store);
    return value;
  });

  fileMutationQueue = operation.then(
    () => undefined,
    () => undefined,
  );

  return operation;
}

declare global {
  var __smallbusPool: Pool | undefined;
  var __smallbusSchemaReady: boolean | undefined;
}

function getPool() {
  if (!DATABASE_URL) {
    return null;
  }

  if (!global.__smallbusPool) {
    global.__smallbusPool = new Pool({
      connectionString: DATABASE_URL,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : undefined,
    });
  }

  return global.__smallbusPool;
}

async function ensureSchema() {
  const pool = getPool();

  if (!pool || global.__smallbusSchemaReady) {
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS routes (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      start_stop TEXT NOT NULL,
      end_stop TEXT NOT NULL,
      distance_km NUMERIC(8, 2) NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      stops JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS drivers (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      license_number TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'available',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id SERIAL PRIMARY KEY,
      route_id INTEGER NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
      driver_id INTEGER NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
      start_time TIMESTAMPTZ NOT NULL,
      end_time TIMESTAMPTZ NOT NULL,
      vehicle_code TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'planned',
      notes TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      route_id INTEGER REFERENCES routes(id) ON DELETE SET NULL,
      channel TEXT NOT NULL,
      target_group TEXT NOT NULL,
      message TEXT NOT NULL,
      sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  global.__smallbusSchemaReady = true;
}

function mapRouteRow(row: Record<string, unknown>): BusRoute {
  return {
    id: Number(row.id),
    name: String(row.name),
    startStop: String(row.start_stop),
    endStop: String(row.end_stop),
    distanceKm: Number(row.distance_km),
    active: Boolean(row.active),
    stops: Array.isArray(row.stops) ? (row.stops as RouteStop[]) : [],
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

function mapDriverRow(row: Record<string, unknown>): Driver {
  return {
    id: Number(row.id),
    name: String(row.name),
    phone: String(row.phone),
    licenseNumber: String(row.license_number),
    status: String(row.status) as DriverStatus,
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

function mapScheduleRow(row: Record<string, unknown>): ScheduleEntry {
  return {
    id: Number(row.id),
    routeId: Number(row.route_id),
    driverId: Number(row.driver_id),
    routeName: row.route_name ? String(row.route_name) : null,
    driverName: row.driver_name ? String(row.driver_name) : null,
    startTime: new Date(String(row.start_time)).toISOString(),
    endTime: new Date(String(row.end_time)).toISOString(),
    vehicleCode: String(row.vehicle_code),
    status: String(row.status) as ScheduleStatus,
    notes: String(row.notes ?? ""),
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

function mapNotificationRow(row: Record<string, unknown>): NotificationEntry {
  return {
    id: Number(row.id),
    routeId: row.route_id === null ? null : Number(row.route_id),
    routeName: row.route_name ? String(row.route_name) : null,
    channel: String(row.channel) as NotificationChannel,
    targetGroup: String(row.target_group),
    message: String(row.message),
    sentAt: new Date(String(row.sent_at)).toISOString(),
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

export async function listRoutes() {
  const pool = getPool();

  if (pool) {
    await ensureSchema();
    const result = await pool.query(
      "SELECT * FROM routes ORDER BY active DESC, name ASC",
    );
    return result.rows.map((row) => mapRouteRow(row));
  }

  const store = await readFileStore();
  return [...store.routes].sort((a, b) => {
    if (a.active !== b.active) {
      return a.active ? -1 : 1;
    }

    return a.name.localeCompare(b.name);
  });
}

export async function createRoute(input: NewRouteInput) {
  const pool = getPool();

  if (pool) {
    await ensureSchema();
    const result = await pool.query(
      `
        INSERT INTO routes (name, start_stop, end_stop, distance_km, active, stops)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
      [
        input.name,
        input.startStop,
        input.endStop,
        input.distanceKm,
        input.active,
        JSON.stringify(input.stops),
      ],
    );

    return mapRouteRow(result.rows[0]);
  }

  return mutateFileStore((store) => {
    const record: BusRoute = {
      ...input,
      id: store.nextIds.route,
      createdAt: new Date().toISOString(),
    };

    store.routes.unshift(record);
    store.nextIds.route += 1;

    return record;
  });
}

export async function listDrivers() {
  const pool = getPool();

  if (pool) {
    await ensureSchema();
    const result = await pool.query("SELECT * FROM drivers ORDER BY name ASC");
    return result.rows.map((row) => mapDriverRow(row));
  }

  const store = await readFileStore();
  return [...store.drivers].sort((a, b) => a.name.localeCompare(b.name));
}

export async function createDriver(input: NewDriverInput) {
  const pool = getPool();

  if (pool) {
    await ensureSchema();
    const result = await pool.query(
      `
        INSERT INTO drivers (name, phone, license_number, status)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
      [input.name, input.phone, input.licenseNumber, input.status],
    );

    return mapDriverRow(result.rows[0]);
  }

  return mutateFileStore((store) => {
    const record: Driver = {
      ...input,
      id: store.nextIds.driver,
      createdAt: new Date().toISOString(),
    };

    store.drivers.push(record);
    store.nextIds.driver += 1;

    return record;
  });
}

export async function listSchedules() {
  const pool = getPool();

  if (pool) {
    await ensureSchema();
    const result = await pool.query(
      `
        SELECT
          s.*, r.name AS route_name, d.name AS driver_name
        FROM schedules s
        LEFT JOIN routes r ON r.id = s.route_id
        LEFT JOIN drivers d ON d.id = s.driver_id
        ORDER BY s.start_time ASC
      `,
    );

    return result.rows.map((row) => mapScheduleRow(row));
  }

  const store = await readFileStore();
  return [...store.schedules].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );
}

export async function createSchedule(input: NewScheduleInput) {
  const pool = getPool();

  if (pool) {
    await ensureSchema();
    const result = await pool.query(
      `
        WITH inserted AS (
          INSERT INTO schedules (
            route_id,
            driver_id,
            start_time,
            end_time,
            vehicle_code,
            status,
            notes
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        )
        SELECT
          inserted.*, r.name AS route_name, d.name AS driver_name
        FROM inserted
        LEFT JOIN routes r ON r.id = inserted.route_id
        LEFT JOIN drivers d ON d.id = inserted.driver_id
      `,
      [
        input.routeId,
        input.driverId,
        input.startTime,
        input.endTime,
        input.vehicleCode,
        input.status,
        input.notes,
      ],
    );

    return mapScheduleRow(result.rows[0]);
  }

  return mutateFileStore((store) => {
    const routeName =
      store.routes.find((route) => route.id === input.routeId)?.name ?? null;
    const driverName =
      store.drivers.find((driver) => driver.id === input.driverId)?.name ?? null;

    const record: ScheduleEntry = {
      ...input,
      routeName,
      driverName,
      id: store.nextIds.schedule,
      createdAt: new Date().toISOString(),
    };

    store.schedules.push(record);
    store.nextIds.schedule += 1;

    return record;
  });
}

export async function listNotifications() {
  const pool = getPool();

  if (pool) {
    await ensureSchema();
    const result = await pool.query(
      `
        SELECT
          n.*, r.name AS route_name
        FROM notifications n
        LEFT JOIN routes r ON r.id = n.route_id
        ORDER BY n.sent_at DESC
      `,
    );

    return result.rows.map((row) => mapNotificationRow(row));
  }

  const store = await readFileStore();
  return [...store.notifications].sort(
    (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
  );
}

export async function createNotification(input: NewNotificationInput) {
  const pool = getPool();

  if (pool) {
    await ensureSchema();
    const result = await pool.query(
      `
        WITH inserted AS (
          INSERT INTO notifications (route_id, channel, target_group, message, sent_at)
          VALUES ($1, $2, $3, $4, NOW())
          RETURNING *
        )
        SELECT
          inserted.*, r.name AS route_name
        FROM inserted
        LEFT JOIN routes r ON r.id = inserted.route_id
      `,
      [input.routeId, input.channel, input.targetGroup, input.message],
    );

    return mapNotificationRow(result.rows[0]);
  }

  return mutateFileStore((store) => {
    const routeName =
      input.routeId === null
        ? null
        : store.routes.find((route) => route.id === input.routeId)?.name ?? null;

    const now = new Date().toISOString();
    const record: NotificationEntry = {
      ...input,
      routeName,
      id: store.nextIds.notification,
      sentAt: now,
      createdAt: now,
    };

    store.notifications.unshift(record);
    store.nextIds.notification += 1;

    return record;
  });
}
