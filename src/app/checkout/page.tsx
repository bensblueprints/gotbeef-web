"use client";
import { useState } from "react";
import { useCart } from "@/lib/cartStore";
import { formatUSD } from "@/lib/pricing";

export default function CheckoutPage() {
  const cart = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postal, setPostal] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function place(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setError(null);
    try {
      const res = await fetch("/api/checkout/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email, lines: cart.lines,
          shipTo: { name, line1, city, state, postalCode: postal, country: "US" }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      // Redirect to Airwallex hosted checkout (or render Drop-in Element).
      window.location.href = data.checkoutUrl ?? "/checkout/return";
    } catch (err: any) {
      setError(err.message); setSubmitting(false);
    }
  }

  if (cart.lines.length === 0) {
    return <div className="max-w-3xl mx-auto px-6 py-20 text-center">Your cart is empty.</div>;
  }

  return (
    <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12">
      <form onSubmit={place} className="space-y-6">
        <div>
          <p className="eyebrow mb-2">Step 1</p>
          <h2 className="font-serif font-black text-3xl tracking-tight">Contact</h2>
          <input type="email" required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            className="mt-3 w-full border border-ink px-4 py-3"/>
        </div>
        <div>
          <p className="eyebrow mb-2">Step 2</p>
          <h2 className="font-serif font-black text-3xl tracking-tight">Shipping address</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <input required placeholder="Full name" className="col-span-2 border border-ink px-4 py-3" value={name} onChange={e=>setName(e.target.value)}/>
            <input required placeholder="Address" className="col-span-2 border border-ink px-4 py-3" value={line1} onChange={e=>setLine1(e.target.value)}/>
            <input required placeholder="City" className="border border-ink px-4 py-3" value={city} onChange={e=>setCity(e.target.value)}/>
            <input required placeholder="State" className="border border-ink px-4 py-3" value={state} onChange={e=>setState(e.target.value)}/>
            <input required placeholder="ZIP" className="col-span-2 border border-ink px-4 py-3" value={postal} onChange={e=>setPostal(e.target.value)}/>
          </div>
        </div>
        <div>
          <p className="eyebrow mb-2">Step 3</p>
          <h2 className="font-serif font-black text-3xl tracking-tight">Payment</h2>
          <p className="text-sm text-ink/60 mt-2">Card details collected on the next step via Airwallex (cards, Apple Pay, Google Pay).</p>
        </div>
        {error && <p className="text-red-700 text-sm">{error}</p>}
        <button disabled={submitting} className="btn-primary w-full justify-center">
          {submitting ? "Working..." : `Continue to payment · ${formatUSD(cart.subtotalCents)}`}
        </button>
      </form>

      <aside className="bg-ink text-white p-6 h-fit">
        <p className="eyebrow text-white/60 mb-3">Order Summary</p>
        <div className="space-y-2 text-sm">
          {cart.lines.map(l => (
            <div key={l.sku} className="flex justify-between">
              <span>{l.qty} × {l.sku}</span>
              <span>{formatUSD(l.lineSubtotalCents)}</span>
            </div>
          ))}
        </div>
        <div className="rule-soft bg-white/30 my-4"/>
        <div className="flex justify-between text-sm">
          <span>Subtotal</span><span>{formatUSD(cart.subtotalCents)}</span>
        </div>
        {cart.bundleDiscountCents > 0 && (
          <div className="flex justify-between text-sm text-emerald-300">
            <span>Bundle savings</span><span>−{formatUSD(cart.bundleDiscountCents)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span>Shipping</span>
          <span>{cart.qualifiesForFreeShipping ? "FREE" : "Calculated next"}</span>
        </div>
        <div className="flex justify-between font-serif font-black text-2xl mt-3">
          <span>Total</span><span>{formatUSD(cart.subtotalCents)}</span>
        </div>
      </aside>
    </section>
  );
}
