import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionContext, isRoleAtLeast } from "@/lib/auth";
import { createDriver, listDrivers } from "@/lib/database";

const createDriverSchema = z.object({
  name: z.string().min(3),
  phone: z.string().min(7),
  licenseNumber: z.string().min(5),
  status: z.enum(["available", "on-route", "off-duty", "leave"]),
});

export async function GET() {
  const session = await getSessionContext();

  if (!session.paid) {
    return NextResponse.json(
      { error: "Payment required to access driver data." },
      { status: 402 },
    );
  }

  const drivers = await listDrivers();
  return NextResponse.json({ drivers });
}

export async function POST(request: Request) {
  const session = await getSessionContext();

  if (!session.paid) {
    return NextResponse.json(
      { error: "Payment required to add drivers." },
      { status: 402 },
    );
  }

  if (!isRoleAtLeast(session.role, "manager")) {
    return NextResponse.json(
      { error: "Manager role required to add drivers." },
      { status: 403 },
    );
  }

  try {
    const payload = createDriverSchema.parse(await request.json());
    const driver = await createDriver(payload);

    return NextResponse.json({ driver }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid driver payload.",
          details: error.flatten(),
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Unable to add driver." },
      { status: 500 },
    );
  }
}
