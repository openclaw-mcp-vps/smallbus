import { MainNav } from "@/components/MainNav";
import { DriverRoster } from "@/components/DriverRoster";
import { readAccessFromCookies } from "@/lib/auth";
import { listDrivers } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Drivers",
  description: "Manage driver roster, contact information, and availability for dispatch coverage."
};

export default async function DriversPage() {
  const access = await readAccessFromCookies();
  const drivers = await listDrivers();

  return (
    <main className="pb-12">
      <MainNav role={access.role} />

      <section className="mx-auto mt-8 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold text-slate-50 sm:text-4xl">Driver Management</h1>
        <p className="mt-2 text-sm text-slate-300">
          Keep assignments clean with an accurate, up-to-date roster and availability signal.
        </p>

        <div className="mt-6">
          <DriverRoster initialDrivers={drivers} role={access.role} />
        </div>
      </section>
    </main>
  );
}
