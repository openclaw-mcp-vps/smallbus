export type UserRole = "manager" | "dispatcher" | "viewer";

export type RouteItem = {
  id: number;
  name: string;
  origin: string;
  destination: string;
  stops: string[];
  default_start_time: string;
  estimated_minutes: number;
  active: boolean;
  created_at: string;
};

export type DriverItem = {
  id: number;
  name: string;
  phone: string;
  license_number: string;
  availability: string[];
  active: boolean;
  created_at: string;
};

export type ScheduleItem = {
  id: number;
  route_id: number;
  driver_id: number;
  service_date: string;
  departure_time: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  notes: string;
  created_at: string;
};

export type ScheduleView = ScheduleItem & {
  route_name: string;
  driver_name: string;
};

export type NotificationItem = {
  id: number;
  schedule_id: number | null;
  channel: "sms" | "email" | "push";
  recipient: string;
  message: string;
  scheduled_for: string;
  status: "queued" | "sent" | "failed";
  created_at: string;
};

export type BillingEvent = {
  id: number;
  event_name: string;
  customer_email: string;
  order_id: string;
  payload: string;
  created_at: string;
};

export type DashboardStats = {
  activeRoutes: number;
  activeDrivers: number;
  todaysTrips: number;
  queuedNotifications: number;
  avgRouteMinutes: number;
};
