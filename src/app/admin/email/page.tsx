import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminEmailCapturesPage({
  searchParams
}: {
  searchParams?: { q?: string };
}) {
  const q = (searchParams?.q ?? "").trim();
  const captures = await db.emailCapture.findMany({
    where: q ? { email: { contains: q, mode: "insensitive" } } : undefined,
    orderBy: { createdAt: "desc" },
    take: 500
  });

  const syncedCount = captures.filter(c => c.klaviyoSyncedAt).length;

  return (
    <div>
      <h1 className="font-serif font-black text-4xl tracking-tight mb-8">Email captures</h1>

      <div className="grid grid-cols-3 gap-3 mb-10">
        <Stat label="Total (filtered)" value={captures.length.toString()}/>
        <Stat label="Klaviyo synced" value={syncedCount.toString()}/>
        <Stat label="Marketing opt-in" value={captures.filter(c => c.consentMarketing).length.toString()}/>
      </div>

      <form method="get" className="mb-6 flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by email…"
          className="flex-1 border border-ink/30 bg-white px-3 py-2 text-sm"
        />
        <button type="submit" className="btn-primary">Search</button>
        {q && <a href="/admin/email" className="btn-secondary">Clear</a>}
      </form>

      <div className="border border-ink/15 bg-paper">
        <table className="w-full text-sm">
          <thead className="bg-ink text-white">
            <tr>
              <th className="p-3 text-left text-xs uppercase tracking-wider">Email</th>
              <th className="p-3 text-left text-xs uppercase tracking-wider">Source</th>
              <th className="p-3 text-left text-xs uppercase tracking-wider">Marketing</th>
              <th className="p-3 text-left text-xs uppercase tracking-wider">Klaviyo synced</th>
              <th className="p-3 text-left text-xs uppercase tracking-wider">Captured</th>
            </tr>
          </thead>
          <tbody>
            {captures.map(c => (
              <tr key={c.id} className="border-t border-ink/10">
                <td className="p-3">{c.email}</td>
                <td className="p-3 text-ink/70">{c.source}</td>
                <td className="p-3 font-mono">{c.consentMarketing ? "yes" : "no"}</td>
                <td className="p-3 text-ink/70 font-mono">{c.klaviyoSyncedAt ? c.klaviyoSyncedAt.toLocaleString() : "—"}</td>
                <td className="p-3 text-ink/70">{c.createdAt.toLocaleString()}</td>
              </tr>
            ))}
            {captures.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-ink/60">No captures{q ? ` matching "${q}"` : ""}.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-ink text-white p-4">
      <p className="eyebrow text-white/60">{label}</p>
      <p className="font-serif font-black text-3xl mt-1 tracking-tight font-mono">{value}</p>
    </div>
  );
}
