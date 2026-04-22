import { NextResponse } from "next/server";
import { createDriver, getDrivers } from "@/lib/db";
import { emitRealtime } from "@/lib/realtime";

export async function GET() {
  try {
    const drivers = await getDrivers();
    return NextResponse.json({ drivers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch drivers";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const driver = await createDriver(payload);

    emitRealtime("drivers.updated", {
      driverId: driver.id,
      status: driver.status
    });

    return NextResponse.json({ driver }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create driver";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
