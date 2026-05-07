import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatUSD } from "@/lib/pricing";
import { nextShipIsoDate, formatShipDateLong, nextShipDate } from "@/lib/shipping";
import { flavorBySku } from "@/lib/products";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/account/login");
  if (!(session.user as any).isAdmin) redirect("/");
}

async function markBatchShipped(formData: FormData) {
  "use server";
  await requireAdmin();
  const orderId = String(formData.get("orderId"));
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim();
  const trackingCarrier = String(formData.get("trackingCarrier") ?? "").trim() || null;
  if (!trackingNumber) {
    redirect(`/admin/shipping?err=${encodeURIComponent("Tracking number required")}`);
  }
  await db.order.update({
    where: { id: orderId },
    data: {
      status: "shipped",
      shippedAt: new Date(),
      trackingNumber,
      trackingCarrier
    }
  });
  revalidatePath("/admin/shipping");
}

export default async function AdminShippingPage({
  searchParams
}: {
  searchParams?: { err?: string };
}) {
  const fridayIso = nextShipIsoDate();
  const fridayLabel = formatShipDateLong(nextShipDate());

  const orders = await db.order.findMany({
    where: { status: { in: ["paid", "fulfilling"] } },
    orderBy: { createdAt: "asc" },
    include: { items: true, shippingAddress: true }
  });

  // Aggregate bag count per SKU.
  const bagsBySku = new Map<string, number>();
  let totalBags = 0;
  for (const o of orders) {
    for (const it of o.items) {
      const qty = it.isSampler ? it.qty * 5 : it.qty;
      bagsBySku.set(it.sku, (bagsBySku.get(it.sku) ?? 0) + qty);
      totalBags += qty;
    }
  }
  // Group sampler-equivalents by individual flavor: V1 keep as-is; sampler shows as one SKU.

  const subtotalCents = orders.reduce((s, o) => s + o.totalCents, 0);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <div>
          <p className="eyebrow">Shipping Friday</p>
          <h1 className="font-serif font-black text-4xl tracking-tight">{fridayLabel}</h1>
          <p className="text-xs text-ink/60 mt-1 font-mono">{fridayIso}</p>
        </div>
        <a href="/admin/shipping/export.csv" className="btn-secondary">Export CSV →</a>
      </div>

      {searchParams?.err && (
        <div className="mt-4 mb-2 border border-red-700 bg-red-50 p-3 text-sm text-red-800">
          {searchParams.err}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mt-6 mb-10">
        <Stat label="Orders to ship" value={orders.length.toString()}/>
        <Stat label="Total bags" value={totalBags.toString()}/>
        <Stat label="Batch revenue" value={formatUSD(subtotalCents)}/>
      </div>

      <section className="mb-10">
        <p className="eyebrow mb-2">Bag totals (by SKU)</p>
        <div className="border border-ink/15 bg-paper">
          <table className="w-full text-sm">
            <thead className="bg-ink text-white">
              <tr>
                <th className="p-3 text-left text-xs uppercase tracking-wider">SKU</th>
                <th className="p-3 text-left text-xs uppercase tracking-wider">Flavor</th>
                <th className="p-3 text-right text-xs uppercase tracking-wider">Bags</th>
              </tr>
            </thead>
            <tbody>
              {[...bagsBySku.entries()].sort((a, b) => b[1] - a[1]).map(([sku, qty]) => {
                const f = flavorBySku(sku);
                return (
                  <tr key={sku} className="border-t border-ink/10">
                    <td className="p-3 font-mono">{sku}</td>
                    <td className="p-3">{f?.name ?? (sku.includes("SAMPLER") ? "Sampler (5-pack)" : "—")}</td>
                    <td className="p-3 text-right font-mono">{qty}</td>
                  </tr>
                );
              })}
              {bagsBySku.size === 0 && (
                <tr><td colSpan={3} className="p-6 text-center text-ink/60">Nothing to ship this batch.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <p className="eyebrow mb-2">Orders in batch</p>
        <div className="space-y-4">
          {orders.map(o => (
            <div key={o.id} className="border border-ink/15 bg-paper p-4">
              <div className="flex justify-between items-baseline">
                <div>
                  <p className="font-mono font-semibold">{o.number}</p>
                  <p className="text-xs text-ink/70">{o.email} · {o.status}</p>
                </div>
                <p className="text-sm font-mono">{formatUSD(o.totalCents)}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-3 text-sm">
                <div>
                  <p className="eyebrow text-xs mb-1">Ship to</p>
                  {o.shippingAddress ? (
                    <div>
                      <p>{o.shippingAddress.name}</p>
                      <p>{o.shippingAddress.line1}{o.shippingAddress.line2 ? `, ${o.shippingAddress.line2}` : ""}</p>
                      <p>{o.shippingAddress.city}, {o.shippingAddress.state} {o.shippingAddress.postalCode}</p>
                      {o.shippingAddress.phone && <p className="text-ink/70 text-xs">{o.shippingAddress.phone}</p>}
                    </div>
                  ) : <p className="text-ink/60">No address</p>}
                </div>
                <div>
                  <p className="eyebrow text-xs mb-1">Items</p>
                  <ul className="text-xs font-mono space-y-0.5">
                    {o.items.map(it => (
                      <li key={it.id}>{it.qty}× {it.sku}{it.isSampler && " (sampler)"}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <form action={markBatchShipped} className="mt-4 grid grid-cols-[140px_1fr_auto] gap-2 items-end">
                <input type="hidden" name="orderId" value={o.id} />
                <label className="text-xs uppercase tracking-wider">
                  Carrier
                  <input
                    name="trackingCarrier"
                    defaultValue={o.trackingCarrier ?? "USPS"}
                    className="w-full mt-1 border border-ink/30 bg-white px-2 py-1.5 text-sm normal-case tracking-normal"
                  />
                </label>
                <label className="text-xs uppercase tracking-wider">
                  Tracking number
                  <input
                    name="trackingNumber"
                    defaultValue={o.trackingNumber ?? ""}
                    required
                    className="w-full mt-1 border border-ink/30 bg-white px-2 py-1.5 text-sm font-mono normal-case tracking-normal"
                  />
                </label>
                <button type="submit" className="btn-primary">Mark shipped</button>
              </form>
            </div>
          ))}
          {orders.length === 0 && (
            <p className="text-ink/60 text-sm border border-ink/15 bg-paper p-6 text-center">
              No paid or fulfilling orders.
            </p>
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
      <p className="font-serif font-black text-3xl mt-1 tracking-tight font-mono">{value}</p>
    </div>
  );
}
