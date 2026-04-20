import { NextResponse } from "next/server";
import { routeInputSchema } from "@/lib/db/schema";
import { createRoute, listRoutes } from "@/lib/db/store";

export async function GET(): Promise<NextResponse> {
  const routes = await listRoutes();
  return NextResponse.json({ data: routes });
}

export async function POST(request: Request): Promise<NextResponse> {
  const payload = await request.json().catch(() => null);
  const parsed = routeInputSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const route = await createRoute(parsed.data);
  return NextResponse.json({ data: route }, { status: 201 });
}
