import { NextResponse } from "next/server";
import { z } from "zod";
import { emitRealtime } from "@/lib/realtime";

const publishSchema = z.object({
  type: z.string().min(3).max(80),
  payload: z.record(z.unknown()).default({})
});

export async function POST(request: Request) {
  try {
    const parsed = publishSchema.parse(await request.json());
    emitRealtime(parsed.type, parsed.payload);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid event payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
