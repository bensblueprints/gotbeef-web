import { notFound } from "next/navigation";
import Link from "next/link";
import { FLAVORS, flavorBySlug } from "@/lib/products";
import { formatUSD, SAMPLER_CENTS, SINGLE_PACK_CENTS } from "@/lib/pricing";
import AddToCartBox from "@/components/AddToCartBox";
import ShipBanner from "@/components/ShipBanner";
import { db } from "@/lib/db";

export async function generateStaticParams() {
  return [...FLAVORS.map(f => ({ slug: f.slug })), { slug: "sampler" }];
}

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: { slug: string } }) {
  if (params.slug === "sampler") return <SamplerPage/>;
  const flavor = flavorBySlug(params.slug);
  if (!flavor) notFound();

  // Approved reviews for this flavor SKU.
  let reviews: {
    id: string; authorName: string; rating: number;
    title: string | null; body: string; hasImage: boolean;
  }[] = [];
  try {
    const rows = await db.review.findMany({
      where: { flavorSku: flavor.sku, status: "approved" },
      select: { id: true, authorName: true, rating: true, title: true, body: true, imageType: true },
      orderBy: [{ approvedAt: "desc" }, { createdAt: "desc" }],
      take: 50
    });
    reviews = rows.map(r => ({
      id: r.id, authorName: r.authorName, rating: r.rating,
      title: r.title, body: r.body, hasImage: !!r.imageType
    }));
  } catch {
    // DB unavailable in some build/preview contexts — fall through with no reviews.
  }

  const avgRating = reviews.length
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : null;

  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <div className="grid md:grid-cols-2 gap-12">
        <div className="bg-bone border border-ink/10 aspect-square relative p-8 md:p-12 flex items-center justify-center">
          <img
            src={flavor.bagImage}
            alt={`${flavor.name} jerky bag`}
            className="max-w-full max-h-full object-contain drop-shadow-[0_25px_30px_rgba(10,10,10,0.15)]"
          />
        </div>

        <div>
          <Link href="/products" className="text-xs uppercase tracking-[0.2em] hover:opacity-60">← All flavors</Link>
          <p className="eyebrow mt-6 mb-2">Gourmet Brisket Beef Jerky</p>
          <h1 className="font-serif font-black text-5xl md:text-6xl tracking-tight">{flavor.name}</h1>
          <p className="mt-4 text-lg text-ink/80 max-w-md">{flavor.blurb}</p>

          {avgRating !== null && (
            <div className="mt-4 flex items-center gap-3">
              <Stars rating={avgRating}/>
              <span className="text-sm text-ink/70">
                {avgRating.toFixed(1)} · {reviews.length} review{reviews.length === 1 ? "" : "s"}
              </span>
            </div>
          )}

          <div className="my-8 rule"/>

          <AddToCartBox sku={flavor.sku} singlePriceCents={SINGLE_PACK_CENTS}/>

          <div className="mt-6">
            <ShipBanner tone="bone"/>
          </div>

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
      </div>

      {/* REVIEWS */}
      <div className="mt-20 border-t border-ink pt-10">
        <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
          <div>
            <p className="eyebrow mb-2">Reviews</p>
            <h2 className="font-serif font-black text-4xl tracking-tight">
              {reviews.length === 0 ? "No reviews yet." : `What people say.`}
            </h2>
          </div>
          <Link
            href={`/account/reviews/new?flavor=${encodeURIComponent(flavor.sku)}`}
            className="btn-secondary"
          >
            Write a review →
          </Link>
        </div>

        {reviews.length === 0 ? (
          <p className="text-ink/70">Be the first to review {flavor.name}.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {reviews.map(r => (
              <article key={r.id} className="border border-ink/15 bg-paper p-6">
                <div className="flex items-center justify-between mb-3">
                  <Stars rating={r.rating}/>
                  <span className="text-[11px] uppercase tracking-[0.18em] font-semibold text-ink/60">{r.authorName}</span>
                </div>
                {r.title && (
                  <p className="font-serif font-black text-xl tracking-tight mb-2">{r.title}</p>
                )}
                <p className="text-sm leading-relaxed text-ink/85 whitespace-pre-wrap">{r.body}</p>
                {r.hasImage && (
                  <img
                    src={`/api/reviews/${r.id}/image`}
                    alt={`${r.authorName} review photo`}
                    className="mt-4 w-full max-h-72 object-cover border border-ink/10"
                  />
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="inline-flex gap-0.5 text-base" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={i <= full ? "text-ink" : "text-ink/20"}>★</span>
      ))}
    </span>
  );
}

function SamplerPage() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12">
      <div className="bg-bone border border-ink/10 aspect-square relative p-6 md:p-8">
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-3 gap-3 p-4">
          {FLAVORS.slice(0, 4).map(f => (
            <div key={f.sku} className="relative bg-paper border border-ink/10">
              <img src={f.bagImage} alt={f.name} className="absolute inset-0 w-full h-full object-contain p-2"/>
            </div>
          ))}
          <div className="relative bg-paper border border-ink/10 col-span-2">
            <img
              src={FLAVORS[4].bagImage}
              alt={FLAVORS[4].name}
              className="absolute inset-0 w-full h-full object-contain p-2"
            />
          </div>
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

        <div className="mt-6">
          <ShipBanner tone="bone"/>
        </div>

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
