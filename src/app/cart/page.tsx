"use client";
import Link from "next/link";
import { useCart } from "@/lib/cartStore";
import { flavorBySku } from "@/lib/products";
import { formatUSD, FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/pricing";

export default function CartPage() {
  const cart = useCart();
  const empty = cart.lines.length === 0;

  return (
    <section className="max-w-5xl mx-auto px-6 py-16">
      <div className="border-b border-ink pb-6 mb-8">
        <p className="eyebrow mb-2">Your Cart</p>
        <h1 className="font-serif font-black text-5xl tracking-tight">Got beef?</h1>
      </div>

      {empty ? (
        <div className="py-20 text-center">
          <p className="text-lg text-ink/70 mb-6">Your cart is empty.</p>
          <Link href="/products" className="btn-primary">Shop the flavors</Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-12">
          {/* Lines */}
          <div className="md:col-span-2 space-y-4">
            {cart.lines.map(line => {
              const flavor = flavorBySku(line.sku);
              const name = line.isSampler ? "5-Flavor Sampler" : (flavor?.name ?? line.sku);
              return (
                <div key={line.sku} className="flex items-center gap-4 border border-ink/15 p-4 bg-paper">
                  <div className="w-20 h-20 bg-ink flex items-center justify-center text-white text-[10px] uppercase tracking-[0.2em] font-bold text-center p-2">
                    {line.isSampler ? "Sampler" : flavor?.shortName ?? line.sku}
                  </div>
                  <div className="flex-1">
                    <p className="font-serif font-black text-xl tracking-tight">{name}</p>
                    {!line.isSampler && line.appliedDiscountPct > 0 && (
                      <p className="text-xs text-emerald-700 font-semibold mt-1">
                        −{line.appliedDiscountPct}% bundle discount applied
                      </p>
                    )}
                    <p className="text-sm text-ink/60 mt-1">{formatUSD(line.unitPriceCents)} each</p>
                  </div>
                  <div className="flex items-center border border-ink">
                    <button onClick={() => cart.setQty(line.sku, line.qty - 1)} className="w-8 h-8 hover:bg-ink hover:text-white">−</button>
                    <span className="w-8 text-center font-semibold">{line.qty}</span>
                    <button onClick={() => cart.setQty(line.sku, line.qty + 1)} className="w-8 h-8 hover:bg-ink hover:text-white">+</button>
                  </div>
                  <div className="w-24 text-right font-semibold">{formatUSD(line.lineSubtotalCents)}</div>
                  <button onClick={() => cart.remove(line.sku)} className="text-ink/50 hover:text-ink text-xs uppercase tracking-wider">Remove</button>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <aside className="bg-ink text-white p-6 h-fit space-y-4">
            <p className="eyebrow text-white/60">Order Summary</p>
            <div className="space-y-2 text-sm">
              <Row label="Subtotal" value={formatUSD(cart.subtotalCents)}/>
              {cart.bundleDiscountCents > 0 && (
                <Row label="Bundle savings" value={`−${formatUSD(cart.bundleDiscountCents)}`} accent/>
              )}
              <Row label="Shipping" value={cart.qualifiesForFreeShipping ? "FREE" : "Calculated at checkout"}/>
              <Row label="Taxes" value="Calculated at checkout"/>
            </div>

            {!cart.qualifiesForFreeShipping && (
              <div className="border border-white/30 p-3">
                <p className="text-xs">
                  Add <span className="font-bold">{formatUSD(cart.amountToFreeShippingCents)}</span> more to get FREE shipping.
                </p>
                <div className="mt-2 h-1 bg-white/20">
                  <div className="h-full bg-white transition-all"
                    style={{ width: `${Math.min(100, (cart.subtotalCents / FREE_SHIPPING_THRESHOLD_CENTS) * 100)}%` }}/>
                </div>
              </div>
            )}

            <div className="rule-soft bg-white/30"/>
            <div className="flex justify-between font-serif font-black text-2xl">
              <span>Total</span>
              <span>{formatUSD(cart.subtotalCents)}</span>
            </div>
            <Link href="/checkout" className="btn-primary border border-white bg-white text-ink justify-center w-full">
              Checkout →
            </Link>
            <Link href="/products" className="block text-center text-xs uppercase tracking-[0.2em] hover:underline">
              Continue shopping
            </Link>
          </aside>
        </div>
      )}
    </section>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-white/70">{label}</span>
      <span className={accent ? "text-emerald-300 font-semibold" : "font-semibold"}>{value}</span>
    </div>
  );
}
