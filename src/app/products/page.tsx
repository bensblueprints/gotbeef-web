import FlavorCard from "@/components/FlavorCard";
import { FLAVORS } from "@/lib/products";
import { formatUSD, SAMPLER_CENTS } from "@/lib/pricing";
import { shipsThisCopy } from "@/lib/shipping";
import Link from "next/link";

export const metadata = { title: "Shop all flavors" };

export default function ShopPage() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <div className="border-b border-ink pb-6 mb-10">
        <p className="eyebrow mb-2">Shop</p>
        <h1 className="font-serif font-black text-5xl md:text-6xl tracking-tight">All five flavors.</h1>
        <p className="mt-3 text-ink/70 max-w-2xl">Buy 2, save 10%. Buy 3, save 15%. Free shipping over $50.</p>
        <p className="mt-4 text-[12px] uppercase tracking-[0.2em] font-semibold text-ink/70">
          <span className="text-ink/50">★</span> {shipsThisCopy()} · Order by Wednesday 11:59pm CT
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {FLAVORS.map(f => <FlavorCard key={f.sku} flavor={f}/>)}
        <Link href="/products/sampler" className="bg-ink text-white p-8 flex flex-col justify-between hover:opacity-90">
          <div>
            <p className="eyebrow text-white/60">5-Flavor Sampler</p>
            <p className="font-serif font-black text-4xl mt-3 leading-none tracking-tight">One of every flavor.</p>
            <p className="mt-3 text-sm text-white/80">All five SKUs in a single box.</p>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <span className="font-serif text-3xl font-black">{formatUSD(SAMPLER_CENTS)}</span>
            <span className="btn-secondary border-white text-white">View →</span>
          </div>
        </Link>
      </div>
    </section>
  );
}
