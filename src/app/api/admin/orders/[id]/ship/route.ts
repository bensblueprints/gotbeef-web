import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createOrder as createShipStationOrder } from "@/lib/integrations/shipstation";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const order = await db.order.findUnique({
    where: { id: params.id },
    include: { items: true, shippingAddress: true }
  });
  if (!order) return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
  if (!order.shippingAddress) {
    return NextResponse.json({ ok: false, error: "Order has no shipping address" }, { status: 400 });
  }

  try {
    const ss = await createShipStationOrder({
      orderNumber: order.number,
      orderDate: order.createdAt.toISOString(),
      email: order.email,
      subtotalCents: order.subtotalCents,
      shippingCents: order.shippingCents,
      taxCents: order.taxCents,
      shipTo: {
        name: order.shippingAddress.name,
        line1: order.shippingAddress.line1,
        line2: order.shippingAddress.line2 ?? undefined,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        postalCode: order.shippingAddress.postalCode,
        country: order.shippingAddress.country,
        phone: order.shippingAddress.phone ?? undefined
      },
      items: order.items.map(i => ({
        sku: i.sku, name: i.name, quantity: i.qty, unitPriceCents: i.unitPriceCents
      }))
    });
    const updated = await db.order.update({
      where: { id: order.id },
      data: { status: "fulfilling", shipstationOrderId: String(ss.orderId) }
    });
    return NextResponse.json({ ok: true, order: updated });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "ShipStation push failed" }, { status: 500 });
  }
}
