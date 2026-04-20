"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    LemonSqueezy?: {
      Url?: {
        Open: (url: string) => void;
      };
    };
    createLemonSqueezy?: () => void;
  }
}

type CheckoutButtonProps = {
  className?: string;
};

export default function CheckoutButton({ className }: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const existingScript = document.querySelector("script[data-lemonsqueezy]");

    if (existingScript) {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://app.lemonsqueezy.com/js/lemon.js";
    script.defer = true;
    script.setAttribute("data-lemonsqueezy", "true");
    document.body.appendChild(script);
  }, []);

  async function handleCheckout() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to create checkout session.");
      }

      const payload = (await response.json()) as { checkoutUrl: string };

      window.createLemonSqueezy?.();

      if (window.LemonSqueezy?.Url?.Open) {
        window.LemonSqueezy.Url.Open(payload.checkoutUrl);
      } else {
        window.location.href = payload.checkoutUrl;
      }
    } catch (error) {
      const fallbackMessage =
        error instanceof Error
          ? error.message
          : "Unable to start checkout. Please try again.";
      setErrorMessage(fallbackMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button
        className={className}
        onClick={handleCheckout}
        disabled={isLoading}
        type="button"
      >
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ShieldCheck className="size-4" />
        )}
        {isLoading ? "Opening checkout..." : "Start $15/month subscription"}
        <ArrowRight className="size-4" />
      </Button>
      {errorMessage ? (
        <p className="text-sm text-red-300">{errorMessage}</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Secure Lemon Squeezy checkout. You will be redirected back with access
          automatically enabled.
        </p>
      )}
    </div>
  );
}
