import { NextResponse } from "next/server";
import { createRoute, getRoutes } from "@/lib/db";
import { emitRealtime } from "@/lib/realtime";

export async function GET() {
  try {
    const routes = await getRoutes();
    return NextResponse.json({ routes });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch routes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const route = await createRoute(payload);

    emitRealtime("routes.updated", {
      routeId: route.id,
      name: route.name
    });

    return NextResponse.json({ route }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create route";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
