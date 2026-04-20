import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PricingCheckout } from "@/components/PricingCheckout";

export const metadata = {
  title: "Pricing",
  description: "Choose the small_bus plan and unlock bus routing, scheduling, and rider notifications."
};

export default function PricingPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-cyan-300">
        <ArrowLeft className="h-4 w-4" />
        Back to overview
      </Link>

      <div className="mt-6">
        <h1 className="text-3xl font-semibold text-slate-50 sm:text-4xl">Get small_bus for your transit team</h1>
        <p className="mt-3 max-w-2xl text-slate-300">
          Monthly billing built for small operators. Start checkout, complete payment in Lemon Squeezy, then activate your role and open the dashboard.
        </p>
      </div>

      <div className="mt-8">
        <PricingCheckout />
      </div>
    </main>
  );
}
