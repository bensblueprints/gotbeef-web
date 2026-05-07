import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { ReviewStatus } from "@prisma/client";

const VALID: ReviewStatus[] = ["pending", "approved", "rejected"];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  let body: any = {};
  try { body = await req.json(); } catch { /* allow empty */ }

  const data: { status?: ReviewStatus; moderationNote?: string | null; approvedAt?: Date | null } = {};
  if (typeof body.status === "string") {
    if (!VALID.includes(body.status as ReviewStatus)) {
      return NextResponse.json({ ok: false, error: "Invalid status" }, { status: 400 });
    }
    data.status = body.status as ReviewStatus;
    if (body.status === "approved") data.approvedAt = new Date();
  }
  if ("moderationNote" in body) {
    data.moderationNote = body.moderationNote ? String(body.moderationNote) : null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: false, error: "Nothing to update" }, { status: 400 });
  }

  try {
    const review = await db.review.update({ where: { id: params.id }, data });
    return NextResponse.json({ ok: true, review });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Update failed" }, { status: 500 });
  }
}
