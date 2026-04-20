import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionContext, isRoleAtLeast } from "@/lib/auth";
import { createNotification, listNotifications } from "@/lib/database";

const createNotificationSchema = z.object({
  routeId: z.number().int().positive().nullable(),
  channel: z.enum(["sms", "email", "in-app"]),
  targetGroup: z.string().min(3),
  message: z.string().min(12).max(280),
});

export async function GET() {
  const session = await getSessionContext();

  if (!session.paid) {
    return NextResponse.json(
      { error: "Payment required to access notifications." },
      { status: 402 },
    );
  }

  const notifications = await listNotifications();
  return NextResponse.json({ notifications });
}

export async function POST(request: Request) {
  const session = await getSessionContext();

  if (!session.paid) {
    return NextResponse.json(
      { error: "Payment required to send notifications." },
      { status: 402 },
    );
  }

  if (!isRoleAtLeast(session.role, "manager")) {
    return NextResponse.json(
      { error: "Manager role required to send notifications." },
      { status: 403 },
    );
  }

  try {
    const payload = createNotificationSchema.parse(await request.json());
    const notification = await createNotification(payload);

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid notification payload.",
          details: error.flatten(),
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Unable to send notification." },
      { status: 500 },
    );
  }
}
