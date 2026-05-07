import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const Body = z.object({
  marketing: z.boolean().optional(),
  orderUpdates: z.boolean().optional(),
  newProducts: z.boolean().optional()
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const input = Body.parse(await req.json());
    const data = {
      marketing: input.marketing ?? true,
      orderUpdates: input.orderUpdates ?? true,
      newProducts: input.newProducts ?? true
    };
    await db.emailPreferences.upsert({
      where: { userId },
      create: { userId, ...data },
      update: {
        ...(input.marketing !== undefined ? { marketing: input.marketing } : {}),
        ...(input.orderUpdates !== undefined ? { orderUpdates: input.orderUpdates } : {}),
        ...(input.newProducts !== undefined ? { newProducts: input.newProducts } : {})
      }
    });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
