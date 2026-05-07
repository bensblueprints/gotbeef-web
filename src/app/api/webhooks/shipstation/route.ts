import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendShipmentNotification } from "@/lib/email";

// ShipStation webhook payload shape:
// { resource_url, resource_type: "SHIP_NOTIFY" | "ITEM_SHIP_NOTIFY", ... }
// We fetch resource_url for the actual shipment record. For V1 we just trust
// the notification and mark the order shipped — adjust once you have HMAC enabled.
export async function POST(req: NextRequest) {
  const evt = await req.json();
  await db.webhookEvent.create({
    data: { source: "shipstation", eventType: evt.resource_type ?? "unknown", payload: evt }
  });

  if (evt.resource_type === "SHIP_NOTIFY" || evt.resource_type === "ITEM_SHIP_NOTIFY") {
    // For V1: ShipStation includes orderNumber + tracking in the resource fetch.
    // Pull and update.
    try {
      const r = await fetch(evt.resource_url, {
        headers: {
          Authorization: "Basic " + Buffer.from(
            `${process.env.SHIPSTATION_API_KEY}:${process.env.SHIPSTATION_API_SECRET}`
          ).toString("base64")
        }
      });
      const data = await r.json();
      const shipments = data?.shipments ?? [data];
      for (const s of shipments) {
        if (!s?.orderNumber) continue;
        const order = await db.order.findFirst({ where: { number: s.orderNumber } });
        if (!order) continue;
        await db.order.update({
          where: { id: order.id },
          data: {
            status: "shipped",
            shippedAt: s.shipDate ? new Date(s.shipDate) : new Date(),
            trackingNumber: s.trackingNumber ?? null,
            trackingCarrier: s.carrierCode ?? null
          }
        });
        if (s.trackingNumber) {
          await sendShipmentNotification({
            to: order.email,
            orderNumber: order.number,
            tracking: s.trackingNumber,
            carrier: s.carrierCode ?? ""
          }).catch(e => console.error("Ship email failed", e));
        }
      }
    } catch (e) {
      console.error("ShipStation webhook handler failed", e);
    }
  }
  return NextResponse.json({ ok: true });
}
