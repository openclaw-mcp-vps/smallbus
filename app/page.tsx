import Link from "next/link";
import { ArrowRight, Bell, Bus, CalendarClock, ChartLine, ShieldCheck } from "lucide-react";

const faqItems = [
  {
    question: "How quickly can we move from spreadsheets to small_bus?",
    answer:
      "Most teams import routes and active runs in under two hours. Drivers can start using mobile-friendly schedule views on day one with no dedicated training lead."
  },
  {
    question: "Does this work for fixed and demand-response service?",
    answer:
      "Yes. You can set fixed loops, airport connectors, and flexible community pickups in the same workspace. Dispatchers can adjust assignments in real time."
  },
  {
    question: "What does onboarding cost?",
    answer:
      "There is no onboarding fee. You pay a flat $15 monthly subscription and can cancel anytime from your billing portal."
  },
  {
    question: "Do riders receive delay alerts?",
    answer:
      "Dispatch can send SMS, email, or push alerts from the notification panel and monitor delivery status in a single timeline."
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0d1117] text-[#c9d1d9]">
      <section className="relative overflow-hidden border-b border-[#21262d]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(31,111,235,0.18),_transparent_45%),radial-gradient(circle_at_bottom_left,_rgba(35,134,54,0.14),_transparent_40%)]" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 py-20 md:px-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-6">
            <span className="inline-flex rounded-full border border-[#30363d] bg-[#11161e] px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#58a6ff]">
              Built for 5-50 vehicle operations
            </span>
            <h1 className="text-4xl font-bold leading-tight text-[#f0f6fc] md:text-6xl">
              small_bus keeps routes, drivers, and rider alerts in one lightweight dispatch workspace.
            </h1>
            <p className="max-w-xl text-lg text-[#8b949e]">
              Stop juggling whiteboards and spreadsheet tabs. Plan routes in minutes, assign drivers with confidence, and notify passengers when service shifts.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK}
                className="inline-flex items-center justify-center rounded-md bg-[#238636] px-6 py-3 font-semibold text-white transition hover:bg-[#2ea043]"
              >
                Start for $15/month
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-md border border-[#30363d] bg-[#11161e] px-6 py-3 font-semibold text-[#c9d1d9] transition hover:bg-[#161b22]"
              >
                View Product Tour
              </Link>
            </div>
          </div>
          <div className="w-full max-w-md rounded-2xl border border-[#30363d] bg-[#11161e] p-6 shadow-2xl shadow-[#010409]">
            <h2 className="text-xl font-semibold text-[#f0f6fc]">Dispatch Snapshot</h2>
            <div className="mt-4 space-y-3 text-sm text-[#8b949e]">
              <p className="flex items-center justify-between rounded-lg bg-[#0d1117] p-3">
                Active Routes <span className="font-semibold text-[#f0f6fc]">12</span>
              </p>
              <p className="flex items-center justify-between rounded-lg bg-[#0d1117] p-3">
                Drivers On Shift <span className="font-semibold text-[#f0f6fc]">18</span>
              </p>
              <p className="flex items-center justify-between rounded-lg bg-[#0d1117] p-3">
                Rider Alerts Sent Today <span className="font-semibold text-[#f0f6fc]">74</span>
              </p>
              <p className="rounded-lg border border-[#30363d] bg-[#0d1117] p-3 text-[#c9d1d9]">
                Dispatch teams typically recover 8-12 admin hours per week after switching from manual scheduling.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:px-10">
        <h2 className="text-3xl font-bold text-[#f0f6fc]">Why teams switch</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-[#30363d] bg-[#11161e] p-6">
            <CalendarClock className="h-8 w-8 text-[#58a6ff]" />
            <h3 className="mt-4 text-xl font-semibold text-[#f0f6fc]">Scheduling takes too long</h3>
            <p className="mt-2 text-[#8b949e]">
              Dispatchers lose mornings reconciling driver availability, route conflicts, and rider commitments manually.
            </p>
          </article>
          <article className="rounded-xl border border-[#30363d] bg-[#11161e] p-6">
            <ChartLine className="h-8 w-8 text-[#3fb950]" />
            <h3 className="mt-4 text-xl font-semibold text-[#f0f6fc]">Enterprise tools are overkill</h3>
            <p className="mt-2 text-[#8b949e]">
              Large city-focused platforms bury simple tasks in complex workflows and monthly contracts that small fleets do not need.
            </p>
          </article>
          <article className="rounded-xl border border-[#30363d] bg-[#11161e] p-6">
            <Bell className="h-8 w-8 text-[#d29922]" />
            <h3 className="mt-4 text-xl font-semibold text-[#f0f6fc]">Riders miss service updates</h3>
            <p className="mt-2 text-[#8b949e]">
              Delay and reroute notices often happen too late, creating support calls and lost trust.
            </p>
          </article>
        </div>
      </section>

      <section className="border-y border-[#21262d] bg-[#11161e]">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-3 md:px-10">
          <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-6">
            <Bus className="h-8 w-8 text-[#58a6ff]" />
            <h3 className="mt-4 text-lg font-semibold text-[#f0f6fc]">Route Planning</h3>
            <p className="mt-2 text-[#8b949e]">
              Build and adjust routes with stop-level context, estimated run times, and map previews that update live.
            </p>
          </div>
          <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-6">
            <CalendarClock className="h-8 w-8 text-[#3fb950]" />
            <h3 className="mt-4 text-lg font-semibold text-[#f0f6fc]">Driver Scheduling</h3>
            <p className="mt-2 text-[#8b949e]">
              Assign drivers by availability, track shift load, and prevent conflicts before they impact service.
            </p>
          </div>
          <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-6">
            <ShieldCheck className="h-8 w-8 text-[#d29922]" />
            <h3 className="mt-4 text-lg font-semibold text-[#f0f6fc]">Passenger Notifications</h3>
            <p className="mt-2 text-[#8b949e]">
              Broadcast delay notices through SMS, email, or push from one panel with status tracking.
            </p>
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-6 py-16 md:px-10">
        <div className="rounded-2xl border border-[#30363d] bg-[#11161e] p-8 md:p-12">
          <h2 className="text-3xl font-bold text-[#f0f6fc]">Simple pricing for lean operations teams</h2>
          <p className="mt-3 text-[#8b949e]">One plan, full platform access, no setup fee, no long-term lock-in.</p>
          <div className="mt-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="text-4xl font-bold text-[#f0f6fc]">$15<span className="text-lg text-[#8b949e]"> / month</span></p>
              <ul className="mt-4 space-y-2 text-sm text-[#c9d1d9]">
                <li>Unlimited routes, schedules, and drivers</li>
                <li>Realtime dispatch dashboard</li>
                <li>Passenger notification timeline</li>
                <li>Email support from the product team</li>
              </ul>
            </div>
            <div className="flex flex-col gap-3">
              <a
                href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK}
                className="inline-flex items-center justify-center rounded-md bg-[#238636] px-6 py-3 font-semibold text-white transition hover:bg-[#2ea043]"
              >
                Buy Now with Stripe
              </a>
              <Link
                href="/unlock"
                className="text-sm font-medium text-[#58a6ff] transition hover:text-[#79c0ff]"
              >
                Already purchased? Unlock dashboard access
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-20 md:px-10">
        <h2 className="text-3xl font-bold text-[#f0f6fc]">FAQ</h2>
        <div className="mt-8 space-y-4">
          {faqItems.map((faq) => (
            <article key={faq.question} className="rounded-xl border border-[#30363d] bg-[#11161e] p-6">
              <h3 className="text-lg font-semibold text-[#f0f6fc]">{faq.question}</h3>
              <p className="mt-2 text-[#8b949e]">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
