import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
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
  }),
  marketingOptIn: z.boolean().optional()
});

async function uniqueOrderNumber(): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const num = "GB-" + Math.floor(100000 + Math.random() * 900000);
    const exists = await db.order.findUnique({ where: { number: num }, select: { id: true } });
    if (!exists) return num;
  }
  throw new Error("Could not generate order number");
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;
    const input = Body.parse(await req.json());
    const totals = priceCart(input.lines);
    const totalCents = totals.subtotalCents + totals.shippingCents;

    const order = await db.order.create({
      data: {
        number: await uniqueOrderNumber(),
        email: input.email.toLowerCase(),
        ...(userId ? { user: { connect: { id: userId } } } : {}),
        subtotalCents: totals.subtotalCents,
        bundleDiscountCents: totals.bundleDiscountCents,
        shippingCents: totals.shippingCents,
        taxCents: 0,
        totalCents,
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

    await db.order.update({
      where: { id: order.id },
      data: { airwallexIntentId: intent.id }
    });

    if (input.marketingOptIn) {
      await db.emailCapture.upsert({
        where: { email: input.email.toLowerCase() },
        create: { email: input.email.toLowerCase(), source: "checkout", consentMarketing: true },
        update: { source: "checkout", consentMarketing: true }
      }).catch(() => {});
    }

    const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const checkoutUrl = `${site}/checkout/pay?order=${order.id}`;
    return NextResponse.json({
      ok: true,
      orderId: order.id,
      orderNumber: order.number,
      intent: intent.id,
      checkoutUrl
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
