import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { addPaidCustomer } from "@/lib/db";

export async function POST(request: Request) {
  const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  const signature = request.headers.get("x-signature");
  const rawBody = await request.text();

  if (webhookSecret && signature) {
    const expected = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
    try {
      if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
        return NextResponse.json({ error: "Invalid Lemon Squeezy signature" }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid Lemon Squeezy signature" }, { status: 400 });
    }
  }

  const payload = JSON.parse(rawBody) as {
    meta?: {
      event_name?: string;
      custom_data?: {
        email?: string;
      };
    };
    data?: {
      attributes?: {
        user_email?: string;
      };
    };
  };

  const eventName = payload.meta?.event_name;
  const email = payload.data?.attributes?.user_email ?? payload.meta?.custom_data?.email;

  if (eventName && eventName.includes("order") && email) {
    await addPaidCustomer(email, "lemonsqueezy");
  }

  return NextResponse.json({ received: true });
}
