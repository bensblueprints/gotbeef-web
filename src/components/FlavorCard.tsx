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
      <Link href={`/products/${flavor.slug}`} className="block aspect-square bg-bone relative overflow-hidden">
        <img
          src={flavor.bagImage}
          alt={`${flavor.name} jerky bag`}
          className="absolute inset-0 w-full h-full object-contain p-6 transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </Link>
      <div className="p-5 flex flex-col gap-3 flex-1 border-t border-ink/10">
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
