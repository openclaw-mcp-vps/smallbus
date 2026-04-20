import Link from "next/link";
import { ArrowRight, Bell, BusFront, CalendarClock, MapPinned, Users } from "lucide-react";
import { PricingCheckout } from "@/components/PricingCheckout";
import { readAccessFromCookies } from "@/lib/auth";

const problemPoints = [
  "Dispatchers lose hours each week rebuilding schedules in spreadsheets whenever one driver calls out.",
  "Passenger updates happen late because route changes are buried in phone calls and text chains.",
  "Enterprise transit software is priced for city agencies, not 5-50 vehicle operators."
];

const solutionPoints = [
  {
    title: "Route Planning That Fits Small Fleets",
    text: "Create repeatable routes with stop lists, default departure times, and clear trip duration targets.",
    icon: MapPinned
  },
  {
    title: "Driver Scheduling Without Spreadsheet Drift",
    text: "Assign drivers by availability, track coverage by day, and reduce double-booking risk before dispatch.",
    icon: CalendarClock
  },
  {
    title: "Passenger Notifications from One Queue",
    text: "Queue SMS, email, or push notices tied to specific trips so riders always know departure changes.",
    icon: Bell
  }
];

const faq = [
  {
    question: "Can I run this for multiple contracts or service zones?",
    answer:
      "Yes. Most operators create one route set per service zone and manage all assignments from the same dashboard."
  },
  {
    question: "What happens if I need to add seasonal drivers?",
    answer:
      "Add and deactivate drivers in seconds. Schedules stay linked to historical assignments for reporting and audits."
  },
  {
    question: "How quickly can we replace our spreadsheet workflow?",
    answer:
      "Teams typically migrate active routes and driver rosters in under one afternoon and start dispatching the same day."
  },
  {
    question: "Does this require a long contract?",
    answer: "No. Billing is monthly at $15 per vehicle with cancellation at any time."
  }
];

export default async function HomePage() {
  const access = await readAccessFromCookies();

  return (
    <main className="grid-bg relative">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pt-16">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mono mb-4 text-xs uppercase tracking-[0.22em] text-cyan-300">Transit Ops, Simplified</p>
            <h1 className="text-4xl font-semibold leading-tight text-slate-50 sm:text-5xl lg:text-6xl">
              Route, schedule, and notify passengers without enterprise overhead.
            </h1>
            <p className="mt-5 text-lg text-slate-300">
              <span className="font-semibold text-slate-100">small_bus</span> gives small shuttle and rural transit teams one clean command center for route planning,
              driver assignments, and rider communication.
            </p>
          </div>

          <div className="card w-full max-w-sm p-5">
            <p className="mono text-xs uppercase tracking-[0.2em] text-cyan-300">Best Fit</p>
            <p className="mt-2 text-sm text-slate-300">
              Private bus companies, hotel shuttles, campus transit, and county services running 5-50 vehicles.
            </p>
            <div className="mt-4 grid gap-2 text-sm text-slate-100">
              <p className="flex items-center gap-2">
                <BusFront className="h-4 w-4 text-cyan-300" />
                Replace spreadsheet dispatch boards
              </p>
              <p className="flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan-300" />
                Keep drivers and operations in sync
              </p>
              <p className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-cyan-300" />
                Notify riders before routes change
              </p>
            </div>
            <div className="mt-5">
              <Link
                href={access.hasAccess ? "/dashboard" : "/pricing"}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                {access.hasAccess ? "Open Dashboard" : "See Pricing"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {problemPoints.map((point) => (
            <article key={point} className="card p-5 text-sm text-slate-300">
              {point}
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="mono text-xs uppercase tracking-[0.2em] text-cyan-300">How It Works</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-50 sm:text-4xl">Built for operators who need speed, not bloat.</h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {solutionPoints.map((item) => (
            <article key={item.title} className="card p-6">
              <item.icon className="h-8 w-8 text-cyan-300" />
              <h3 className="mt-4 text-xl font-semibold text-slate-100">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <PricingCheckout />
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-slate-50 sm:text-3xl">Frequently asked questions</h2>
        <div className="mt-6 grid gap-4">
          {faq.map((item) => (
            <article key={item.question} className="card p-5">
              <h3 className="text-base font-semibold text-slate-100">{item.question}</h3>
              <p className="mt-2 text-sm text-slate-300">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
