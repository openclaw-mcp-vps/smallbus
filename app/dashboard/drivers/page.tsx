"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { IdCard, Loader2, Plus, UserRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import type { Driver, DriverStatus } from "@/lib/database";

const driverSchema = z.object({
  name: z.string().min(3, "Driver name is required."),
  phone: z.string().min(7, "Phone number is required."),
  licenseNumber: z.string().min(5, "License number is required."),
  status: z.enum(["available", "on-route", "off-duty", "leave"]),
});

type DriverForm = z.infer<typeof driverSchema>;

type DriversApiResponse = {
  drivers: Driver[];
};

const statusOptions: DriverStatus[] = [
  "available",
  "on-route",
  "off-duty",
  "leave",
];

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DriverForm>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      name: "",
      phone: "",
      licenseNumber: "",
      status: "available",
    },
  });

  const statusCounts = useMemo(() => {
    return statusOptions.reduce<Record<DriverStatus, number>>(
      (acc, status) => {
        acc[status] = drivers.filter((driver) => driver.status === status).length;
        return acc;
      },
      {
        available: 0,
        "on-route": 0,
        "off-duty": 0,
        leave: 0,
      },
    );
  }, [drivers]);

  async function fetchDrivers() {
    setIsLoading(true);
    setApiError(null);

    try {
      const response = await fetch("/api/drivers", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Could not load drivers.");
      }

      const payload = (await response.json()) as DriversApiResponse;
      setDrivers(payload.drivers);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not load drivers.";
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void fetchDrivers();
  }, []);

  async function onSubmit(values: DriverForm) {
    setApiError(null);

    try {
      const response = await fetch("/api/drivers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Failed to add driver.");
      }

      const payload = (await response.json()) as { driver: Driver };
      setDrivers((prev) => [...prev, payload.driver]);
      reset({ name: "", phone: "", licenseNumber: "", status: "available" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add driver.";
      setApiError(message);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
      <section className="space-y-4 rounded-2xl border border-border bg-card/80 p-4">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-[0.12em] text-blue-200">
            Driver roster
          </p>
          <h2 className="font-heading text-xl font-semibold text-white">
            Add and manage driver availability
          </h2>
        </header>

        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-200">Full Name</span>
            <input
              className="w-full rounded-lg border border-border bg-[#111a2a] px-3 py-2"
              placeholder="Maria Alvarez"
              {...register("name")}
            />
            {errors.name ? (
              <span className="mt-1 block text-xs text-red-300">{errors.name.message}</span>
            ) : null}
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-slate-200">Phone</span>
            <input
              className="w-full rounded-lg border border-border bg-[#111a2a] px-3 py-2"
              placeholder="+1-555-0101"
              {...register("phone")}
            />
            {errors.phone ? (
              <span className="mt-1 block text-xs text-red-300">{errors.phone.message}</span>
            ) : null}
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-slate-200">License Number</span>
            <input
              className="w-full rounded-lg border border-border bg-[#111a2a] px-3 py-2"
              placeholder="TX-008214"
              {...register("licenseNumber")}
            />
            {errors.licenseNumber ? (
              <span className="mt-1 block text-xs text-red-300">
                {errors.licenseNumber.message}
              </span>
            ) : null}
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-slate-200">Status</span>
            <select
              className="w-full rounded-lg border border-border bg-[#111a2a] px-3 py-2"
              {...register("status")}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <Button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-400"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Add Driver
          </Button>
        </form>

        {apiError ? (
          <p className="rounded-lg border border-red-300/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {apiError}
          </p>
        ) : null}
      </section>

      <section className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {statusOptions.map((status) => (
            <article
              key={status}
              className="rounded-xl border border-border bg-[#111a2a] p-3"
            >
              <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
                {status}
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">{statusCounts[status]}</p>
            </article>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card/80 p-4">
          <h2 className="mb-4 font-heading text-xl font-semibold text-white">
            Driver directory
          </h2>

          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading drivers...
            </div>
          ) : drivers.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {drivers.map((driver) => (
                <article
                  key={driver.id}
                  className="space-y-2 rounded-xl border border-border bg-[#111a2a] p-3"
                >
                  <p className="flex items-center gap-2 font-medium text-slate-100">
                    <UserRound className="size-4 text-blue-300" />
                    {driver.name}
                  </p>
                  <p className="text-xs text-slate-300">{driver.phone}</p>
                  <p className="flex items-center gap-1 text-xs text-slate-300">
                    <IdCard className="size-3.5" />
                    {driver.licenseNumber}
                  </p>
                  <span className="inline-flex rounded-full bg-[#1f3354] px-2 py-1 text-xs text-blue-100">
                    {driver.status}
                  </span>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              No drivers yet. Add your first operator from the form.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
