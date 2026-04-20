"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatDistanceToNow } from "date-fns";
import { Send } from "lucide-react";
import type { NotificationItem, ScheduleView } from "@/lib/types";

const notificationSchema = z.object({
  schedule_id: z.coerce.number().int().positive().nullable(),
  channel: z.enum(["sms", "email", "push"]),
  recipient: z.string().min(3).max(160),
  message: z.string().min(8).max(320),
  scheduled_for: z.string().datetime()
});

type NotificationFormInput = z.input<typeof notificationSchema>;
type NotificationFormOutput = z.output<typeof notificationSchema>;

function statusPill(status: NotificationItem["status"]): string {
  if (status === "sent") {
    return "bg-emerald-500/20 text-emerald-200 border-emerald-500/40";
  }

  if (status === "failed") {
    return "bg-rose-500/20 text-rose-200 border-rose-500/40";
  }

  return "bg-amber-500/20 text-amber-200 border-amber-500/40";
}

export function NotificationCenter({
  notifications: initialNotifications,
  schedules
}: {
  notifications: NotificationItem[];
  schedules: ScheduleView[];
}) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const nowPlus15Minutes = useMemo(() => new Date(Date.now() + 15 * 60 * 1000).toISOString(), []);

  const form = useForm<NotificationFormInput, unknown, NotificationFormOutput>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      schedule_id: schedules[0]?.id ?? null,
      channel: "sms",
      recipient: "",
      message: "",
      scheduled_for: nowPlus15Minutes
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      setSubmitError(null);

      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...values,
          status: "queued"
        })
      });

      const payload = (await response.json()) as {
        data?: NotificationItem;
        error?: string;
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? "Could not queue notification");
      }

      setNotifications((current) => [payload.data as NotificationItem, ...current]);
      form.reset({
        ...values,
        message: ""
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Could not queue notification");
    }
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="card p-5">
        <h3 className="text-lg font-semibold text-slate-100">Queue Passenger Notification</h3>
        <p className="mt-1 text-sm text-slate-400">Target a trip, choose channel, and schedule outbound rider communication.</p>

        <form onSubmit={onSubmit} className="mt-4 grid gap-4">
          <label className="grid gap-1 text-sm text-slate-300">
            Linked Trip
            <select
              {...form.register("schedule_id")}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            >
              <option value="">Unlinked Service Alert</option>
              {schedules.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.service_date} {item.departure_time} - {item.route_name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm text-slate-300">
              Channel
              <select
                {...form.register("channel")}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              >
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="push">Push</option>
              </select>
            </label>

            <label className="grid gap-1 text-sm text-slate-300">
              Recipient
              <input
                type="text"
                {...form.register("recipient")}
                placeholder="+1-555-0100 or rider@example.com"
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500"
              />
            </label>
          </div>

          <label className="grid gap-1 text-sm text-slate-300">
            Message
            <textarea
              {...form.register("message")}
              rows={4}
              placeholder="Route 2 departs 10 minutes late due to roadworks near Maple Ave."
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500"
            />
          </label>

          <label className="grid gap-1 text-sm text-slate-300">
            Send At
            <input
              type="datetime-local"
              value={form.watch("scheduled_for").slice(0, 16)}
              onChange={(event) => form.setValue("scheduled_for", `${event.target.value}:00.000Z`)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            />
          </label>

          {Object.keys(form.formState.errors).length > 0 ? (
            <p className="text-sm text-rose-300">Please complete all required fields with valid values.</p>
          ) : null}
          {submitError ? <p className="text-sm text-rose-300">{submitError}</p> : null}

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            <Send className="h-4 w-4" />
            Queue Notification
          </button>
        </form>
      </div>

      <div className="card p-5">
        <h3 className="text-lg font-semibold text-slate-100">Notification Queue</h3>
        <p className="mt-1 text-sm text-slate-400">Track outbound rider communication by status.</p>

        <div className="mt-4 grid max-h-[520px] gap-3 overflow-y-auto pr-1">
          {notifications.map((notification) => (
            <article key={notification.id} className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-200">{notification.channel}</p>
                <span className={`rounded-full border px-2 py-0.5 text-xs ${statusPill(notification.status)}`}>
                  {notification.status}
                </span>
              </div>
              <p className="text-sm text-slate-200">{notification.recipient}</p>
              <p className="mt-2 text-sm text-slate-300">{notification.message}</p>
              <p className="mt-2 text-xs text-slate-500">
                Scheduled {formatDistanceToNow(new Date(notification.scheduled_for), { addSuffix: true })}
              </p>
            </article>
          ))}

          {notifications.length === 0 ? (
            <p className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
              No queued notifications yet.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
