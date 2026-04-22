import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { addPaidCustomer } from "@/lib/db";

function verifyStripeSignature(payload: string, signatureHeader: string, secret: string) {
  const parts = signatureHeader.split(",").reduce<Record<string, string[]>>((acc, part) => {
    const [key, value] = part.split("=");
    if (!acc[key]) {
      acc[key] = [];
    }

    if (value) {
      acc[key].push(value);
    }

    return acc;
  }, {});

  const timestamp = parts.t?.[0];
  const signatures = parts.v1 ?? [];

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const signedPayload = `${timestamp}.${payload}`;
  const expected = createHmac("sha256", secret).update(signedPayload).digest("hex");

  return signatures.some((signature) => {
    try {
      return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  });
}

export async function POST(request: Request) {
  const stripeSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET is not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  if (!verifyStripeSignature(rawBody, signature, stripeSecret)) {
    return NextResponse.json({ error: "Invalid Stripe signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody) as {
    type: string;
    data?: {
      object?: {
        customer_details?: { email?: string | null };
      };
    };
  };

  if (event.type === "checkout.session.completed") {
    const email = event.data?.object?.customer_details?.email;
    if (email) {
      await addPaidCustomer(email, "stripe-payment-link");
    }
  }

  return NextResponse.json({ received: true });
}
