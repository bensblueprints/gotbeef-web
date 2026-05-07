"use client";
import Link from "next/link";
import { Flavor } from "@/lib/products";
import { SINGLE_PACK_CENTS, formatUSD } from "@/lib/pricing";
import { useCart } from "@/lib/cartStore";

function HeatPips({ heat }: { heat: 0 | 1 | 2 | 3 }) {
  return (
    <span className="inline-flex gap-1" aria-label={`Heat: ${heat}/3`}>
      {[1, 2, 3].map(i => (
        <span key={i} className={`block w-1.5 h-1.5 rounded-full ${i <= heat ? "bg-ink" : "bg-ink/20"}`}/>
      ))}
    </span>
  );
}

export default function FlavorCard({ flavor }: { flavor: Flavor }) {
  const { add } = useCart();
  return (
    <article className="group bg-paper border border-ink/10 hover:border-ink transition-colors flex flex-col">
      <Link href={`/products/${flavor.slug}`} className="block aspect-square bg-ink relative overflow-hidden">
        {/* Stylized bag mockup as the card image */}
        <div className="absolute inset-6 border-2 border-white"/>
        <div className="absolute inset-9 border border-white/40"/>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
          <span className="eyebrow text-white/70 mb-2">Gourmet Brisket Beef Jerky</span>
          <span className="font-serif font-black text-white text-3xl leading-none tracking-tight">{flavor.shortName}</span>
          <div className="w-12 h-px bg-white/60 my-4"/>
          <span className="eyebrow text-white">Net Wt 3 oz</span>
        </div>
      </Link>
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-center justify-between">
          <Link href={`/products/${flavor.slug}`} className="font-serif font-black text-xl tracking-tight hover:opacity-60">
            {flavor.shortName}
          </Link>
          <HeatPips heat={flavor.heat}/>
        </div>
        <p className="text-sm text-ink/70 leading-relaxed flex-1">{flavor.blurb}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="font-semibold">{formatUSD(SINGLE_PACK_CENTS)}</span>
          <button
            onClick={() => add({ sku: flavor.sku, qty: 1 })}
            className="btn-primary text-xs py-2 px-4">
            Add to cart
          </button>
        </div>
      </div>
    </article>
  );
}
