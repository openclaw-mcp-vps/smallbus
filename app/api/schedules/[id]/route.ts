import { NextResponse } from "next/server";
import { deleteSchedule } from "@/lib/db";
import { emitRealtime } from "@/lib/realtime";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const scheduleId = Number.parseInt(id, 10);

    if (Number.isNaN(scheduleId)) {
      return NextResponse.json({ error: "Invalid schedule id" }, { status: 400 });
    }

    const deleted = await deleteSchedule(scheduleId);

    if (!deleted) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    emitRealtime("schedules.updated", {
      scheduleId,
      deleted: true
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete schedule";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
