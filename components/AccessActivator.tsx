"use client";

import { useState } from "react";
import type { UserRole } from "@/lib/types";

const roleOptions: { value: UserRole; label: string }[] = [
  { value: "manager", label: "Operations Manager" },
  { value: "dispatcher", label: "Dispatcher" },
  { value: "viewer", label: "Viewer" }
];

export function AccessActivator() {
  const [role, setRole] = useState<UserRole>("manager");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activate = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/access/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ role })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Activation failed");
      }

      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not activate your account.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card max-w-xl p-6">
      <h2 className="text-xl font-semibold text-slate-50">Activate your small_bus workspace</h2>
      <p className="mt-2 text-sm text-slate-300">
        If checkout completed, pick your role and unlock the operations dashboard.
      </p>

      <label className="mt-4 block text-sm text-slate-300" htmlFor="role-select">
        Access role
      </label>
      <select
        id="role-select"
        value={role}
        onChange={(event) => setRole(event.target.value as UserRole)}
        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
      >
        {roleOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={activate}
        disabled={isLoading}
        className="mt-4 rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Activating..." : "Activate Dashboard Access"}
      </button>

      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
