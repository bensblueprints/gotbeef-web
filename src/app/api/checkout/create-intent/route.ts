import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { priceCart } from "@/lib/pricing";
import { createPaymentIntent } from "@/lib/integrations/airwallex";
import { flavorBySku } from "@/lib/products";

const Body = z.object({
  email: z.string().email(),
  lines: z.array(z.object({ sku: z.string(), qty: z.number().int().positive(), isSampler: z.boolean().optional() })),
  shipTo: z.object({
    name: z.string(), line1: z.string(), line2: z.string().optional(),
    city: z.string(), state: z.string(), postalCode: z.string(),
    country: z.string().default("US"), phone: z.string().optional()
  })
});

export async function POST(req: NextRequest) {
  try {
    const input = Body.parse(await req.json());
    const totals = priceCart(input.lines);

    // Generate human-friendly order number
    const num = "GB-" + Math.floor(100000 + Math.random() * 900000);
    const order = await db.order.create({
      data: {
        number: num,
        email: input.email,
        subtotalCents: totals.subtotalCents,
        bundleDiscountCents: totals.bundleDiscountCents,
        shippingCents: totals.shippingCents,
        taxCents: 0,
        totalCents: totals.subtotalCents + totals.shippingCents,
        shippingAddress: { create: { ...input.shipTo } },
        items: {
          create: totals.lines.map(l => ({
            sku: l.sku,
            name: l.isSampler ? "5-Flavor Sampler" : (flavorBySku(l.sku)?.name ?? l.sku),
            qty: l.qty,
            unitPriceCents: l.unitPriceCents,
            lineSubtotalCents: l.lineSubtotalCents,
            isSampler: !!l.isSampler
          }))
        }
      }
    });

    const intent = await createPaymentIntent({
      amountCents: order.totalCents,
      orderId: order.id,
      email: input.email
    });

    // Hosted checkout URL pattern (Airwallex Drop-in or hosted page).
    const checkoutUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/pay?intent=${intent.id}&secret=${intent.client_secret}&order=${order.id}`;
    return NextResponse.json({ ok: true, orderId: order.id, intent: intent.id, checkoutUrl });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
