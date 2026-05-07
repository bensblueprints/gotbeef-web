// Inline SVG logo system. Importing the .svg files would also work,
// but inlining lets us style fill/stroke from a single component.

type Variant = "horizontal" | "stacked" | "wordmark" | "favicon";
type Tone = "white" | "black";

export default function Logo({
  variant = "wordmark",
  tone = "black",
  className = ""
}: { variant?: Variant; tone?: Tone; className?: string }) {
  const fg = tone === "white" ? "#fff" : "#0a0a0a";
  const bg = tone === "white" ? "#0a0a0a" : "transparent";

  if (variant === "wordmark") {
    return (
      <svg viewBox="0 0 1200 240" className={className} aria-label="got beef?" role="img">
        <text x="600" y="180" textAnchor="middle"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontWeight: 900, fontSize: 200, letterSpacing: "-0.03em" }}
          fill={fg}>got beef?</text>
      </svg>
    );
  }

  if (variant === "favicon") {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-label="Got Beef" role="img">
        <rect width="64" height="64" fill="#0a0a0a"/>
        <text x="32" y="50" textAnchor="middle"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontWeight: 900, fontSize: 46, letterSpacing: "-0.04em" }}
          fill="#fff">gb</text>
      </svg>
    );
  }

  if (variant === "stacked") {
    return (
      <svg viewBox="0 0 800 800" className={className} aria-label="got beef? — grass-fed, gluten-free" role="img">
        <rect width="800" height="800" fill="#0a0a0a"/>
        <rect x="80" y="80" width="640" height="640" fill="none" stroke="#fff" strokeWidth="4"/>
        <rect x="100" y="100" width="600" height="600" fill="none" stroke="#fff" strokeWidth="1"/>
        <text x="400" y="370" textAnchor="middle"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontWeight: 900, fontSize: 220, letterSpacing: "-0.03em" }}
          fill="#fff">got</text>
        <text x="400" y="555" textAnchor="middle"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontWeight: 900, fontSize: 220, letterSpacing: "-0.03em" }}
          fill="#fff">beef?</text>
        <line x1="200" y1="610" x2="600" y2="610" stroke="#fff" strokeWidth="2"/>
        <text x="400" y="660" textAnchor="middle"
          style={{ fontFamily: "var(--font-inter), Inter, sans-serif", fontWeight: 800, fontSize: 20, letterSpacing: "0.32em" }}
          fill="#fff">GRASS-FED · GLUTEN-FREE</text>
      </svg>
    );
  }

  // horizontal one-line badge
  return (
    <svg viewBox="0 0 1400 600" className={className} aria-label="got beef?" role="img">
      <rect width="1400" height="600" fill="#0a0a0a"/>
      <rect x="60" y="60" width="1280" height="480" fill="none" stroke="#fff" strokeWidth="4"/>
      <rect x="80" y="80" width="1240" height="440" fill="none" stroke="#fff" strokeWidth="1"/>
      <text x="700" y="370" textAnchor="middle"
        style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontWeight: 900, fontSize: 240, letterSpacing: "-0.03em" }}
        fill="#fff">got beef?</text>
      <line x1="280" y1="430" x2="1120" y2="430" stroke="#fff" strokeWidth="2"/>
      <text x="700" y="480" textAnchor="middle"
        style={{ fontFamily: "var(--font-inter), Inter, sans-serif", fontWeight: 800, fontSize: 20, letterSpacing: "0.34em" }}
        fill="#fff">GRASS-FED · GLUTEN-FREE · NO FILLERS</text>
    </svg>
  );
}
