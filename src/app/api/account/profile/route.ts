import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const Body = z.object({
  name: z.string().min(1).max(120).optional().nullable(),
  email: z.string().email().optional()
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const input = Body.parse(await req.json());

    if (input.email) {
      const lowered = input.email.toLowerCase();
      const existing = await db.user.findUnique({ where: { email: lowered } });
      if (existing && existing.id !== userId) {
        return NextResponse.json({ ok: false, error: "That email is already in use." }, { status: 409 });
      }
      await db.user.update({
        where: { id: userId },
        data: {
          email: lowered,
          ...(input.name !== undefined ? { name: input.name || null } : {})
        }
      });
    } else {
      await db.user.update({
        where: { id: userId },
        data: {
          ...(input.name !== undefined ? { name: input.name || null } : {})
        }
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
