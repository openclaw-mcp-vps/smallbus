import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionContext, isRoleAtLeast } from "@/lib/auth";
import { createSchedule, listSchedules } from "@/lib/database";

const createScheduleSchema = z
  .object({
    routeId: z.number().int().positive(),
    driverId: z.number().int().positive(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    vehicleCode: z.string().min(2),
    status: z.enum(["planned", "active", "completed", "delayed"]),
    notes: z.string().max(200).default(""),
  })
  .refine((value) => new Date(value.endTime) > new Date(value.startTime), {
    message: "End time must be after start time.",
    path: ["endTime"],
  });

export async function GET() {
  const session = await getSessionContext();

  if (!session.paid) {
    return NextResponse.json(
      { error: "Payment required to access schedule data." },
      { status: 402 },
    );
  }

  const schedules = await listSchedules();
  return NextResponse.json({ schedules });
}

export async function POST(request: Request) {
  const session = await getSessionContext();

  if (!session.paid) {
    return NextResponse.json(
      { error: "Payment required to create schedule entries." },
      { status: 402 },
    );
  }

  if (!isRoleAtLeast(session.role, "manager")) {
    return NextResponse.json(
      { error: "Manager role required to publish schedules." },
      { status: 403 },
    );
  }

  try {
    const payload = createScheduleSchema.parse(await request.json());
    const schedule = await createSchedule(payload);

    return NextResponse.json({ schedule }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid schedule payload.",
          details: error.flatten(),
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Unable to create schedule entry." },
      { status: 500 },
    );
  }
}
