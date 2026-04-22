import { NextResponse } from "next/server";
import { createNotification, getNotifications } from "@/lib/db";
import { emitRealtime } from "@/lib/realtime";

export async function GET() {
  try {
    const notifications = await getNotifications();
    return NextResponse.json({ notifications });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch notifications";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const notification = await createNotification(payload);

    emitRealtime("notifications.updated", {
      notificationId: notification.id,
      status: notification.status,
      channel: notification.channel
    });

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send notification";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
