import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { OrderStatus } from "@prisma/client";

const VALID: OrderStatus[] = [
  "pending", "paid", "fulfilling", "shipped", "delivered", "cancelled", "refunded"
];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  let body: any = {};
  try { body = await req.json(); } catch {}

  const data: {
    status?: OrderStatus;
    trackingNumber?: string | null;
    trackingCarrier?: string | null;
    notes?: string | null;
    shippedAt?: Date;
  } = {};

  if (typeof body.status === "string") {
    if (!VALID.includes(body.status as OrderStatus)) {
      return NextResponse.json({ ok: false, error: "Invalid status" }, { status: 400 });
    }
    data.status = body.status as OrderStatus;
    if (body.status === "shipped") data.shippedAt = new Date();
  }
  if ("trackingNumber" in body) data.trackingNumber = body.trackingNumber ? String(body.trackingNumber) : null;
  if ("trackingCarrier" in body) data.trackingCarrier = body.trackingCarrier ? String(body.trackingCarrier) : null;
  if ("notes" in body) data.notes = body.notes ? String(body.notes) : null;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: false, error: "Nothing to update" }, { status: 400 });
  }

  try {
    const order = await db.order.update({ where: { id: params.id }, data });
    return NextResponse.json({ ok: true, order });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Update failed" }, { status: 500 });
  }
}
