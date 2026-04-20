"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatDistanceToNow } from "date-fns";
import { BellRing, Loader2, MessageSquareShare, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import type {
  BusRoute,
  NotificationChannel,
  NotificationEntry,
} from "@/lib/database";

const notificationSchema = z.object({
  routeId: z.number().int().nonnegative(),
  channel: z.enum(["sms", "email", "in-app"]),
  targetGroup: z.string().min(3, "Target group is required."),
  message: z
    .string()
    .min(12, "Message should be at least 12 characters.")
    .max(280, "Message should stay under 280 characters."),
});

type NotificationForm = z.infer<typeof notificationSchema>;

type NotificationsApiPayload = {
  notifications: NotificationEntry[];
};

type RoutesApiPayload = {
  routes: BusRoute[];
};

const channelOptions: NotificationChannel[] = ["sms", "email", "in-app"];

export default function NotificationsPage() {
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<NotificationForm>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      routeId: 0,
      channel: "sms",
      targetGroup: "route-passengers",
      message:
        "Heads up: Route update posted. Check your departure window before arriving at the stop.",
    },
  });

  const message = watch("message");

  const recentVolume = useMemo(() => {
    const inLast24Hours = notifications.filter((notification) => {
      return Date.now() - new Date(notification.sentAt).getTime() <= 24 * 60 * 60 * 1000;
    }).length;

    return inLast24Hours;
  }, [notifications]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);

    try {
      const [routesRes, notificationsRes] = await Promise.all([
        fetch("/api/routes", { cache: "no-store" }),
        fetch("/api/notifications", { cache: "no-store" }),
      ]);

      if (!routesRes.ok || !notificationsRes.ok) {
        throw new Error("Could not load notifications data.");
      }

      const routesPayload = (await routesRes.json()) as RoutesApiPayload;
      const notificationsPayload =
        (await notificationsRes.json()) as NotificationsApiPayload;

      setRoutes(routesPayload.routes);
      setNotifications(notificationsPayload.notifications);
      reset((current) => ({
        ...current,
        routeId: routesPayload.routes[0]?.id ?? 0,
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not load notifications data.";
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  async function onSubmit(values: NotificationForm) {
    setApiError(null);

    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          routeId: values.routeId === 0 ? null : values.routeId,
          channel: values.channel,
          targetGroup: values.targetGroup,
          message: values.message,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Failed to send notification.");
      }

      const payload = (await response.json()) as { notification: NotificationEntry };
      setNotifications((prev) => [payload.notification, ...prev]);
      reset((current) => ({
        ...current,
        message:
          "Service advisory: Expect moderate traffic near Main Street. Boarding remains on schedule.",
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to send notification.";
      setApiError(message);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
      <section className="space-y-4 rounded-2xl border border-border bg-card/80 p-4">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-[0.12em] text-blue-200">
            Passenger comms
          </p>
          <h2 className="font-heading text-xl font-semibold text-white">
            Publish rider updates in one queue
          </h2>
        </header>

        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-200">Route</span>
            <select
              className="w-full rounded-lg border border-border bg-[#111a2a] px-3 py-2"
              {...register("routeId", { valueAsNumber: true })}
            >
              <option value={0}>All routes</option>
              {routes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-slate-200">Channel</span>
            <select
              className="w-full rounded-lg border border-border bg-[#111a2a] px-3 py-2"
              {...register("channel")}
            >
              {channelOptions.map((channel) => (
                <option key={channel} value={channel}>
                  {channel}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-slate-200">Target Group</span>
            <input
              className="w-full rounded-lg border border-border bg-[#111a2a] px-3 py-2"
              placeholder="weekday-riders"
              {...register("targetGroup")}
            />
            {errors.targetGroup ? (
              <span className="mt-1 block text-xs text-red-300">
                {errors.targetGroup.message}
              </span>
            ) : null}
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-slate-200">Message</span>
            <textarea
              rows={4}
              className="w-full rounded-lg border border-border bg-[#111a2a] px-3 py-2"
              {...register("message")}
            />
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>{message.length}/280 characters</span>
              {errors.message ? (
                <span className="text-red-300">{errors.message.message}</span>
              ) : null}
            </div>
          </label>

          <Button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-400"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Send notification
          </Button>
        </form>

        {apiError ? (
          <p className="rounded-lg border border-red-300/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {apiError}
          </p>
        ) : null}
      </section>

      <section className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <article className="rounded-xl border border-border bg-[#111a2a] p-3">
            <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
              Last 24 hours
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">{recentVolume}</p>
          </article>
          <article className="rounded-xl border border-border bg-[#111a2a] p-3">
            <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
              Queue size
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">{notifications.length}</p>
          </article>
          <article className="rounded-xl border border-border bg-[#111a2a] p-3">
            <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
              Channel health
            </p>
            <p className="mt-2 text-lg font-semibold text-emerald-300">Stable</p>
          </article>
        </div>

        <div className="rounded-2xl border border-border bg-card/80 p-4">
          <h2 className="mb-4 flex items-center gap-2 font-heading text-xl font-semibold text-white">
            <BellRing className="size-5 text-blue-300" />
            Notification history
          </h2>

          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading notifications...
            </div>
          ) : notifications.length ? (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <article
                  key={notification.id}
                  className="rounded-xl border border-border bg-[#111a2a] p-3"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-[#1f3354] px-2 py-1 text-blue-100">
                      {notification.channel}
                    </span>
                    <span className="rounded-full bg-[#183533] px-2 py-1 text-emerald-100">
                      {notification.targetGroup}
                    </span>
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.sentAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-100">{notification.message}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Route: {notification.routeName ?? "All routes"}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              <MessageSquareShare className="size-4" />
              No notifications sent yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
