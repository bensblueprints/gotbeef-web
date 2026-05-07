import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!(session?.user as any)?.isAdmin) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const review = await db.review.findUnique({
    where: { id: params.id },
    select: { imageData: true, imageType: true }
  });
  if (!review || !review.imageData) {
    return new NextResponse("Not found", { status: 404 });
  }

  const buf = Buffer.from(review.imageData);
  return new NextResponse(buf as any, {
    headers: {
      "Content-Type": review.imageType ?? "application/octet-stream",
      "Cache-Control": "private, no-store"
    }
  });
}
