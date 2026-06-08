import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getPaymentIntent } from "@/lib/integrations/airwallex";
import AirwallexDropIn from "@/components/AirwallexDropIn";

export default async function CheckoutPayPage({
  searchParams,
}: {
  searchParams: { order?: string };
}) {
  const orderId = searchParams.order ?? "";
  if (!orderId) {
    return (
      <section className="max-w-2xl mx-auto px-6 py-24 text-center">
        <p className="text-ink/60">Invalid checkout session.</p>
        <Link href="/cart" className="btn-secondary mt-6 inline-block">← Back to cart</Link>
      </section>
    );
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { id: true, number: true, status: true, airwallexIntentId: true, totalCents: true }
  });

  if (!order) {
    return (
      <section className="max-w-2xl mx-auto px-6 py-24 text-center">
        <p className="text-ink/60">Order not found.</p>
        <Link href="/cart" className="btn-secondary mt-6 inline-block">← Back to cart</Link>
      </section>
    );
  }

  if (order.status !== "pending") {
    redirect(`/checkout/return?order=${order.id}`);
  }

  if (!order.airwallexIntentId) {
    return (
      <section className="max-w-2xl mx-auto px-6 py-24 text-center">
        <p className="text-ink/60">Payment session expired. Please checkout again.</p>
        <Link href="/cart" className="btn-secondary mt-6 inline-block">← Back to cart</Link>
      </section>
    );
  }

  let intent;
  try {
    intent = await getPaymentIntent(order.airwallexIntentId);
  } catch {
    return (
      <section className="max-w-2xl mx-auto px-6 py-24 text-center">
        <p className="text-ink/60">Unable to load payment. Try again in a moment.</p>
        <Link href="/cart" className="btn-secondary mt-6 inline-block">← Back to cart</Link>
      </section>
    );
  }

  const env = (process.env.AIRWALLEX_ENV ?? "demo") as "demo" | "prod";

  return (
    <section className="max-w-2xl mx-auto px-6 py-16">
      <p className="eyebrow mb-2">Step 3</p>
      <h1 className="font-serif font-black text-4xl tracking-tight mb-2">Payment</h1>
      <p className="text-sm text-ink/60 mb-8">Order {order.number}</p>
      <AirwallexDropIn
        intentId={intent.id}
        clientSecret={intent.client_secret}
        orderId={order.id}
        env={env}
      />
    </section>
  );
}
