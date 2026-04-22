import { NextResponse } from "next/server";
import { deleteRoute } from "@/lib/db";
import { emitRealtime } from "@/lib/realtime";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const routeId = Number.parseInt(id, 10);

    if (Number.isNaN(routeId)) {
      return NextResponse.json({ error: "Invalid route id" }, { status: 400 });
    }

    const deleted = await deleteRoute(routeId);

    if (!deleted) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    emitRealtime("routes.updated", {
      routeId,
      deleted: true
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete route";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
