"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeCheck, Phone, Plus } from "lucide-react";
import type { DriverItem, UserRole } from "@/lib/types";

const driverSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().min(7).max(30),
  license_number: z.string().min(4).max(40),
  availabilityInput: z.string().min(2),
  active: z.boolean().default(true)
});

type DriverFormInput = z.input<typeof driverSchema>;
type DriverFormOutput = z.output<typeof driverSchema>;

function parseAvailability(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function DriverRoster({
  initialDrivers,
  role
}: {
  initialDrivers: DriverItem[];
  role: UserRole;
}) {
  const [drivers, setDrivers] = useState<DriverItem[]>(initialDrivers);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<DriverFormInput, unknown, DriverFormOutput>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      name: "",
      phone: "",
      license_number: "",
      availabilityInput: "Mon,Tue,Wed,Thu,Fri",
      active: true
    }
  });

  const canEdit = role !== "viewer";

  const submit = form.handleSubmit(async (values) => {
    if (!canEdit) {
      setError("Viewer role cannot add drivers.");
      return;
    }

    try {
      setError(null);
      const availability = parseAvailability(values.availabilityInput);
      if (!availability.length) {
        throw new Error("Add at least one availability day");
      }

      const response = await fetch("/api/drivers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: values.name,
          phone: values.phone,
          license_number: values.license_number,
          availability,
          active: values.active
        })
      });

      const payload = (await response.json()) as { data?: DriverItem; error?: string };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? "Could not add driver");
      }

      setDrivers((current) => [payload.data as DriverItem, ...current]);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add driver");
    }
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.05fr]">
      <div className="card p-5">
        <h2 className="text-lg font-semibold text-slate-100">Driver Directory</h2>
        <p className="mt-1 text-sm text-slate-400">Track current roster, licenses, and weekly availability coverage.</p>

        <div className="mt-4 grid max-h-[620px] gap-3 overflow-y-auto pr-1">
          {drivers.map((driver) => (
            <article key={driver.id} className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-slate-100">{driver.name}</p>
                  <p className="mt-1 flex items-center gap-1 text-sm text-slate-300">
                    <Phone className="h-4 w-4 text-cyan-300" />
                    {driver.phone}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs ${
                    driver.active
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                      : "border-slate-600 bg-slate-700/20 text-slate-400"
                  }`}
                >
                  {driver.active ? "active" : "inactive"}
                </span>
              </div>

              <p className="mt-2 flex items-center gap-1 text-sm text-slate-300">
                <BadgeCheck className="h-4 w-4 text-cyan-300" />
                License: {driver.license_number}
              </p>

              <p className="mt-2 text-xs text-slate-400">Available: {driver.availability.join(", ")}</p>
            </article>
          ))}

          {drivers.length === 0 ? <p className="text-sm text-slate-400">No drivers in roster yet.</p> : null}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-lg font-semibold text-slate-100">Add Driver</h2>
        <p className="mt-1 text-sm text-slate-400">Create driver records with contact and licensing details.</p>

        <form onSubmit={submit} className="mt-4 grid gap-4">
          <label className="grid gap-1 text-sm text-slate-300">
            Full Name
            <input
              type="text"
              {...form.register("name")}
              placeholder="Jordan Ellis"
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500"
              disabled={!canEdit}
            />
          </label>

          <label className="grid gap-1 text-sm text-slate-300">
            Phone
            <input
              type="text"
              {...form.register("phone")}
              placeholder="+1-555-0144"
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500"
              disabled={!canEdit}
            />
          </label>

          <label className="grid gap-1 text-sm text-slate-300">
            License Number
            <input
              type="text"
              {...form.register("license_number")}
              placeholder="CDL-88210"
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500"
              disabled={!canEdit}
            />
          </label>

          <label className="grid gap-1 text-sm text-slate-300">
            Availability (comma separated)
            <input
              type="text"
              {...form.register("availabilityInput")}
              placeholder="Mon,Tue,Thu,Fri"
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500"
              disabled={!canEdit}
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" {...form.register("active")} disabled={!canEdit} />
            Driver currently active for scheduling
          </label>

          {Object.keys(form.formState.errors).length > 0 ? (
            <p className="text-sm text-rose-300">Please complete all required fields.</p>
          ) : null}
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <button
            type="submit"
            disabled={!canEdit}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            Save Driver
          </button>
        </form>
      </div>
    </div>
  );
}
