import { MainNav } from "@/components/MainNav";
import { NotificationCenter } from "@/components/NotificationCenter";
import { readAccessFromCookies } from "@/lib/auth";
import { listNotifications, listSchedules } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Notifications",
  description: "Queue and track passenger communications tied to route and schedule updates."
};

export default async function NotificationsPage() {
  const access = await readAccessFromCookies();
  const [notifications, schedules] = await Promise.all([listNotifications(), listSchedules()]);

  return (
    <main className="pb-12">
      <MainNav role={access.role} />

      <section className="mx-auto mt-8 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold text-slate-50 sm:text-4xl">Passenger Notifications</h1>
        <p className="mt-2 text-sm text-slate-300">
          Send accurate rider updates before delays become complaint calls.
        </p>

        <div className="mt-6">
          <NotificationCenter notifications={notifications} schedules={schedules} />
        </div>
      </section>
    </main>
  );
}
