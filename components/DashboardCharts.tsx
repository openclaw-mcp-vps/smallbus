"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import type { RouteItem, ScheduleView } from "@/lib/types";

const pieColors = ["#26d0ce", "#1f9d8f", "#f59e0b", "#ef4444", "#38bdf8"];

function buildRouteDurationData(routes: RouteItem[]): { name: string; minutes: number }[] {
  return routes.slice(0, 8).map((route) => ({
    name: route.name,
    minutes: route.estimated_minutes
  }));
}

function buildScheduleStatusData(schedules: ScheduleView[]): { name: string; value: number }[] {
  const counters = new Map<string, number>();

  for (const schedule of schedules) {
    counters.set(schedule.status, (counters.get(schedule.status) ?? 0) + 1);
  }

  return Array.from(counters.entries()).map(([name, value]) => ({ name, value }));
}

export function DashboardCharts({ routes, schedules }: { routes: RouteItem[]; schedules: ScheduleView[] }) {
  const routeDurationData = buildRouteDurationData(routes);
  const scheduleStatusData = buildScheduleStatusData(schedules);

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="card p-5">
        <h3 className="text-lg font-semibold text-slate-100">Route Duration Profile</h3>
        <p className="mt-1 text-sm text-slate-400">Compare planned route time to identify overlong runs.</p>

        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={routeDurationData}>
              <CartesianGrid stroke="#2a3a50" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: "#9fb0c4", fontSize: 12 }} axisLine={{ stroke: "#2a3a50" }} />
              <YAxis tick={{ fill: "#9fb0c4", fontSize: 12 }} axisLine={{ stroke: "#2a3a50" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#121a24",
                  border: "1px solid #2a3a50",
                  borderRadius: "8px"
                }}
              />
              <Bar dataKey="minutes" fill="#26d0ce" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-lg font-semibold text-slate-100">Trip Status Mix</h3>
        <p className="mt-1 text-sm text-slate-400">Quick read on active, completed, and cancelled runs.</p>

        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={scheduleStatusData}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={3}
              >
                {scheduleStatusData.map((entry, index) => (
                  <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#121a24",
                  border: "1px solid #2a3a50",
                  borderRadius: "8px"
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
