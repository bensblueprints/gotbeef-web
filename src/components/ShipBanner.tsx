// Reusable Friday-ship copy with brand-tight eyebrow + bold headline.
import { shipsThisCopy } from "@/lib/shipping";

type Tone = "ink" | "bone" | "compact";

export default function ShipBanner({ tone = "bone", note }: { tone?: Tone; note?: string }) {
  const copy = shipsThisCopy();

  if (tone === "compact") {
    return (
      <p className="text-[12px] uppercase tracking-[0.18em] font-semibold">
        <span className="text-ink/60">Next dispatch ·</span> <span>{copy}</span>
      </p>
    );
  }

  if (tone === "ink") {
    return (
      <div className="bg-ink text-white p-5 border border-white/10">
        <p className="eyebrow text-white/60 mb-2">Fulfillment</p>
        <p className="font-serif font-black text-2xl tracking-tight leading-tight">{copy}</p>
        <p className="mt-2 text-xs text-white/70">
          {note ?? "We ship every Friday so jerky arrives at peak freshness. Order by Wednesday 11:59pm CT."}
        </p>
      </div>
    );
  }

  return (
    <div className="border border-ink p-5 bg-paper">
      <p className="eyebrow mb-2">Fulfillment</p>
      <p className="font-serif font-black text-2xl tracking-tight leading-tight">{copy}</p>
      <p className="mt-2 text-xs text-ink/70">
        {note ?? "We ship every Friday so jerky arrives at peak freshness. Order by Wednesday 11:59pm CT."}
      </p>
    </div>
  );
}
