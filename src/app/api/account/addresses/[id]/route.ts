import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const Patch = z.object({
  name: z.string().min(1).optional(),
  line1: z.string().min(1).optional(),
  line2: z.string().optional().nullable(),
  city: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  postalCode: z.string().min(1).optional(),
  country: z.string().optional(),
  phone: z.string().optional().nullable(),
  isDefault: z.boolean().optional()
});

async function ensureOwner(id: string, userId: string) {
  const a = await db.address.findUnique({ where: { id }, select: { userId: true } });
  if (!a || a.userId !== userId) return false;
  return true;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  if (!(await ensureOwner(params.id, userId))) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  try {
    const input = Patch.parse(await req.json());
    if (input.isDefault) {
      await db.address.updateMany({ where: { userId, NOT: { id: params.id } }, data: { isDefault: false } });
    }
    await db.address.update({
      where: { id: params.id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.line1 !== undefined ? { line1: input.line1 } : {}),
        ...(input.line2 !== undefined ? { line2: input.line2 || null } : {}),
        ...(input.city !== undefined ? { city: input.city } : {}),
        ...(input.state !== undefined ? { state: input.state } : {}),
        ...(input.postalCode !== undefined ? { postalCode: input.postalCode } : {}),
        ...(input.country !== undefined ? { country: input.country } : {}),
        ...(input.phone !== undefined ? { phone: input.phone || null } : {}),
        ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {})
      }
    });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  if (!(await ensureOwner(params.id, userId))) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  try {
    // Soft-detach by setting userId null (Address has SetNull on User delete and FK is nullable);
    // but for user-driven delete we'll fully remove if not referenced by orders.
    const refs = await db.order.count({
      where: {
        OR: [{ shippingAddressId: params.id }, { billingAddressId: params.id }]
      }
    });
    if (refs > 0) {
      await db.address.update({ where: { id: params.id }, data: { userId: null } });
    } else {
      await db.address.delete({ where: { id: params.id } });
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
