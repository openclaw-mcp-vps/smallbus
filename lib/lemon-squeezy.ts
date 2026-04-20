import crypto from "node:crypto";

import { createCheckout, lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

import type { UserRole } from "@/lib/auth";

type CheckoutAccessToken = {
  role: UserRole;
  issuedAt: number;
  expiresAt: number;
  source: "smallbus-checkout";
};

function getSigningSecret() {
  return process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || "local-smallbus-secret";
}

function timingSafeEqualString(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function encodePayload(payload: CheckoutAccessToken) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(payload: string) {
  try {
    return JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as CheckoutAccessToken;
  } catch {
    return null;
  }
}

export function createCheckoutAccessToken(role: UserRole = "manager") {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + 1000 * 60 * 20;

  const payload: CheckoutAccessToken = {
    role,
    issuedAt,
    expiresAt,
    source: "smallbus-checkout",
  };

  const encoded = encodePayload(payload);
  const signature = crypto
    .createHmac("sha256", getSigningSecret())
    .update(encoded)
    .digest("hex");

  return `${encoded}.${signature}`;
}

export function verifyCheckoutAccessToken(token: string | null) {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac("sha256", getSigningSecret())
    .update(encodedPayload)
    .digest("hex");

  if (!timingSafeEqualString(signature, expectedSignature)) {
    return null;
  }

  const payload = decodePayload(encodedPayload);

  if (!payload || payload.source !== "smallbus-checkout") {
    return null;
  }

  if (Date.now() > payload.expiresAt) {
    return null;
  }

  return payload;
}

export function verifyLemonWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
) {
  if (!signatureHeader) {
    return false;
  }

  const cleanedSignature = signatureHeader.replace(/^sha256=/, "").trim();
  const digest = crypto
    .createHmac("sha256", getSigningSecret())
    .update(rawBody)
    .digest("hex");

  return timingSafeEqualString(cleanedSignature, digest);
}

function buildDirectCheckoutUrl(
  productId: string,
  successUrl: string,
  role: UserRole,
) {
  const fallbackUrl = new URL(`https://checkout.lemonsqueezy.com/buy/${productId}`);

  fallbackUrl.searchParams.set("checkout[embed]", "1");
  fallbackUrl.searchParams.set("checkout[media]", "0");
  fallbackUrl.searchParams.set("checkout[logo]", "0");
  fallbackUrl.searchParams.set("checkout[desc]", "1");
  fallbackUrl.searchParams.set("checkout[dark]", "1");
  fallbackUrl.searchParams.set("checkout[success_url]", successUrl);
  fallbackUrl.searchParams.set("checkout[custom][role]", role);

  return fallbackUrl.toString();
}

export async function createCheckoutOverlayUrl(
  origin: string,
  role: UserRole = "manager",
) {
  const storeId = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID;
  const productId = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID;

  if (!productId) {
    throw new Error("NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID is not configured.");
  }

  const token = createCheckoutAccessToken(role);
  const successUrl = `${origin}/api/billing/success?token=${encodeURIComponent(token)}`;

  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;

  if (apiKey && storeId) {
    lemonSqueezySetup({ apiKey });

    const checkout = await createCheckout(storeId, productId, {
      productOptions: {
        redirectUrl: successUrl,
        confirmationTitle: "Your small_bus workspace is live",
        confirmationMessage:
          "Continue to your operations dashboard to publish routes and assign drivers.",
      },
      checkoutOptions: {
        embed: true,
        media: false,
        logo: false,
        desc: true,
        discount: true,
        backgroundColor: "#0d1117",
        headingsColor: "#f2f7ff",
        primaryTextColor: "#d6e7ff",
        secondaryTextColor: "#96a8c9",
        linksColor: "#73b3ff",
        bordersColor: "#2a3a57",
        checkboxColor: "#2f81f7",
        activeStateColor: "#2f81f7",
        buttonColor: "#2f81f7",
        buttonTextColor: "#f8fbff",
      },
      checkoutData: {
        custom: {
          app: "smallbus",
          role,
        },
      },
    });

    if (!checkout.error && checkout.data?.data?.attributes.url) {
      return checkout.data.data.attributes.url;
    }
  }

  return buildDirectCheckoutUrl(productId, successUrl, role);
}
