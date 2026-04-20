import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionContext, isRoleAtLeast } from "@/lib/auth";
import { createRoute, listRoutes } from "@/lib/database";

const routeStopSchema = z.object({
  name: z.string().min(2),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const createRouteSchema = z.object({
  name: z.string().min(3),
  startStop: z.string().min(2),
  endStop: z.string().min(2),
  distanceKm: z.number().positive(),
  active: z.boolean(),
  stops: z.array(routeStopSchema).min(2),
});

export async function GET() {
  const session = await getSessionContext();

  if (!session.paid) {
    return NextResponse.json(
      { error: "Payment required to access route data." },
      { status: 402 },
    );
  }

  const routes = await listRoutes();
  return NextResponse.json({ routes });
}

export async function POST(request: Request) {
  const session = await getSessionContext();

  if (!session.paid) {
    return NextResponse.json(
      { error: "Payment required to create routes." },
      { status: 402 },
    );
  }

  if (!isRoleAtLeast(session.role, "manager")) {
    return NextResponse.json(
      { error: "Manager role required to create routes." },
      { status: 403 },
    );
  }

  try {
    const payload = createRouteSchema.parse(await request.json());
    const route = await createRoute(payload);

    return NextResponse.json({ route }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid route payload.",
          details: error.flatten(),
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Unable to save route." },
      { status: 500 },
    );
  }
}
