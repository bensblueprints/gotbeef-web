import Link from "next/link";
import { shipsThisCopy } from "@/lib/shipping";

export default function CheckoutReturn({ searchParams }: { searchParams: { order?: string } }) {
  return (
    <section className="max-w-2xl mx-auto px-6 py-24 text-center">
      <p className="eyebrow mb-4">Thank you</p>
      <h1 className="font-serif font-black text-6xl tracking-tight">Order received.</h1>
      <p className="mt-6 font-serif font-black text-2xl md:text-3xl tracking-tight">
        {shipsThisCopy()}.
      </p>
      {searchParams.order && (
        <p className="mt-4 text-ink/70">Order <strong>{searchParams.order}</strong> is being processed.</p>
      )}
      <p className="mt-2 text-ink/70">
        Confirmation email is on its way. We'll send tracking the moment your bag goes out the door.
      </p>
      <div className="mt-10 flex gap-3 justify-center">
        <Link href="/account" className="btn-primary">View your orders</Link>
        <Link href="/products" className="btn-secondary">Keep shopping</Link>
      </div>
    </section>
  );
}
