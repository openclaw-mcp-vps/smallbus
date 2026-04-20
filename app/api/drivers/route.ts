import { NextResponse } from "next/server";
import { driverInputSchema } from "@/lib/db/schema";
import { createDriver, listDrivers } from "@/lib/db/store";

export async function GET(): Promise<NextResponse> {
  const drivers = await listDrivers();
  return NextResponse.json({ data: drivers });
}

export async function POST(request: Request): Promise<NextResponse> {
  const payload = await request.json().catch(() => null);
  const parsed = driverInputSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const driver = await createDriver(parsed.data);
  return NextResponse.json({ data: driver }, { status: 201 });
}
