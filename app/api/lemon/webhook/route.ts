import { NextResponse } from "next/server";

import { verifyLemonWebhookSignature } from "@/lib/lemon-squeezy";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature =
    request.headers.get("x-signature") ||
    request.headers.get("x-lemonsqueezy-signature");

  const isValid = verifyLemonWebhookSignature(rawBody, signature);

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as {
    meta?: { event_name?: string };
  };

  return NextResponse.json(
    {
      received: true,
      event: payload.meta?.event_name ?? "unknown",
    },
    { status: 200 },
  );
}
