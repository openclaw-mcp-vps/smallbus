import { NextResponse } from "next/server";

import { createCheckoutOverlayUrl } from "@/lib/lemon-squeezy";

export async function POST(request: Request) {
  try {
    const origin = new URL(request.url).origin;
    const checkoutUrl = await createCheckoutOverlayUrl(origin, "manager");

    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to initialize checkout session.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
