"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { io, type Socket } from "socket.io-client";
import type { NotificationRecord, ScheduleRecord } from "@/lib/db/schema";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type NotificationFormInput = {
  scheduleId: string;
  channel: "sms" | "email" | "push";
  recipient: string;
  message: string;
};

function statusVariant(status: NotificationRecord["status"]) {
  if (status === "sent") {
    return "success" as const;
  }

  if (status === "failed") {
    return "danger" as const;
  }

  return "warning" as const;
}

export function NotificationPanel({ schedules }: { schedules: ScheduleRecord[] }) {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { register, reset, handleSubmit } = useForm<NotificationFormInput>({
    defaultValues: {
      scheduleId: "",
      channel: "sms",
      recipient: "",
      message: ""
    }
  });

  const scheduleOptions = useMemo(
    () => schedules.map((schedule) => ({ label: `Run #${schedule.id} (${schedule.serviceDate})`, value: schedule.id })),
    [schedules]
  );

  async function refreshNotifications() {
    const response = await fetch("/api/notifications", { cache: "no-store" });
    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { notifications: NotificationRecord[] };
    setNotifications(payload.notifications);
  }

  useEffect(() => {
    refreshNotifications();

    let socket: Socket | undefined;

    const connectSocket = async () => {
      await fetch("/api/socket");
      socket = io({ path: "/api/socket_io" });

      socket.on("smallbus:event", (event: { type: string }) => {
        if (event.type === "notifications.updated") {
          refreshNotifications();
        }
      });
    };

    connectSocket();

    return () => {
      socket?.disconnect();
    };
  }, []);

  const onSubmit = handleSubmit(async (data) => {
    setLoading(true);
    setErrorMessage("");

    const payload = {
      scheduleId: data.scheduleId ? Number.parseInt(data.scheduleId, 10) : null,
      channel: data.channel,
      recipient: data.recipient,
      message: data.message
    };

    const response = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = (await response.json()) as { error?: string };
      setErrorMessage(err.error ?? "Unable to send notification");
      setLoading(false);
      return;
    }

    reset();
    await refreshNotifications();
    setLoading(false);
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Send Passenger Update</CardTitle>
          <CardDescription>
            Trigger immediate delay, gate change, or disruption notices across SMS, email, or app push.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="scheduleId">Related schedule</Label>
              <select
                id="scheduleId"
                className="h-10 w-full rounded-md border border-[#30363d] bg-[#0d1117] px-3 text-sm text-[#c9d1d9] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                {...register("scheduleId")}
              >
                <option value="">General service update</option>
                {scheduleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="channel">Channel</Label>
              <select
                id="channel"
                className="h-10 w-full rounded-md border border-[#30363d] bg-[#0d1117] px-3 text-sm text-[#c9d1d9] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                {...register("channel")}
              >
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="push">Push Notification</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient</Label>
              <Input id="recipient" placeholder="+15125550111 or rider@domain.com" {...register("recipient", { required: true })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="North Loop will depart 12 minutes late due to highway congestion near Oak Ridge stop."
                {...register("message", { required: true })}
              />
            </div>

            {errorMessage ? <p className="text-sm text-[#f85149]">{errorMessage}</p> : null}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Sending..." : "Send update"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Timeline</CardTitle>
          <CardDescription>Most recent notifications and delivery status across channels.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications.length === 0 ? (
            <p className="text-sm text-[#8b949e]">No notifications sent yet.</p>
          ) : null}

          {notifications.map((notification) => (
            <div key={notification.id} className="rounded-lg border border-[#30363d] bg-[#0d1117] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[#f0f6fc]">{notification.recipient}</p>
                <Badge variant={statusVariant(notification.status)}>{notification.status}</Badge>
              </div>
              <p className="mt-2 text-sm text-[#8b949e]">{notification.message}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#6e7681]">
                <span>Channel: {notification.channel.toUpperCase()}</span>
                <span>{formatDateTime(notification.createdAt)}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
