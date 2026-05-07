import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const Body = z.object({
  name: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().optional().nullable(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().default("US"),
  phone: z.string().optional().nullable(),
  isDefault: z.boolean().optional()
});

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const input = Body.parse(await req.json());

    if (input.isDefault) {
      await db.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }

    const addr = await db.address.create({
      data: {
        userId,
        name: input.name,
        line1: input.line1,
        line2: input.line2 || null,
        city: input.city,
        state: input.state,
        postalCode: input.postalCode,
        country: input.country || "US",
        phone: input.phone || null,
        isDefault: !!input.isDefault
      }
    });
    return NextResponse.json({ ok: true, id: addr.id });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
