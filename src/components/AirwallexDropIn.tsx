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
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const mounted = useRef(false);

  function handleScriptError() {
    setStatus("error");
    setErrorMsg("Payment provider failed to load. Please refresh the page.");
  }

  async function handleScriptReady() {
    if (mounted.current) return;
    mounted.current = true;

    const aw = (window as any).Airwallex;
    if (!aw) {
      setStatus("error");
      setErrorMsg("Payment provider unavailable. Please refresh.");
      return;
    }

    try {
      // init() is async — must await before createElement
      await aw.init({ env, origin: window.location.origin });

      const element = aw.createElement("dropIn", {
        intent: { id: intentId, client_secret: clientSecret },
        currency: "USD",
      });

      element.on("success", () => {
        router.push(`/checkout/return?order=${orderId}`);
      });

      element.on("error", (event: any) => {
        const msg =
          event?.detail?.message ??
          event?.message ??
          "Payment failed. Please try again.";
        setStatus("error");
        setErrorMsg(msg);
        mounted.current = false;
      });

      element.on("ready", () => setStatus("ready"));

      element.mount("#airwallex-dropin");
    } catch (e: any) {
      setStatus("error");
      setErrorMsg(e?.message ?? "Failed to initialize payment form.");
      mounted.current = false;
    }
  }

  return (
    <>
      <Script
        src="https://checkout.airwallex.com/assets/elements.bundle.min.js"
        onReady={() => { void handleScriptReady(); }}
        onError={handleScriptError}
      />

      {errorMsg && (
        <div className="mb-6 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {status === "loading" && !errorMsg && (
        <div className="flex items-center justify-center h-40 text-ink/40 text-sm">
          Loading payment form…
        </div>
      )}

      <div id="airwallex-dropin" className={status === "ready" ? "" : "hidden"} />
    </>
  );
}
