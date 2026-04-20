import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { recordBillingEvent } from "@/lib/db/store";

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const normalizedSignature = signature.replace(/^sha256=/u, "").trim();

  if (normalizedSignature.length !== digest.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(normalizedSignature));
}

export async function POST(request: Request): Promise<NextResponse> {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json({ error: "Webhook secret is not configured" }, { status: 500 });
  }

  const signature = request.headers.get("x-signature") ?? "";
  const rawBody = await request.text();

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  try {
    if (!verifySignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid signature format" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as {
    meta?: { event_name?: string };
    data?: {
      id?: string;
      attributes?: {
        user_email?: string;
        customer_email?: string;
        status?: string;
      };
    };
  };

  const eventName = payload.meta?.event_name ?? "unknown";
  const attributes = payload.data?.attributes ?? {};
  const customerEmail = attributes.user_email ?? attributes.customer_email ?? "unknown@unknown";
  const orderId = payload.data?.id ?? "unknown-order";

  await recordBillingEvent({
    event_name: eventName,
    customer_email: customerEmail,
    order_id: orderId,
    payload: JSON.stringify(payload)
  });

  return NextResponse.json({ received: true });
}
