import Link from "next/link";
import { db } from "@/lib/db";
import { formatUSD } from "@/lib/pricing";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminCustomersPage() {
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      orders: { select: { totalCents: true, status: true } }
    }
  });

  return (
    <div>
      <h1 className="font-serif font-black text-4xl tracking-tight mb-8">Customers</h1>

      <div className="border border-ink/15 bg-paper">
        <table className="w-full text-sm">
          <thead className="bg-ink text-white">
            <tr>
              <th className="p-3 text-left text-xs uppercase tracking-wider">Email</th>
              <th className="p-3 text-left text-xs uppercase tracking-wider">Name</th>
              <th className="p-3 text-left text-xs uppercase tracking-wider">Role</th>
              <th className="p-3 text-right text-xs uppercase tracking-wider">Orders</th>
              <th className="p-3 text-right text-xs uppercase tracking-wider">Lifetime</th>
              <th className="p-3 text-left text-xs uppercase tracking-wider">Created</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const lifetime = u.orders
                .filter(o => o.status !== "pending" && o.status !== "cancelled" && o.status !== "refunded")
                .reduce((s, o) => s + o.totalCents, 0);
              return (
                <tr key={u.id} className="border-t border-ink/10">
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{u.name ?? "—"}</td>
                  <td className="p-3">
                    {u.isAdmin
                      ? <span className="bg-ink text-white px-2 py-1 text-xs font-semibold uppercase tracking-wider">Admin</span>
                      : <span className="text-ink/60 text-xs uppercase tracking-wider">Customer</span>}
                  </td>
                  <td className="p-3 text-right font-mono">{u.orders.length}</td>
                  <td className="p-3 text-right font-mono">{formatUSD(lifetime)}</td>
                  <td className="p-3 text-ink/70">{u.createdAt.toLocaleDateString()}</td>
                  <td className="p-3"><Link href={`/admin/customers/${u.id}`} className="underline">View</Link></td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr><td colSpan={7} className="p-6 text-center text-ink/60">No customers yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
