import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { ReviewStatus } from "@prisma/client";
import { flavorBySku } from "@/lib/products";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TABS: { key: ReviewStatus; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" }
];

const BADGE: Record<ReviewStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800"
};

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/account/login");
  if (!(session.user as any).isAdmin) redirect("/");
}

async function approveReview(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id"));
  await db.review.update({
    where: { id },
    data: { status: "approved", approvedAt: new Date() }
  });
  revalidatePath("/admin/reviews");
}

async function rejectReview(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id"));
  await db.review.update({
    where: { id },
    data: { status: "rejected" }
  });
  revalidatePath("/admin/reviews");
}

async function saveNote(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id"));
  const moderationNote = String(formData.get("moderationNote") ?? "").trim() || null;
  await db.review.update({ where: { id }, data: { moderationNote } });
  revalidatePath("/admin/reviews");
}

export default async function AdminReviewsPage({
  searchParams
}: {
  searchParams?: { status?: string };
}) {
  const status = (TABS.find(t => t.key === searchParams?.status)?.key ?? "pending") as ReviewStatus;
  const reviews = await db.review.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
    take: 200
  });

  return (
    <div>
      <h1 className="font-serif font-black text-4xl tracking-tight mb-8">Reviews</h1>

      <nav className="flex gap-1 border-b border-ink/15 mb-6">
        {TABS.map(t => {
          const active = t.key === status;
          return (
            <Link
              key={t.key}
              href={`/admin/reviews?status=${t.key}`}
              className={`px-4 py-2 text-xs uppercase tracking-wider font-semibold ${
                active ? "bg-ink text-white" : "text-ink/60 hover:text-ink"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-4">
        {reviews.map(r => {
          const flavor = flavorBySku(r.flavorSku);
          return (
            <div key={r.id} className="border border-ink/15 bg-paper p-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`${BADGE[r.status]} px-2 py-1 text-xs font-semibold uppercase tracking-wider`}>
                      {r.status}
                    </span>
                    <span className="font-mono text-sm">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                    <span className="text-xs text-ink/60">{r.createdAt.toLocaleString()}</span>
                  </div>
                  <p className="text-sm">
                    <span className="font-semibold">{r.authorName}</span>
                    <span className="text-ink/60"> · {r.authorEmail}</span>
                    <span className="text-ink/60"> · {flavor?.name ?? r.flavorSku}</span>
                  </p>
                  {r.title && <p className="font-serif font-bold text-lg mt-2">{r.title}</p>}
                  <p className="text-sm mt-1 whitespace-pre-wrap">{r.body}</p>
                </div>
                {r.imageData && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={`/api/admin/reviews/${r.id}/image-admin`}
                    alt=""
                    className="w-24 h-24 object-cover border border-ink/15"
                  />
                )}
              </div>

              <form action={saveNote} className="mt-3 flex gap-2">
                <input type="hidden" name="id" value={r.id} />
                <input
                  name="moderationNote"
                  defaultValue={r.moderationNote ?? ""}
                  placeholder="Moderation note (internal)"
                  className="flex-1 border border-ink/30 bg-white px-2 py-1.5 text-sm"
                />
                <button type="submit" className="btn-secondary">Save note</button>
              </form>

              <div className="mt-3 flex gap-2">
                {r.status !== "approved" && (
                  <form action={approveReview}>
                    <input type="hidden" name="id" value={r.id} />
                    <button type="submit" className="btn-primary">Approve</button>
                  </form>
                )}
                {r.status !== "rejected" && (
                  <form action={rejectReview}>
                    <input type="hidden" name="id" value={r.id} />
                    <button type="submit" className="bg-red-700 text-white px-3 py-1 text-xs font-semibold uppercase">
                      Reject
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
        {reviews.length === 0 && (
          <p className="text-ink/60 text-sm border border-ink/15 bg-paper p-6 text-center">
            No {status} reviews.
          </p>
        )}
      </div>
    </div>
  );
}
