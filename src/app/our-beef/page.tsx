import Link from "next/link";
export const metadata = { title: "Our Beef" };

export default function OurBeefPage() {
  return (
    <section className="max-w-4xl mx-auto px-6 py-20">
      <p className="eyebrow mb-3">Our Beef</p>
      <h1 className="font-serif font-black text-5xl md:text-7xl tracking-tight leading-[0.95]">
        Brisket. Grass-fed. <em className="italic">Hand-cut.</em>
      </h1>

      <div className="mt-12 grid md:grid-cols-2 gap-12 text-base leading-relaxed">
        <div>
          <p className="eyebrow mb-2">The cut</p>
          <p>Most jerky brands buy whatever lean trim is cheapest. We use brisket — the cut you'd find in a great BBQ joint. It's marbled enough to stay tender after drying, and structured enough to hold a real bite.</p>
        </div>
        <div>
          <p className="eyebrow mb-2">The cattle</p>
          <p>100% grass-fed, raised on open pasture in the U.S. No grain finishing, no growth hormones, no antibiotics.</p>
        </div>
        <div>
          <p className="eyebrow mb-2">The process</p>
          <p>We slice the brisket by hand, marinate in our short ingredient list, and slow-dry it. No dehydrator shortcuts. No artificial smoke flavor.</p>
        </div>
        <div>
          <p className="eyebrow mb-2">What's not in it</p>
          <p>No corn syrup. No soy sauce. No added MSG. No nitrates. No "natural flavors" hiding the real ones. If you can't pronounce it, it's not in the bag.</p>
        </div>
      </div>

      <div className="mt-16 border-t border-ink pt-10 text-center">
        <Link href="/products" className="btn-primary">Shop the flavors →</Link>
      </div>
    </section>
  );
}
