// Got Beef ships every Friday — keeps everything fresh.
// Cutoff: Wednesday 11:59pm Central. Orders placed Mon-Wed → ship the upcoming Friday.
// Orders placed Thu-Sun → ship the following Friday.

const DAY_MS = 24 * 60 * 60 * 1000;

/** Returns the next Friday a given order will ship on, given the cutoff rule. */
export function nextShipDate(now: Date = new Date()): Date {
  // Approximate "Central" by treating the local clock as Central. We don't ship on a
  // schedule precise enough to need TZ libraries; the date in the user's view is what matters.
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = d.getDay(); // 0 Sun .. 6 Sat
  // Days to the *next valid* Friday given the Wed-midnight cutoff:
  //   Sun(0) → Fri this week (5 days)
  //   Mon(1) → Fri this week (4)
  //   Tue(2) → Fri this week (3)
  //   Wed(3) → Fri this week (2)
  //   Thu(4) → Fri next week (8) — past cutoff
  //   Fri(5) → Fri next week (7)
  //   Sat(6) → Fri next week (6)
  const offsets: Record<number, number> = { 0: 5, 1: 4, 2: 3, 3: 2, 4: 8, 5: 7, 6: 6 };
  return new Date(d.getTime() + offsets[day] * DAY_MS);
}

const FMT_LONG = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" });
const FMT_SHORT = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" });

export function formatShipDateLong(d: Date = nextShipDate()): string {
  return FMT_LONG.format(d); // "Friday, May 8"
}

export function formatShipDateShort(d: Date = nextShipDate()): string {
  return FMT_SHORT.format(d); // "Fri, May 8"
}

/** "Ships this Friday, May 8" — ready-to-render copy. */
export function shipsThisCopy(now: Date = new Date()): string {
  return `Ships ${formatShipDateLong(nextShipDate(now))}`;
}

/** Used by admin batch view: ISO date (yyyy-mm-dd) of the upcoming ship Friday. */
export function nextShipIsoDate(now: Date = new Date()): string {
  const d = nextShipDate(now);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
