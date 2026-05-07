import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhook } from "@/lib/integrations/airwallex";
import { createOrder } from "@/lib/integrations/shipstation";
import { sendOrderConfirmation } from "@/lib/email";

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get("x-signature") ?? "";
  const ts = req.headers.get("x-timestamp") ?? "";
  if (!await verifyWebhook(raw, sig, ts)) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }
  const evt = JSON.parse(raw);
  await db.webhookEvent.create({
    data: { source: "airwallex", eventType: evt.name ?? "unknown", payload: evt }
  });

  if (evt.name === "payment_intent.succeeded") {
    const intentId = evt.data?.object?.id;
    const orderId = evt.data?.object?.merchant_order_id;
    if (orderId) {
      const order = await db.order.update({
        where: { id: orderId },
        data: { status: "paid", paidAt: new Date(), airwallexIntentId: intentId },
        include: { items: true, shippingAddress: true }
      });
      // Push to ShipStation
      if (order.shippingAddress) {
        try {
          const ss = await createOrder({
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
          await db.order.update({
            where: { id: order.id },
            data: { status: "fulfilling", shipstationOrderId: String(ss.orderId) }
          });
        } catch (e) {
          console.error("ShipStation push failed", e);
        }
      }
      // Transactional email
      try {
        await sendOrderConfirmation({
          to: order.email,
          orderNumber: order.number,
          totalCents: order.totalCents,
          items: order.items.map(i => ({ name: i.name, qty: i.qty }))
        });
      } catch (e) { console.error("Order email failed", e); }
    }
  }

  await db.webhookEvent.updateMany({
    where: { source: "airwallex", payload: { equals: evt as any }, processedAt: null },
    data: { processedAt: new Date() }
  });
  return NextResponse.json({ ok: true });
}
