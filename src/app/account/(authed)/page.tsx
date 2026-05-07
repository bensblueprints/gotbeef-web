import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatUSD } from "@/lib/pricing";

export const metadata = { title: "Your orders" };

const STATUS_LABEL: Record<string, string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  fulfilling: "Being packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded"
};

const TRACK_URL: Record<string, (n: string) => string> = {
  usps: n => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${n}`,
  ups: n => `https://www.ups.com/track?tracknum=${n}`,
  fedex: n => `https://www.fedex.com/fedextrack/?trknbr=${n}`,
  dhl: n => `https://www.dhl.com/global-en/home/tracking.html?tracking-id=${n}`
};

export default async function OrdersPage() {
  const session = await auth();
  const orders = await db.order.findMany({
    where: { userId: session!.user!.id },
    orderBy: { createdAt: "desc" },
    include: { items: true }
  });

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
        <Link href="/account/addresses" className="border border-ink/15 bg-paper p-4 hover:border-ink transition-colors">
          <p className="eyebrow text-ink/50">Addresses</p>
          <p className="font-serif font-black text-lg tracking-tight mt-1">Shipping book</p>
        </Link>
        <Link href="/account/profile" className="border border-ink/15 bg-paper p-4 hover:border-ink transition-colors">
          <p className="eyebrow text-ink/50">Profile</p>
          <p className="font-serif font-black text-lg tracking-tight mt-1">Name & email</p>
        </Link>
        <Link href="/account/preferences" className="border border-ink/15 bg-paper p-4 hover:border-ink transition-colors">
          <p className="eyebrow text-ink/50">Email</p>
          <p className="font-serif font-black text-lg tracking-tight mt-1">Preferences</p>
        </Link>
        <Link href="/account/reviews" className="border border-ink/15 bg-paper p-4 hover:border-ink transition-colors">
          <p className="eyebrow text-ink/50">Reviews</p>
          <p className="font-serif font-black text-lg tracking-tight mt-1">Yours</p>
        </Link>
      </div>

      <h1 className="font-serif font-black text-4xl tracking-tight">Your orders</h1>
      {orders.length === 0 ? (
        <div className="mt-12 text-center py-12 border border-ink/10">
          <p className="text-ink/70 mb-6">You haven't placed an order yet.</p>
          <Link href="/products" className="btn-primary">Shop the flavors</Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map(o => (
            <div key={o.id} className="border border-ink/15 bg-paper p-5">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="eyebrow text-ink/50">Order {o.number}</p>
                  <p className="font-serif font-black text-xl tracking-tight mt-1">{STATUS_LABEL[o.status]}</p>
                  <p className="text-sm text-ink/60 mt-1">
                    {o.createdAt.toLocaleDateString()} · {o.items.length} item{o.items.length === 1 ? "" : "s"} · {formatUSD(o.totalCents)}
                  </p>
                </div>
                <div className="flex gap-3">
                  {o.trackingNumber && o.trackingCarrier && TRACK_URL[o.trackingCarrier.toLowerCase()] && (
                    <a target="_blank" rel="noreferrer"
                      href={TRACK_URL[o.trackingCarrier.toLowerCase()](o.trackingNumber)}
                      className="btn-secondary">
                      Track →
                    </a>
                  )}
                  <Link href={`/account/orders/${o.id}`} className="btn-secondary">View</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
