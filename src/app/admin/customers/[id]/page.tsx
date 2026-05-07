import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatUSD } from "@/lib/pricing";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminCustomerDetailPage({ params }: { params: { id: string } }) {
  const user = await db.user.findUnique({
    where: { id: params.id },
    include: {
      addresses: { orderBy: { createdAt: "desc" } },
      orders: { orderBy: { createdAt: "desc" }, include: { items: true } },
      emailPrefs: true
    }
  });
  if (!user) notFound();

  const lifetime = user.orders
    .filter(o => o.status !== "pending" && o.status !== "cancelled" && o.status !== "refunded")
    .reduce((s, o) => s + o.totalCents, 0);

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/customers" className="text-sm underline">← Back to customers</Link>
      </div>

      <div className="flex items-baseline justify-between mb-8">
        <div>
          <p className="eyebrow">Customer</p>
          <h1 className="font-serif font-black text-4xl tracking-tight">{user.name ?? user.email}</h1>
          <p className="text-sm text-ink/70 mt-1">{user.email}</p>
        </div>
        {user.isAdmin && (
          <span className="bg-ink text-white px-2 py-1 text-xs font-semibold uppercase tracking-wider">Admin</span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-10">
        <Stat label="Orders" value={user.orders.length.toString()}/>
        <Stat label="Lifetime spend" value={formatUSD(lifetime)}/>
        <Stat label="Joined" value={user.createdAt.toLocaleDateString()}/>
      </div>

      <section className="mb-10">
        <p className="eyebrow mb-2">Addresses</p>
        <div className="border border-ink/15 bg-paper">
          {user.addresses.length === 0 ? (
            <p className="p-4 text-sm text-ink/60">No saved addresses.</p>
          ) : (
            <ul className="divide-y divide-ink/10">
              {user.addresses.map(a => (
                <li key={a.id} className="p-4 text-sm">
                  <div className="flex justify-between">
                    <p className="font-semibold">{a.name}{a.isDefault && <span className="ml-2 text-xs uppercase tracking-wider text-ink/60">Default</span>}</p>
                    <p className="text-ink/70 text-xs">{a.createdAt.toLocaleDateString()}</p>
                  </div>
                  <p>{a.line1}{a.line2 ? `, ${a.line2}` : ""}</p>
                  <p>{a.city}, {a.state} {a.postalCode} {a.country}</p>
                  {a.phone && <p className="text-ink/70 text-xs mt-1">{a.phone}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mb-10">
        <p className="eyebrow mb-2">Orders</p>
        <div className="border border-ink/15 bg-paper">
          <table className="w-full text-sm">
            <thead className="bg-ink text-white">
              <tr>
                <th className="p-3 text-left text-xs uppercase tracking-wider">Order</th>
                <th className="p-3 text-left text-xs uppercase tracking-wider">Status</th>
                <th className="p-3 text-right text-xs uppercase tracking-wider">Items</th>
                <th className="p-3 text-right text-xs uppercase tracking-wider">Total</th>
                <th className="p-3 text-left text-xs uppercase tracking-wider">Created</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {user.orders.map(o => (
                <tr key={o.id} className="border-t border-ink/10">
                  <td className="p-3 font-mono">{o.number}</td>
                  <td className="p-3">{o.status}</td>
                  <td className="p-3 text-right font-mono">{o.items.reduce((s, i) => s + i.qty, 0)}</td>
                  <td className="p-3 text-right font-mono">{formatUSD(o.totalCents)}</td>
                  <td className="p-3 text-ink/70">{o.createdAt.toLocaleDateString()}</td>
                  <td className="p-3"><Link href={`/admin/orders/${o.id}`} className="underline">View</Link></td>
                </tr>
              ))}
              {user.orders.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-ink/60">No orders.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-10">
        <p className="eyebrow mb-2">Email preferences</p>
        <div className="border border-ink/15 bg-paper p-4 text-sm">
          {user.emailPrefs ? (
            <ul className="space-y-1">
              <li>Marketing: <span className="font-mono">{user.emailPrefs.marketing ? "yes" : "no"}</span></li>
              <li>Order updates: <span className="font-mono">{user.emailPrefs.orderUpdates ? "yes" : "no"}</span></li>
              <li>New products: <span className="font-mono">{user.emailPrefs.newProducts ? "yes" : "no"}</span></li>
              <li className="text-ink/60 text-xs mt-2">Updated {user.emailPrefs.updatedAt.toLocaleString()}</li>
            </ul>
          ) : (
            <p className="text-ink/60">No preferences set.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-ink text-white p-4">
      <p className="eyebrow text-white/60">{label}</p>
      <p className="font-serif font-black text-2xl mt-1 tracking-tight font-mono">{value}</p>
    </div>
  );
}
