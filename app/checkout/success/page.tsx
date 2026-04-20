import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { AccessActivator } from "@/components/AccessActivator";

export const metadata = {
  title: "Checkout Success",
  description: "Finalize access and enter your small_bus operations workspace."
};

export default function CheckoutSuccessPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-200">
        <CheckCircle2 className="h-5 w-5" />
        Payment receipt detected. Finish activation to unlock the app.
      </div>

      <AccessActivator />

      <p className="mt-5 text-sm text-slate-400">
        Need to restart checkout? <Link href="/pricing" className="text-cyan-300 underline">Return to pricing</Link>
      </p>
    </main>
  );
}
