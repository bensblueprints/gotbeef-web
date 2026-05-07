// Stream the optional bag photo for an approved review.
// 404 if not found, not approved, or no image attached.
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const review = await db.review.findFirst({
    where: { id: params.id, status: "approved" },
    select: { imageData: true, imageType: true }
  });

  if (!review || !review.imageData || !review.imageType) {
    return new Response("Not found", { status: 404 });
  }

  // Prisma returns Bytes as Buffer. The DOM lib's BodyInit type is narrower than what
  // Next.js actually accepts at runtime — cast through unknown to satisfy the checker.
  return new Response(review.imageData as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": review.imageType,
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
