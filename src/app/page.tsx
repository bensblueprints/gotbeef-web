import Link from "next/link";
import FlavorCard from "@/components/FlavorCard";
import { FLAVORS } from "@/lib/products";
import { formatUSD, SAMPLER_CENTS, SINGLE_PACK_CENTS } from "@/lib/pricing";
import { shipsThisCopy } from "@/lib/shipping";

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="border-b border-ink">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="eyebrow mb-6">Gourmet Brisket Beef Jerky</p>
            <h1 className="font-serif font-black text-5xl md:text-7xl leading-[0.95] tracking-tight">
              The honest answer to <em className="italic">"got&nbsp;beef?"</em>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-ink/80">
              Hand-cut brisket. All-natural, grass-fed, gluten-free. No fillers, no added MSG, no nitrates. The way jerky should be.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products" className="btn-primary">Shop the flavors</Link>
              <Link href="/products/sampler" className="btn-secondary">Try the sampler — {formatUSD(SAMPLER_CENTS)}</Link>
            </div>
            <p className="mt-6 text-[12px] uppercase tracking-[0.2em] font-semibold text-ink/70">
              <span className="text-ink/50">★</span> {shipsThisCopy()} · Order by Wednesday
            </p>
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-[11px] uppercase tracking-[0.2em] font-semibold text-ink/70">
              <span>★ All-Natural</span>
              <span>★ Gluten-Free</span>
              <span>★ No Added MSG</span>
              <span>★ No Added Nitrates</span>
            </div>
          </div>
          <div className="relative aspect-square bg-bone">
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-3 p-3">
              {FLAVORS.slice(0, 4).map(f => (
                <Link
                  key={f.sku}
                  href={`/products/${f.slug}`}
                  className="relative bg-paper border border-ink/10 hover:border-ink transition-colors overflow-hidden"
                >
                  <img
                    src={f.bagImage}
                    alt={`${f.name} bag`}
                    className="absolute inset-0 w-full h-full object-contain p-3"
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* BUNDLE TIERS */}
      <section className="bg-ink text-white">
        <div className="max-w-7xl mx-auto px-6 py-14 grid md:grid-cols-4 gap-8">
          <div>
            <p className="font-serif font-black text-3xl tracking-tight italic">eat more, save more.</p>
            <p className="mt-3 text-sm text-white/70 max-w-xs">Bundle pricing applies automatically at checkout. Mix &amp; match any flavors.</p>
          </div>
          <BundleTile label="1 Pack" price={SINGLE_PACK_CENTS} note="Standard"/>
          <BundleTile label="2 Packs" price={SINGLE_PACK_CENTS * 2 * 0.9} note="Save 10%" highlight/>
          <BundleTile label="3 Packs" price={SINGLE_PACK_CENTS * 3 * 0.85} note="Save 15%" highlight/>
        </div>
      </section>

      {/* FLAVORS */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-10 border-b border-ink pb-4">
          <div>
            <p className="eyebrow mb-2">The Five</p>
            <h2 className="font-serif font-black text-4xl md:text-5xl tracking-tight">Pick your flavor.</h2>
          </div>
          <Link href="/products" className="hidden md:inline text-[12px] uppercase tracking-[0.18em] font-semibold underline-offset-4 hover:underline">
            Shop all →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FLAVORS.map(f => <FlavorCard key={f.sku} flavor={f}/>)}
          <Link href="/products/sampler" className="bg-ink text-white p-8 flex flex-col justify-between hover:opacity-90">
            <div>
              <p className="eyebrow text-white/60">The 5-Flavor Sampler</p>
              <p className="font-serif font-black text-4xl mt-3 leading-none tracking-tight">One of every flavor.</p>
              <p className="mt-3 text-sm text-white/80 max-w-xs">All five SKUs in a single box. Perfect for trying everything, gifting, or tasting nights.</p>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <span className="font-serif text-3xl font-black">{formatUSD(SAMPLER_CENTS)}</span>
              <span className="btn-secondary border-white text-white">Build the box →</span>
            </div>
          </Link>
        </div>
      </section>

      {/* STORY */}
      <section className="border-y border-ink bg-bone">
        <div className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="eyebrow mb-4">Why Got Beef?</p>
            <p className="font-serif text-3xl md:text-4xl leading-tight tracking-tight">
              Most jerky is sugar, soy, and mystery meat. <em className="italic">We took those out.</em>
            </p>
          </div>
          <div className="space-y-6 text-base leading-relaxed">
            <p>We start with grass-fed brisket — a cut most jerky brands skip because it's expensive. Then we hand-cut it, slow-dry it, and season it with the shortest ingredient list we could write.</p>
            <p>No corn syrup. No soy sauce. No added MSG. No nitrates. Nothing on the bag you can't pronounce.</p>
            <Link href="/our-beef" className="inline-block underline underline-offset-4 font-semibold">Read our story →</Link>
          </div>
        </div>
      </section>
    </>
  );
}

function BundleTile({ label, price, note, highlight }: { label: string; price: number; note: string; highlight?: boolean }) {
  return (
    <div className={`p-6 ${highlight ? "border border-white" : "border border-white/20"}`}>
      <p className="eyebrow text-white/60">{note}</p>
      <p className="font-serif font-black text-3xl mt-2 tracking-tight">{label}</p>
      <p className="mt-3 text-2xl font-semibold">{formatUSD(price)}</p>
    </div>
  );
}
