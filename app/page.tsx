import Link from "next/link";
import {
  AlarmClock,
  ArrowRight,
  BellRing,
  CalendarRange,
  CircleCheck,
  MapPinned,
  Route,
  Shield,
} from "lucide-react";

import CheckoutButton from "@/components/CheckoutButton";
import { Button } from "@/components/ui/button";
import { getSessionContext } from "@/lib/auth";

const faqItems = [
  {
    question: "How quickly can our team switch from spreadsheets?",
    answer:
      "Most operators move their first route set in under an hour. small_bus starts with route, driver, and schedule views that mirror how dispatch teams already work.",
  },
  {
    question: "Can dispatchers use this from a phone in the field?",
    answer:
      "Yes. The dashboard is mobile responsive, so supervisors can check assignments, route updates, and passenger notices from the yard or from a stop.",
  },
  {
    question: "Do we need enterprise onboarding or consulting?",
    answer:
      "No. The product is built for small fleets. You can launch with your own data and workflows without external implementation teams.",
  },
  {
    question: "How does payment and access work?",
    answer:
      "Payment runs through Lemon Squeezy checkout. After successful purchase, small_bus grants a secure access cookie and unlocks the full operations workspace.",
  },
];

const featurePoints = [
  {
    title: "Route Planning",
    description:
      "Define multi-stop routes, view stop sequences on a live map, and keep route details centralized for every dispatcher.",
    icon: Route,
  },
  {
    title: "Driver Scheduling",
    description:
      "Assign drivers to route blocks with vehicle codes and status tracking so managers can see coverage gaps before they become missed pickups.",
    icon: CalendarRange,
  },
  {
    title: "Passenger Notifications",
    description:
      "Send updates by SMS, email, or in-app target groups whenever departure times shift or service windows change.",
    icon: BellRing,
  },
];

export default async function HomePage() {
  const session = await getSessionContext();

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-70">
        <div className="absolute left-0 top-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute right-0 top-56 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <header className="rounded-3xl border border-border bg-[linear-gradient(140deg,#0f1a2d_0%,#111d33_45%,#162746_100%)] p-6 sm:p-10">
        <nav className="mb-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1 text-xs uppercase tracking-[0.12em] text-blue-200">
            <MapPinned className="size-3.5" />
            small_bus
          </div>
          <Link
            href="#pricing"
            className="text-sm font-medium text-blue-200 transition hover:text-blue-100"
          >
            Pricing
          </Link>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <section className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
              <AlarmClock className="size-3.5" />
              Built for shuttle and rural transit teams with 5-50 vehicles
            </p>
            <h1 className="font-heading text-3xl leading-tight tracking-tight text-white sm:text-5xl">
              Dispatch routes and drivers in minutes, not spreadsheets.
            </h1>
            <p className="max-w-xl text-base text-slate-200 sm:text-lg">
              small_bus replaces patchwork scheduling with one focused dashboard:
              route planning, driver assignments, and passenger updates in a
              workflow your operations team can run every day.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {session.paid ? (
                <Link href="/dashboard/routes">
                  <Button className="h-10 bg-blue-500 px-4 text-sm hover:bg-blue-400">
                    Open operations dashboard
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
              ) : (
                <CheckoutButton className="h-10 bg-blue-500 px-4 text-sm hover:bg-blue-400" />
              )}
              <p className="text-xs text-slate-300">
                Flat price: <span className="font-semibold text-white">$15/mo</span>
                , cancel any time.
              </p>
            </div>
          </section>

          <aside className="rounded-2xl border border-border bg-[#0f1828] p-5">
            <h2 className="font-heading text-lg font-semibold text-white">
              Why teams switch
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-200">
              <li className="flex items-start gap-2">
                <CircleCheck className="mt-0.5 size-4 text-emerald-300" />
                Eliminate multi-tab schedule edits and double-booked drivers.
              </li>
              <li className="flex items-start gap-2">
                <CircleCheck className="mt-0.5 size-4 text-emerald-300" />
                Replace dispatch systems that charge enterprise pricing.
              </li>
              <li className="flex items-start gap-2">
                <CircleCheck className="mt-0.5 size-4 text-emerald-300" />
                Keep managers and field supervisors aligned in real time.
              </li>
            </ul>
          </aside>
        </div>
      </header>

      <section className="mt-10 rounded-2xl border border-border bg-card/70 p-6 sm:p-8">
        <h2 className="font-heading text-2xl font-semibold text-white">
          The problem with legacy dispatch tools
        </h2>
        <p className="mt-4 max-w-3xl text-slate-200">
          Small fleets are forced to choose between brittle spreadsheets and
          enterprise transit software built for city-scale agencies. The result
          is missed notifications, overtime surprises, and managers burning
          hours on manual reconciliation every week.
        </p>
      </section>

      <section className="mt-10 space-y-5">
        <h2 className="font-heading text-2xl font-semibold text-white">
          What small_bus delivers
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {featurePoints.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-border bg-card/70 p-5"
            >
              <feature.icon className="size-5 text-blue-300" />
              <h3 className="mt-3 font-heading text-lg font-semibold text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-slate-200">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="pricing" className="mt-10">
        <div className="rounded-3xl border border-blue-400/30 bg-[linear-gradient(140deg,#122445_0%,#15315f_55%,#194072_100%)] p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-heading text-2xl font-semibold text-white">
                Simple pricing for real operations
              </h2>
              <p className="mt-2 max-w-xl text-sm text-blue-100">
                One plan for route planning, driver scheduling, and passenger
                updates. No per-seat traps, no implementation fees, no contract.
              </p>
            </div>
            <div className="rounded-2xl border border-blue-200/30 bg-blue-950/40 px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.12em] text-blue-200">
                Starter Plan
              </p>
              <p className="font-heading text-3xl text-white">$15/mo</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            {session.paid ? (
              <Link href="/dashboard/routes">
                <Button className="h-10 bg-white px-4 text-slate-900 hover:bg-slate-100">
                  Continue to dashboard
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            ) : (
              <CheckoutButton className="h-10 bg-white px-4 text-slate-900 hover:bg-slate-100" />
            )}
            <p className="text-xs text-blue-100">
              Includes mobile access, API endpoints, and secure cookie-based
              access after checkout completion.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-border bg-card/70 p-6 sm:p-8">
        <h2 className="font-heading text-2xl font-semibold text-white">FAQ</h2>
        <div className="mt-5 space-y-4">
          {faqItems.map((item) => (
            <article key={item.question} className="rounded-xl border border-border bg-[#101a2b] p-4">
              <h3 className="font-medium text-slate-100">{item.question}</h3>
              <p className="mt-2 text-sm text-slate-300">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-xs text-slate-400">
        <p>small_bus for independent shuttle and transit operations.</p>
        <p className="inline-flex items-center gap-1">
          <Shield className="size-3.5" />
          Secure checkout and role-based dashboard access
        </p>
      </footer>
    </main>
  );
}
