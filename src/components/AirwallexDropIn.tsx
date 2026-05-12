"use client";
import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";

interface Props {
  intentId: string;
  clientSecret: string;
  orderId: string;
  env: "demo" | "prod";
}

export default function AirwallexDropIn({ intentId, clientSecret, orderId, env }: Props) {
  const router = useRouter();
  const [scriptReady, setScriptReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (!scriptReady || mounted.current) return;
    mounted.current = true;

    const aw = (window as any).Airwallex;
    if (!aw) {
      setError("Payment provider failed to load. Please refresh.");
      return;
    }

    try {
      aw.init({ env, origin: window.location.origin });

      const dropIn = aw.createElement("dropIn", {
        intent: { id: intentId, client_secret: clientSecret },
        currency: "USD",
      });

      dropIn.on("success", () => {
        router.push(`/checkout/return?order=${orderId}`);
      });

      dropIn.on("error", (event: any) => {
        const msg = event?.detail?.message ?? event?.message ?? "Payment failed. Please try again.";
        setError(msg);
        mounted.current = false; // allow remount on retry
      });

      dropIn.mount("#airwallex-dropin");
    } catch (e: any) {
      setError(e?.message ?? "Failed to initialize payment form.");
    }
  }, [scriptReady, intentId, clientSecret, orderId, env, router]);

  return (
    <>
      <Script
        src="https://checkout.airwallex.com/assets/elements.bundle.min.js"
        onReady={() => setScriptReady(true)}
        onError={() => setError("Payment provider failed to load. Please refresh.")}
      />
      {error && (
        <div className="mb-6 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div id="airwallex-dropin" className="min-h-[400px]"/>
    </>
  );
}
