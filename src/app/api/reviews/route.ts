// Public reviews endpoint. GET /api/reviews?flavorSku=GB-SP-3OZ
// Only returns approved reviews. Image bytes are never inlined — fetch via /api/reviews/:id/image.
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const flavorSku = url.searchParams.get("flavorSku") ?? undefined;

  const reviews = await db.review.findMany({
    where: {
      status: "approved",
      ...(flavorSku ? { flavorSku } : {})
    },
    select: {
      id: true,
      authorName: true,
      flavorSku: true,
      rating: true,
      title: true,
      body: true,
      imageType: true,
      createdAt: true,
      approvedAt: true
    },
    orderBy: [{ approvedAt: "desc" }, { createdAt: "desc" }],
    take: 100
  });

  // imageData not selected — but we surface a hasImage flag derived from imageType.
  const out = reviews.map(r => ({
    id: r.id,
    authorName: r.authorName,
    flavorSku: r.flavorSku,
    rating: r.rating,
    title: r.title,
    body: r.body,
    hasImage: !!r.imageType,
    createdAt: r.createdAt,
    approvedAt: r.approvedAt
  }));

  return Response.json({ reviews: out });
}
