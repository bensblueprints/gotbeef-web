import Link from "next/link";
import { db } from "@/lib/db";
import { formatUSD } from "@/lib/pricing";

const STATUS_LABEL: Record<string, string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  fulfilling: "In fulfillment",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded"
};

export default async function AdminOrdersPage() {
  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { items: true }
  });

  const stats = {
    last24h: orders.filter(o => Date.now() - o.createdAt.getTime() < 86_400_000).length,
    revenueLast24h: orders
      .filter(o => Date.now() - o.createdAt.getTime() < 86_400_000 && o.status !== "pending")
      .reduce((s, o) => s + o.totalCents, 0),
    pending: orders.filter(o => o.status === "fulfilling" || o.status === "paid").length
  };

  return (
    <div>
      <h1 className="font-serif font-black text-4xl tracking-tight mb-8">Orders</h1>

      <div className="grid grid-cols-3 gap-3 mb-10">
        <Stat label="Orders (24h)" value={stats.last24h.toString()}/>
        <Stat label="Revenue (24h)" value={formatUSD(stats.revenueLast24h)}/>
        <Stat label="Awaiting fulfillment" value={stats.pending.toString()}/>
      </div>

      <div className="border border-ink/15 bg-paper">
        <table className="w-full text-sm">
          <thead className="bg-ink text-white">
            <tr>
              <th className="p-3 text-left text-xs uppercase tracking-wider">Order</th>
              <th className="p-3 text-left text-xs uppercase tracking-wider">Customer</th>
              <th className="p-3 text-left text-xs uppercase tracking-wider">Status</th>
              <th className="p-3 text-right text-xs uppercase tracking-wider">Total</th>
              <th className="p-3 text-left text-xs uppercase tracking-wider">Created</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} className="border-t border-ink/10">
                <td className="p-3 font-mono">{o.number}</td>
                <td className="p-3">{o.email}</td>
                <td className="p-3">{STATUS_LABEL[o.status]}</td>
                <td className="p-3 text-right">{formatUSD(o.totalCents)}</td>
                <td className="p-3 text-ink/70">{o.createdAt.toLocaleString()}</td>
                <td className="p-3"><Link href={`/admin/orders/${o.id}`} className="underline">View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <a href="/admin/export.csv" className="btn-secondary">Export CSV →</a>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-ink text-white p-4">
      <p className="eyebrow text-white/60">{label}</p>
      <p className="font-serif font-black text-3xl mt-1 tracking-tight">{value}</p>
    </div>
  );
}
