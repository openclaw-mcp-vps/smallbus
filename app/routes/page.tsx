import { MainNav } from "@/components/MainNav";
import { RoutePlanner } from "@/components/RoutePlanner";
import { readAccessFromCookies } from "@/lib/auth";
import { listRoutes } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Routes",
  description: "Plan and manage active bus routes with stop sequencing and duration targets."
};

export default async function RoutesPage() {
  const access = await readAccessFromCookies();
  const routes = await listRoutes();

  return (
    <main className="pb-12">
      <MainNav role={access.role} />

      <section className="mx-auto mt-8 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold text-slate-50 sm:text-4xl">Route Planning</h1>
        <p className="mt-2 text-sm text-slate-300">
          Build reliable route templates and maintain stop-level visibility for daily dispatch.
        </p>

        <div className="mt-6">
          <RoutePlanner initialRoutes={routes} />
        </div>
      </section>
    </main>
  );
}
