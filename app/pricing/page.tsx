import Link from "next/link";

export const metadata = {
  title: "Pricing"
};

export default function PricingPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-20">
      <div className="rounded-2xl border border-[#30363d] bg-[#11161e] p-8">
        <h1 className="text-3xl font-bold text-[#f0f6fc]">small_bus Pricing</h1>
        <p className="mt-3 text-[#8b949e]">
          Flat $15/month for route planning, driver scheduling, and passenger notifications.
        </p>
        <ul className="mt-6 space-y-2 text-[#c9d1d9]">
          <li>Unlimited routes and run sheets</li>
          <li>Realtime updates across your dispatch team</li>
          <li>Passenger alert history with delivery status</li>
          <li>No setup fee, cancel anytime</li>
        </ul>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK}
            className="inline-flex items-center justify-center rounded-md bg-[#238636] px-5 py-2.5 font-semibold text-white hover:bg-[#2ea043]"
          >
            Continue to Stripe Checkout
          </a>
          <Link
            href="/unlock"
            className="inline-flex items-center justify-center rounded-md border border-[#30363d] px-5 py-2.5 font-semibold hover:bg-[#161b22]"
          >
            I already paid
          </Link>
        </div>
      </div>
    </main>
  );
}
