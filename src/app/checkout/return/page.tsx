import Link from "next/link";

export default function CheckoutReturn({ searchParams }: { searchParams: { order?: string } }) {
  return (
    <section className="max-w-2xl mx-auto px-6 py-24 text-center">
      <p className="eyebrow mb-4">Thank you</p>
      <h1 className="font-serif font-black text-6xl tracking-tight">Order received.</h1>
      {searchParams.order && (
        <p className="mt-6 text-ink/70">Order <strong>{searchParams.order}</strong> is being processed.</p>
      )}
      <p className="mt-2 text-ink/70">You'll get a confirmation email in a few minutes, and a tracking email when it ships.</p>
      <div className="mt-10 flex gap-3 justify-center">
        <Link href="/account" className="btn-primary">View your orders</Link>
        <Link href="/products" className="btn-secondary">Keep shopping</Link>
      </div>
    </section>
  );
}
