import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatUSD } from "@/lib/pricing";
import { createOrder as createShipStationOrder } from "@/lib/integrations/shipstation";
import type { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATUS_OPTIONS: OrderStatus[] = [
  "pending", "paid", "fulfilling", "shipped", "delivered", "cancelled", "refunded"
];

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/account/login");
  if (!(session.user as any).isAdmin) redirect("/");
}

async function updateStatus(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as OrderStatus;
  await db.order.update({ where: { id }, data: { status } });
  revalidatePath(`/admin/orders/${id}`);
}

async function setTracking(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id"));
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim() || null;
  const trackingCarrier = String(formData.get("trackingCarrier") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  await db.order.update({
    where: { id },
    data: { trackingNumber, trackingCarrier, notes }
  });
  revalidatePath(`/admin/orders/${id}`);
}

async function pushToShipStation(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id"));
  const order = await db.order.findUnique({
    where: { id },
    include: { items: true, shippingAddress: true }
  });
  if (!order || !order.shippingAddress) {
    redirect(`/admin/orders/${id}?ss_error=${encodeURIComponent("No shipping address on order")}`);
  }
  let ssOrderId: string | null = null;
  let errMsg: string | null = null;
  try {
    const ss = await createShipStationOrder({
      orderNumber: order!.number,
      orderDate: order!.createdAt.toISOString(),
      email: order!.email,
      subtotalCents: order!.subtotalCents,
      shippingCents: order!.shippingCents,
      taxCents: order!.taxCents,
      shipTo: {
        name: order!.shippingAddress!.name,
        line1: order!.shippingAddress!.line1,
        line2: order!.shippingAddress!.line2 ?? undefined,
        city: order!.shippingAddress!.city,
        state: order!.shippingAddress!.state,
        postalCode: order!.shippingAddress!.postalCode,
        country: order!.shippingAddress!.country,
        phone: order!.shippingAddress!.phone ?? undefined
      },
      items: order!.items.map(i => ({
        sku: i.sku, name: i.name, quantity: i.qty, unitPriceCents: i.unitPriceCents
      }))
    });
    ssOrderId = String(ss.orderId);
    await db.order.update({
      where: { id },
      data: { status: "fulfilling", shipstationOrderId: ssOrderId }
    });
  } catch (e: any) {
    errMsg = e?.message ?? "Push failed";
  }
  revalidatePath(`/admin/orders/${id}`);
  if (errMsg) {
    redirect(`/admin/orders/${id}?ss_error=${encodeURIComponent(errMsg)}`);
  }
  redirect(`/admin/orders/${id}?ss_ok=1`);
}

export default async function AdminOrderDetailPage({
  params, searchParams
}: {
  params: { id: string };
  searchParams?: { ss_error?: string; ss_ok?: string };
}) {
  const order = await db.order.findUnique({
    where: { id: params.id },
    include: { items: true, shippingAddress: true, billingAddress: true, user: true }
  });
  if (!order) notFound();

  const ssError = searchParams?.ss_error;
  const ssOk = searchParams?.ss_ok === "1";

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin" className="text-sm underline">← Back to orders</Link>
      </div>

      <div className="flex items-baseline justify-between mb-8">
        <div>
          <p className="eyebrow">Order</p>
          <h1 className="font-serif font-black text-4xl tracking-tight font-mono">{order.number}</h1>
        </div>
        <p className="text-sm text-ink/70">{order.createdAt.toLocaleString()}</p>
      </div>

      {ssError && (
        <div className="mb-6 border border-red-700 bg-red-50 p-3 text-sm text-red-800">
          ShipStation push failed: {ssError}
        </div>
      )}
      {ssOk && (
        <div className="mb-6 border border-emerald-700 bg-emerald-50 p-3 text-sm text-emerald-800">
          Pushed to ShipStation.
        </div>
      )}

      <div className="grid grid-cols-4 gap-3 mb-10">
        <Stat label="Status" value={order.status}/>
        <Stat label="Subtotal" value={formatUSD(order.subtotalCents)}/>
        <Stat label="Shipping" value={formatUSD(order.shippingCents)}/>
        <Stat label="Total" value={formatUSD(order.totalCents)}/>
      </div>

      {/* Items */}
      <section className="mb-10">
        <p className="eyebrow mb-2">Items</p>
        <div className="border border-ink/15 bg-paper">
          <table className="w-full text-sm">
            <thead className="bg-ink text-white">
              <tr>
                <th className="p-3 text-left text-xs uppercase tracking-wider">SKU</th>
                <th className="p-3 text-left text-xs uppercase tracking-wider">Name</th>
                <th className="p-3 text-right text-xs uppercase tracking-wider">Qty</th>
                <th className="p-3 text-right text-xs uppercase tracking-wider">Unit</th>
                <th className="p-3 text-right text-xs uppercase tracking-wider">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map(it => (
                <tr key={it.id} className="border-t border-ink/10">
                  <td className="p-3 font-mono">{it.sku}</td>
                  <td className="p-3">{it.name}{it.isSampler && <span className="ml-2 text-xs uppercase tracking-wider text-ink/60">Sampler</span>}</td>
                  <td className="p-3 text-right font-mono">{it.qty}</td>
                  <td className="p-3 text-right font-mono">{formatUSD(it.unitPriceCents)}</td>
                  <td className="p-3 text-right font-mono">{formatUSD(it.lineSubtotalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {order.bundleDiscountCents > 0 && (
          <p className="text-xs mt-2 text-ink/60">Bundle discount applied: −{formatUSD(order.bundleDiscountCents)}</p>
        )}
      </section>

      <div className="grid md:grid-cols-2 gap-8 mb-10">
        <section>
          <p className="eyebrow mb-2">Customer</p>
          <div className="border border-ink/15 bg-paper p-4 text-sm">
            <p>{order.email}</p>
            {order.user && <p className="text-ink/70 mt-1">{order.user.name ?? "—"}</p>}
            {order.user && (
              <p className="mt-2 text-xs">
                <Link href={`/admin/customers/${order.user.id}`} className="underline">View customer profile →</Link>
              </p>
            )}
          </div>
        </section>

        <section>
          <p className="eyebrow mb-2">Shipping address</p>
          <div className="border border-ink/15 bg-paper p-4 text-sm">
            {order.shippingAddress ? (
              <>
                <p>{order.shippingAddress.name}</p>
                <p>{order.shippingAddress.line1}</p>
                {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.phone && <p className="text-ink/70 mt-1">{order.shippingAddress.phone}</p>}
              </>
            ) : <p className="text-ink/60">No shipping address</p>}
          </div>
        </section>
      </div>

      {/* Status action */}
      <section className="mb-10">
        <p className="eyebrow mb-2">Update status</p>
        <form action={updateStatus} className="flex gap-2 items-center border border-ink/15 bg-paper p-4">
          <input type="hidden" name="id" value={order.id} />
          <select name="status" defaultValue={order.status} className="border border-ink/30 bg-white px-3 py-2 text-sm">
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button type="submit" className="btn-primary">Save status</button>
        </form>
      </section>

      {/* Tracking + notes */}
      <section className="mb-10">
        <p className="eyebrow mb-2">Tracking & notes</p>
        <form action={setTracking} className="border border-ink/15 bg-paper p-4 grid grid-cols-2 gap-3">
          <input type="hidden" name="id" value={order.id} />
          <label className="text-xs uppercase tracking-wider">
            Carrier
            <input
              name="trackingCarrier"
              defaultValue={order.trackingCarrier ?? ""}
              className="w-full mt-1 border border-ink/30 bg-white px-3 py-2 text-sm normal-case tracking-normal"
              placeholder="USPS / UPS / FedEx"
            />
          </label>
          <label className="text-xs uppercase tracking-wider">
            Tracking number
            <input
              name="trackingNumber"
              defaultValue={order.trackingNumber ?? ""}
              className="w-full mt-1 border border-ink/30 bg-white px-3 py-2 text-sm normal-case tracking-normal font-mono"
            />
          </label>
          <label className="text-xs uppercase tracking-wider col-span-2">
            Notes
            <textarea
              name="notes"
              defaultValue={order.notes ?? ""}
              rows={3}
              className="w-full mt-1 border border-ink/30 bg-white px-3 py-2 text-sm normal-case tracking-normal"
            />
          </label>
          <div className="col-span-2">
            <button type="submit" className="btn-primary">Save</button>
          </div>
        </form>
      </section>

      {/* Push to ShipStation */}
      <section className="mb-10">
        <p className="eyebrow mb-2">ShipStation</p>
        <div className="border border-ink/15 bg-paper p-4 text-sm">
          {order.shipstationOrderId ? (
            <p className="mb-3">SS Order ID: <span className="font-mono">{order.shipstationOrderId}</span></p>
          ) : (
            <p className="mb-3 text-ink/70">Not yet pushed to ShipStation.</p>
          )}
          <form action={pushToShipStation}>
            <input type="hidden" name="id" value={order.id} />
            <button type="submit" className="btn-secondary">
              {order.shipstationOrderId ? "Re-push to ShipStation" : "Push to ShipStation"}
            </button>
          </form>
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
