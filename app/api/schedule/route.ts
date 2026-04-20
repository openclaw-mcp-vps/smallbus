import { NextResponse } from "next/server";
import { scheduleInputSchema } from "@/lib/db/schema";
import { createSchedule, listSchedules } from "@/lib/db/store";

export async function GET(): Promise<NextResponse> {
  const schedules = await listSchedules();
  return NextResponse.json({ data: schedules });
}

export async function POST(request: Request): Promise<NextResponse> {
  const payload = await request.json().catch(() => null);
  const parsed = scheduleInputSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const schedule = await createSchedule(parsed.data);
    return NextResponse.json({ data: schedule }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create schedule"
      },
      { status: 400 }
    );
  }
}
