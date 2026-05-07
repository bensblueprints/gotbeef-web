import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { flavorBySku } from "@/lib/products";

export const metadata = { title: "Your reviews" };

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending review",
  approved: "Published",
  rejected: "Not published"
};

export default async function ReviewsPage({ searchParams }: { searchParams: { ok?: string } }) {
  const session = await auth();
  const userId = (session!.user as any).id as string;
  const reviews = await db.review.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });
  const ok = searchParams.ok === "1";

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="font-serif font-black text-4xl tracking-tight">Your reviews</h1>
        <Link href="/account/reviews/new" className="btn-primary">Write a review</Link>
      </div>

      {ok && (
        <p className="mt-6 border border-ink bg-ink/5 px-4 py-3 text-sm">
          Thanks — your review was submitted and is awaiting moderation.
        </p>
      )}

      {reviews.length === 0 ? (
        <div className="mt-12 text-center py-12 border border-ink/10">
          <p className="text-ink/70 mb-6">You haven't written a review yet.</p>
          <Link href="/account/reviews/new" className="btn-primary">Write your first review</Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {reviews.map(r => {
            const flavor = flavorBySku(r.flavorSku);
            return (
              <div key={r.id} className="border border-ink/15 bg-paper p-5">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <p className="eyebrow text-ink/50">{flavor?.name ?? r.flavorSku}</p>
                    <p className="font-serif font-black text-xl tracking-tight mt-1">
                      {r.title || `${r.rating}-star review`}
                    </p>
                    <p className="text-sm text-ink/60 mt-1">
                      {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)} · {r.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  <span className={
                    "eyebrow px-3 py-1.5 border " +
                    (r.status === "approved"
                      ? "border-ink bg-ink text-bone"
                      : r.status === "rejected"
                        ? "border-ink/30 text-ink/60"
                        : "border-ink/30 text-ink/70")
                  }>
                    {STATUS_LABEL[r.status]}
                  </span>
                </div>
                <p className="text-sm text-ink/80 mt-4 whitespace-pre-wrap">{r.body}</p>
                {r.moderationNote && r.status === "rejected" && (
                  <p className="text-xs text-ink/60 mt-3 italic">Note: {r.moderationNote}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
