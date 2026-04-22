import { NextResponse } from "next/server";
import { deleteDriver, updateDriverStatus } from "@/lib/db";
import { emitRealtime } from "@/lib/realtime";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum(["available", "on_route", "offline"])
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const driverId = Number.parseInt(id, 10);

    if (Number.isNaN(driverId)) {
      return NextResponse.json({ error: "Invalid driver id" }, { status: 400 });
    }

    const payload = statusSchema.parse(await request.json());
    const driver = await updateDriverStatus(driverId, payload.status);

    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    emitRealtime("drivers.updated", {
      driverId: driver.id,
      status: driver.status
    });

    return NextResponse.json({ driver });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update driver";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const driverId = Number.parseInt(id, 10);

    if (Number.isNaN(driverId)) {
      return NextResponse.json({ error: "Invalid driver id" }, { status: 400 });
    }

    const deleted = await deleteDriver(driverId);

    if (!deleted) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    emitRealtime("drivers.updated", {
      driverId,
      deleted: true
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete driver";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
