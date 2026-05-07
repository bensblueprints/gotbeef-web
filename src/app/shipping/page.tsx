import Link from "next/link";
import ShipBanner from "@/components/ShipBanner";

export const metadata = {
  title: "Shipping",
  description: "Got Beef ships every Friday. Order by Wednesday 11:59pm CT. Free shipping over $50."
};

export default function ShippingPage() {
  return (
    <section className="max-w-3xl mx-auto px-6 py-20">
      <p className="eyebrow mb-4">Shipping &amp; Fulfillment</p>
      <h1 className="font-serif font-black text-5xl md:text-6xl leading-[0.95] tracking-tight">
        We ship once a week. <em className="italic">On purpose.</em>
      </h1>
      <p className="mt-6 text-lg text-ink/80 leading-relaxed">
        Most jerky brands sit in a warehouse for months. We don't. Every Got Beef order leaves our kitchen on a Friday so what arrives at your door is as close to fresh-cut as mail-order jerky can be.
      </p>

      <div className="my-10">
        <ShipBanner tone="ink" note="Order by Wednesday 11:59pm Central to make this Friday's run. Anything later goes out the following Friday."/>
      </div>

      <div className="rule my-12"/>

      <div className="space-y-12">
        <Block
          eyebrow="The Schedule"
          title="Friday-only fulfillment."
        >
          <p>We hand-cut and dry brisket on a weekly cycle. Packing happens Thursday. Carrier pickup is Friday morning, Central Time. There's no hidden weekend cutoff — what you see is what you get:</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>· <strong>Order Mon–Wed</strong> → ships <strong>this Friday</strong>.</li>
            <li>· <strong>Order Thu–Sun</strong> → ships <strong>next Friday</strong>.</li>
            <li>· The exact ship date for your cart is shown in checkout.</li>
          </ul>
        </Block>

        <Block
          eyebrow="Packaging"
          title="Resealable, oxygen-purged, no nonsense."
        >
          <p>
            Each 3 oz bag is a foil-laminated stand-up pouch with an oxygen absorber and a resealable zip. No plastic clamshells, no cardboard sleeves you'll throw away in 30 seconds. The bag stays good in the pantry for 6 months sealed; once opened, finish it within two weeks (you will).
          </p>
        </Block>

        <Block
          eyebrow="Carriers &amp; Transit"
          title="USPS Ground Advantage and UPS Ground."
        >
          <p>We ship via USPS Ground Advantage by default — usually 2–5 business days within the continental US once it leaves us on Friday. Larger orders may ship UPS Ground (similar transit times). You'll get a tracking email the second the label scans.</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>· <strong>West Coast → West Coast:</strong> ~2–3 business days</li>
            <li>· <strong>Cross-country:</strong> ~3–5 business days</li>
            <li>· <strong>AK / HI / PR:</strong> ~4–7 business days</li>
          </ul>
        </Block>

        <Block
          eyebrow="Free Shipping"
          title="Free over $50. Always."
        >
          <p>Spend $50 or more in a single order and shipping is on us — no code needed, no surprise add-ons at checkout. The sampler ($55) qualifies. So does any 3-pack bundle.</p>
        </Block>

        <Block
          eyebrow="Returns"
          title="If something's wrong, we'll fix it."
        >
          <p>
            We don't accept returns on a perishable product (the FDA has opinions about that), but if a bag arrives damaged or doesn't meet your expectations, email{" "}
            <Link href="/contact" className="underline underline-offset-4 font-semibold">our team</Link>{" "}
            within 14 days and we'll make it right — replacement, credit, or refund. Your call.
          </p>
        </Block>
      </div>

      <div className="rule my-12"/>

      <div className="flex flex-wrap gap-3">
        <Link href="/products" className="btn-primary">Shop the flavors</Link>
        <Link href="/contact" className="btn-secondary">Questions? Ask us →</Link>
      </div>
    </section>
  );
}

function Block({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="eyebrow mb-2" dangerouslySetInnerHTML={{ __html: eyebrow }}/>
      <h2 className="font-serif font-black text-3xl md:text-4xl tracking-tight mb-3">{title}</h2>
      <div className="text-base leading-relaxed text-ink/85">{children}</div>
    </div>
  );
}
