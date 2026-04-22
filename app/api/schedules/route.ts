import { NextResponse } from "next/server";
import { createSchedule, getSchedules } from "@/lib/db";
import { emitRealtime } from "@/lib/realtime";

export async function GET() {
  try {
    const schedules = await getSchedules();
    return NextResponse.json({ schedules });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch schedules";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const schedule = await createSchedule(payload);

    emitRealtime("schedules.updated", {
      scheduleId: schedule.id,
      routeId: schedule.routeId,
      driverId: schedule.driverId
    });

    return NextResponse.json({ schedule }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create schedule";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
