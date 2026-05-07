export const metadata = { title: "FAQ" };

const QA = [
  ["What's the shelf life?", "Sealed pouches keep their quality for 12 months from production. Once opened, refrigerate and eat within 7 days."],
  ["Is this keto / paleo / Whole30 friendly?", "Most flavors fit keto and paleo. Simply Bar-B uses monk fruit (allulose) sweetener — no added sugar but not strict Whole30. Carne Asada and Salt & Pepper variants are Whole30-compatible."],
  ["How is shipping calculated?", "Free shipping on orders over $50. Below that, USPS or UPS rates appear at checkout."],
  ["Where do you ship?", "All 50 U.S. states. International coming soon."],
  ["When will my order ship?", "Within 1 business day of payment. You'll get an email with tracking the moment it leaves the warehouse."],
  ["What's your return policy?", "Not happy? Email hello@gotbeef.us within 30 days and we'll refund or replace it."],
];

export default function FAQ() {
  return (
    <section className="max-w-3xl mx-auto px-6 py-20">
      <p className="eyebrow mb-3">FAQ</p>
      <h1 className="font-serif font-black text-5xl tracking-tight">Questions, answered.</h1>
      <div className="mt-10 divide-y divide-ink/15 border-y border-ink/15">
        {QA.map(([q, a]) => (
          <details key={q} className="py-5 group">
            <summary className="flex justify-between cursor-pointer font-semibold list-none">
              <span>{q}</span>
              <span className="transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-ink/70 leading-relaxed">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
