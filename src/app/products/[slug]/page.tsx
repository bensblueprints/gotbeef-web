import { notFound } from "next/navigation";
import Link from "next/link";
import { FLAVORS, flavorBySlug } from "@/lib/products";
import { formatUSD, SAMPLER_CENTS, SINGLE_PACK_CENTS } from "@/lib/pricing";
import AddToCartBox from "@/components/AddToCartBox";

export async function generateStaticParams() {
  return [...FLAVORS.map(f => ({ slug: f.slug })), { slug: "sampler" }];
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  if (params.slug === "sampler") return <SamplerPage/>;
  const flavor = flavorBySlug(params.slug);
  if (!flavor) notFound();

  return (
    <section className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12">
      <div className="bg-ink aspect-square relative p-12">
        <div className="absolute inset-10 border-2 border-white"/>
        <div className="absolute inset-14 border border-white/40"/>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12">
          <span className="eyebrow text-white/70 mb-3">Gourmet Brisket Beef Jerky</span>
          <span className="font-serif font-black text-white text-5xl leading-none tracking-tight">{flavor.shortName}</span>
          <div className="w-16 h-px bg-white/60 my-6"/>
          <span className="eyebrow text-white">Net Wt 3 oz (85g)</span>
        </div>
      </div>

      <div>
        <Link href="/products" className="text-xs uppercase tracking-[0.2em] hover:opacity-60">← All flavors</Link>
        <p className="eyebrow mt-6 mb-2">Gourmet Brisket Beef Jerky</p>
        <h1 className="font-serif font-black text-5xl md:text-6xl tracking-tight">{flavor.name}</h1>
        <p className="mt-4 text-lg text-ink/80 max-w-md">{flavor.blurb}</p>

        <div className="my-8 rule"/>

        <AddToCartBox sku={flavor.sku} singlePriceCents={SINGLE_PACK_CENTS}/>

        <div className="my-8 rule-soft"/>

        <div>
          <p className="eyebrow mb-3">Ingredients</p>
          <p className="text-sm leading-relaxed">{flavor.ingredients}</p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          {["All-Natural", "Gluten-Free", "No Added MSG", "No Added Nitrates"].map(c => (
            <div key={c} className="border border-ink p-3 text-center text-[11px] uppercase tracking-[0.18em] font-semibold">{c}</div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SamplerPage() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12">
      <div className="bg-ink aspect-square relative p-12">
        <div className="absolute inset-10 border-2 border-white"/>
        <div className="absolute inset-14 border border-white/40"/>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-10">
          <span className="eyebrow text-white/70 mb-3">The Sampler</span>
          <span className="font-serif font-black text-white text-5xl leading-none tracking-tight">One of<br/>every flavor.</span>
          <div className="w-16 h-px bg-white/60 my-6"/>
          <span className="eyebrow text-white">5 × Net Wt 3 oz</span>
        </div>
      </div>

      <div>
        <Link href="/products" className="text-xs uppercase tracking-[0.2em] hover:opacity-60">← All flavors</Link>
        <p className="eyebrow mt-6 mb-2">5-Flavor Sampler</p>
        <h1 className="font-serif font-black text-5xl md:text-6xl tracking-tight">Try everything.</h1>
        <p className="mt-4 text-lg text-ink/80 max-w-md">
          One pack of every flavor in a single box. The fastest way to figure out which one you'll re-order.
        </p>

        <div className="my-8 rule"/>

        <div className="flex items-center gap-6 mb-6">
          <span className="font-serif font-black text-4xl">{formatUSD(SAMPLER_CENTS)}</span>
          <span className="line-through text-ink/40">{formatUSD(SINGLE_PACK_CENTS * 5)}</span>
          <span className="bg-ink text-white text-xs px-2 py-1 font-semibold tracking-wider">SAVE 25%</span>
        </div>
        <AddToCartBox sku="GB-SAMPLER-5" singlePriceCents={SAMPLER_CENTS} isSampler/>

        <div className="my-8 rule-soft"/>

        <div>
          <p className="eyebrow mb-3">What's in the box</p>
          <ul className="space-y-1 text-sm">
            {FLAVORS.map(f => <li key={f.sku}>· 1 × {f.name} (3 oz)</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}
