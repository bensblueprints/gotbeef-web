"use client";
import { useState } from "react";
import { useCart } from "@/lib/cartStore";
import { formatUSD } from "@/lib/pricing";

export default function AddToCartBox({
  sku, singlePriceCents, isSampler
}: { sku: string; singlePriceCents: number; isSampler?: boolean }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  return (
    <div className="space-y-4">
      {!isSampler && (
        <p className="text-sm text-ink/70">
          <span className="font-semibold">Buy 2 packs save 10% · Buy 3 packs save 15%.</span> Mix & match any flavors.
        </p>
      )}
      <div className="flex items-center gap-3">
        <div className="flex items-center border border-ink">
          <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-10 h-12 hover:bg-ink hover:text-white">−</button>
          <span className="w-12 text-center font-semibold">{qty}</span>
          <button onClick={() => setQty(q => q + 1)} className="w-10 h-12 hover:bg-ink hover:text-white">+</button>
        </div>
        <button onClick={() => add({ sku, qty, isSampler })} className="btn-primary flex-1 justify-center">
          Add {qty} to cart · {formatUSD(singlePriceCents * qty)}
        </button>
      </div>
    </div>
  );
}
