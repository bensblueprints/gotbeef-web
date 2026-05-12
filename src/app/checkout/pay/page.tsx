import AirwallexDropIn from "@/components/AirwallexDropIn";
import Link from "next/link";

export default function CheckoutPayPage({
  searchParams,
}: {
  searchParams: { intent?: string; secret?: string; order?: string };
}) {
  const intentId = searchParams.intent ?? "";
  const clientSecret = searchParams.secret ?? "";
  const orderId = searchParams.order ?? "";
  const env = (process.env.AIRWALLEX_ENV ?? "demo") as "demo" | "prod";

  if (!intentId || !clientSecret) {
    return (
      <section className="max-w-2xl mx-auto px-6 py-24 text-center">
        <p className="text-ink/60">Invalid checkout session.</p>
        <Link href="/cart" className="btn-secondary mt-6 inline-block">← Back to cart</Link>
      </section>
    );
  }

  return (
    <section className="max-w-2xl mx-auto px-6 py-16">
      <p className="eyebrow mb-2">Step 3</p>
      <h1 className="font-serif font-black text-4xl tracking-tight mb-8">Payment</h1>
      <AirwallexDropIn intentId={intentId} clientSecret={clientSecret} orderId={orderId} env={env}/>
    </section>
  );
}
