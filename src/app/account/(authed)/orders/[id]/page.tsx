import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatUSD } from "@/lib/pricing";

export default async function OrderDetail({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/account/login");
  const order = await db.order.findUnique({
    where: { id: params.id },
    include: { items: true, shippingAddress: true }
  });
  if (!order || order.userId !== session.user.id) notFound();

  return (
    <div>
      <p className="eyebrow text-ink/50">Order {order.number}</p>
      <h1 className="font-serif font-black text-4xl tracking-tight mt-1">{order.status.toUpperCase()}</h1>

      <div className="mt-8 grid md:grid-cols-2 gap-8">
        <div>
          <p className="eyebrow mb-3">Items</p>
          <div className="space-y-2">
            {order.items.map(i => (
              <div key={i.id} className="flex justify-between text-sm border-b border-ink/10 py-2">
                <span>{i.qty} × {i.name}</span>
                <span>{formatUSD(i.lineSubtotalCents)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatUSD(order.subtotalCents)}</span></div>
            {order.bundleDiscountCents > 0 && (
              <div className="flex justify-between text-emerald-700"><span>Bundle savings</span><span>−{formatUSD(order.bundleDiscountCents)}</span></div>
            )}
            <div className="flex justify-between"><span>Shipping</span><span>{order.shippingCents === 0 ? "FREE" : formatUSD(order.shippingCents)}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>{formatUSD(order.taxCents)}</span></div>
            <div className="flex justify-between font-serif font-black text-2xl mt-2"><span>Total</span><span>{formatUSD(order.totalCents)}</span></div>
          </div>
        </div>
        <div>
          <p className="eyebrow mb-3">Shipping</p>
          {order.shippingAddress && (
            <div className="text-sm leading-relaxed">
              <p className="font-semibold">{order.shippingAddress.name}</p>
              <p>{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
            </div>
          )}
          {order.trackingNumber && (
            <div className="mt-6">
              <p className="eyebrow mb-2">Tracking</p>
              <p className="text-sm font-mono">{order.trackingCarrier} · {order.trackingNumber}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
