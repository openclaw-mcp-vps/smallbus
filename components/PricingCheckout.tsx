"use client";

import Script from "next/script";
import { useMemo, useState } from "react";
import { CheckCircle2, CreditCard, ShieldCheck } from "lucide-react";
import type { UserRole } from "@/lib/types";

const roleChoices: { label: string; value: UserRole; helper: string }[] = [
  {
    label: "Operations Manager",
    value: "manager",
    helper: "Full planning access, staffing control, and KPI visibility."
  },
  {
    label: "Dispatcher",
    value: "dispatcher",
    helper: "Route and schedule control without driver account administration."
  },
  {
    label: "Viewer",
    value: "viewer",
    helper: "Read-only operational visibility for owners and coordinators."
  }
];

function normalizeCheckoutUrl(productValue: string): string {
  if (productValue.startsWith("http://") || productValue.startsWith("https://")) {
    return productValue;
  }

  return `https://checkout.lemonsqueezy.com/buy/${productValue}`;
}

export function PricingCheckout() {
  const [role, setRole] = useState<UserRole>("manager");
  const [activating, setActivating] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);

  const checkoutUrl = useMemo(() => {
    const productValue = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID ?? "";

    if (!productValue) {
      return "";
    }

    return normalizeCheckoutUrl(productValue);
  }, []);

  const hasCheckoutConfig = checkoutUrl.length > 0;

  const activateAccess = async (): Promise<void> => {
    try {
      setActivating(true);
      setActivationError(null);

      const response = await fetch("/api/access/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ role })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Failed to activate your access.");
      }

      window.location.href = "/dashboard";
    } catch (error) {
      setActivationError(error instanceof Error ? error.message : "Unable to activate access right now.");
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="card relative overflow-hidden p-6 sm:p-8">
      <Script src="https://app.lemonsqueezy.com/js/lemon.js" strategy="afterInteractive" />

      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-400/15 blur-2xl" aria-hidden />
      <div className="absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-orange-300/10 blur-2xl" aria-hidden />

      <div className="relative">
        <p className="mono mb-2 text-xs uppercase tracking-[0.2em] text-cyan-300">Simple Pricing</p>
        <h3 className="text-3xl font-semibold text-slate-50">$15 / vehicle / month</h3>
        <p className="mt-3 max-w-xl text-slate-300">
          Route planning, schedule dispatch, and rider notifications in one dashboard. No onboarding fee, no multi-year lock-in.
        </p>

        <ul className="mt-6 grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-cyan-300" />
            Multi-route planning with stop sequencing
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-cyan-300" />
            Driver assignment and conflict detection
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-cyan-300" />
            SMS, email, and push passenger notices
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-cyan-300" />
            30-day trip history and operations analytics
          </li>
        </ul>

        <div className="mt-6 grid gap-4 rounded-xl border border-slate-700 bg-slate-900/40 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <ShieldCheck className="h-4 w-4 text-cyan-300" />
            Select the role to unlock after payment
          </div>
          <div className="grid gap-2">
            {roleChoices.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-700 bg-slate-900/70 p-3 transition hover:border-cyan-500"
              >
                <input
                  type="radio"
                  name="role"
                  checked={role === option.value}
                  onChange={() => setRole(option.value)}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-medium text-slate-100">{option.label}</span>
                  <span className="block text-xs text-slate-400">{option.helper}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {hasCheckoutConfig ? (
            <a
              href={`${checkoutUrl}?checkout[embed]=1&checkout[media]=0&checkout[logo]=0`}
              className="lemonsqueezy-button inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              <CreditCard className="h-4 w-4" />
              Start Checkout
            </a>
          ) : (
            <p className="rounded-lg border border-amber-600/60 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
              Checkout is not configured. Set `NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID` in your environment.
            </p>
          )}

          <button
            type="button"
            onClick={activateAccess}
            disabled={activating}
            className="inline-flex items-center justify-center rounded-lg border border-slate-600 px-5 py-3 font-medium text-slate-100 transition hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {activating ? "Activating..." : "I completed checkout"}
          </button>
        </div>

        {activationError ? <p className="mt-3 text-sm text-rose-300">{activationError}</p> : null}
      </div>
    </div>
  );
}
