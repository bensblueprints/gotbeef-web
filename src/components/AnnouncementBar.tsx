// Top-of-page announcement bar. Marketing copy lives here.
const MESSAGES = [
  "SHIPS EVERY FRIDAY · ORDER BY WEDNESDAY",
  "FREE SHIPPING ON ORDERS OVER $50",
  "BUY 2 PACKS · SAVE 10%",
  "BUY 3 PACKS · SAVE 15%",
  "ALL-NATURAL · GRASS-FED · GLUTEN-FREE"
];

export default function AnnouncementBar() {
  // Track is duplicated so the marquee loops seamlessly.
  const track = [...MESSAGES, ...MESSAGES];
  return (
    <div className="bg-ink text-white text-[11px] font-semibold tracking-[0.18em] py-2 overflow-hidden">
      <div className="marquee-track whitespace-nowrap">
        {track.map((m, i) => (
          <span key={i} className="inline-flex items-center gap-4">
            <span className="text-white/60">★</span>
            <span>{m}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
