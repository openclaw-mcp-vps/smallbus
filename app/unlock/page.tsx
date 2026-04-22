"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type UnlockForm = {
  email: string;
};

export default function UnlockPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm<UnlockForm>();

  const onSubmit = handleSubmit(async (data) => {
    setLoading(true);
    setErrorMessage("");

    const response = await fetch("/api/paywall/unlock", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setErrorMessage(payload.error ?? "Unable to unlock access.");
      setLoading(false);
      return;
    }

    router.push("/dashboard/routes");
    router.refresh();
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-6 py-20">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Unlock Your Dashboard</CardTitle>
          <CardDescription>
            Enter the billing email used in Stripe checkout. Access is granted automatically after a verified purchase webhook.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Billing email</Label>
              <Input
                id="email"
                type="email"
                placeholder="ops@yourfleet.com"
                required
                {...register("email", { required: true })}
              />
            </div>
            {errorMessage ? <p className="text-sm text-[#f85149]">{errorMessage}</p> : null}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Verifying purchase..." : "Unlock access"}
            </Button>
          </form>

          <div className="mt-6 rounded-lg border border-[#30363d] bg-[#0d1117] p-4 text-sm text-[#8b949e]">
            <p>
              If you just purchased, Stripe webhook processing can take a few seconds. Retry after a moment or contact support
              if verification does not complete.
            </p>
            <a
              href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK}
              className="mt-3 inline-block font-semibold text-[#58a6ff] hover:text-[#79c0ff]"
            >
              Open Stripe checkout
            </a>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
