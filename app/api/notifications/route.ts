import { NextResponse } from "next/server";
import { notificationInputSchema } from "@/lib/db/schema";
import { createNotification, listNotifications } from "@/lib/db/store";

export async function GET(): Promise<NextResponse> {
  const notifications = await listNotifications();
  return NextResponse.json({ data: notifications });
}

export async function POST(request: Request): Promise<NextResponse> {
  const payload = await request.json().catch(() => null);
  const parsed = notificationInputSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const notification = await createNotification(parsed.data);
  return NextResponse.json({ data: notification }, { status: 201 });
}
