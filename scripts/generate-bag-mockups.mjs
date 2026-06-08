/**
 * Generate photoreal bag mockups via fal.ai Nano Banana Pro (edit + references).
 *
 * Uses site logo + per-flavor bag SVG as reference images.
 *
 * Usage:
 *   set FAL_KEY=your_fal_api_key
 *   node scripts/export-bag-refs.mjs
 *   node scripts/generate-bag-mockups.mjs
 *   node scripts/generate-bag-mockups.mjs simply-bar-b
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "images", "bags-photo");
const REFS_DIR = path.join(ROOT, "public", "images", "refs");
const PROMPTS_FILE = path.join(__dirname, "bag-mockup-prompts.json");

const MODEL = "fal-ai/nano-banana-pro/edit";

const positional = [];
for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (!arg.startsWith("-")) positional.push(arg);
}

const FAL_KEY = process.env.FAL_KEY || process.env.FAL_API_KEY;
const filterSlug = positional[0] ?? null;

if (!FAL_KEY) {
  console.error("Missing FAL_KEY. Get one at https://fal.ai/dashboard/keys");
  process.exit(1);
}

const prompts = JSON.parse(fs.readFileSync(PROMPTS_FILE, "utf8"));
const jobs = filterSlug ? prompts.filter((p) => p.slug === filterSlug) : prompts;

if (jobs.length === 0) {
  console.error(`No prompt for slug: ${filterSlug}`);
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const refCache = new Map();

function refAsDataUri(filePath) {
  if (refCache.has(filePath)) return refCache.get(filePath);
  const buf = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mime = ext === ".png" ? "image/png" : ext === ".svg" ? "image/svg+xml" : "application/octet-stream";
  const uri = `data:${mime};base64,${buf.toString("base64")}`;
  refCache.set(filePath, uri);
  return uri;
}

function buildPrompt(job, styleMatch = false) {
  const lines = [
    "Ultra-photorealistic ecommerce product photo on a pure white studio background.",
    styleMatch
      ? "Image 1 is the CANONICAL bag design — copy its layout pixel-for-pixel: matte black stand-up pouch, top logo box, GOURMET BRISKET BEEF JERKY line, large serif flavor name, CLEAR RECTANGULAR WINDOW with thin white border (not a full-width photo banner), ingredients line, four white-outlined badge boxes in a row, USDA seal bottom-left, Net Wt 3 oz center, gotbeef.us bottom."
      : "Keep the EXACT same packaging design, layout, proportions, typography placement, badge positions, USDA seal, and black matte stand-up pouch structure as the reference bag image.",
    "Use the Got Beef logo reference for the top label (white serif \"got beef?\" and GRASS-FED · GLUTEN-FREE).",
    `Change ONLY the large center flavor name to: "${job.name}".`,
    `Inside the clear rectangular window ONLY, show photorealistic hand-cut brisket beef jerky: ${job.jerky}.`,
    "Do NOT use a full-width photographic strip across the bag. Jerky must appear ONLY inside the small clear window like the canonical reference.",
    "Soft shadow under bag, 85mm packshot, no hands, no props.",
  ];
  return lines.join(" ");
}

async function falEdit(prompt, imageUrls) {
  const res = await fetch(`https://fal.run/${MODEL}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${FAL_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      image_urls: imageUrls,
      num_images: 1,
      aspect_ratio: "3:4",
      resolution: "2K",
      output_format: "png",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`fal.ai ${res.status}: ${text}`);
  }

  const data = await res.json();
  const url = data?.images?.[0]?.url ?? data?.image?.url;
  if (!url) throw new Error(`No image URL: ${JSON.stringify(data).slice(0, 500)}`);
  return url;
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${res.status}`);
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

// Ensure PNG refs exist
const masterLayout = path.join(REFS_DIR, "bag-master-layout.png");
const logoPng = path.join(REFS_DIR, "logo-horizontal.png");
if (!fs.existsSync(masterLayout) || !fs.existsSync(logoPng)) {
  console.log("Rasterizing SVG references...");
  const { execSync } = await import("child_process");
  execSync("node scripts/export-bag-refs.mjs", { cwd: ROOT, stdio: "inherit" });
}

console.log(`Model: ${MODEL}`);
console.log(`Output: ${OUT_DIR}\n`);

const logoUrl = refAsDataUri(logoPng);
// Canonical photoreal style (clear window layout) — use Simply Bar-B as line reference
const styleMaster = path.join(OUT_DIR, "bag-simply-bar-b-photo.png");
const masterUrl = fs.existsSync(styleMaster)
  ? refAsDataUri(styleMaster)
  : refAsDataUri(masterLayout);
console.log(`Style master: ${fs.existsSync(styleMaster) ? "bag-simply-bar-b-photo.png" : "bag-master-layout.png"}\n`);

for (const job of jobs) {
  const dest = path.join(OUT_DIR, job.output);
  const flavorRef = path.join(REFS_DIR, job.referenceSvg.replace(".svg", ".png"));
  if (!fs.existsSync(flavorRef)) {
    console.error(`Missing ref: ${flavorRef} — run node scripts/export-bag-refs.mjs`);
    continue;
  }

  console.log(`→ ${job.name} (${job.slug})`);
  try {
    const flavorUrl = refAsDataUri(flavorRef);
    const useStyleMatch = job.slug === "salt-and-pepper" || positional.includes("--match-style");
    const prompt = buildPrompt(job, useStyleMatch);
    const imageUrl = await falEdit(prompt, [masterUrl, logoUrl, flavorUrl]);
    await download(imageUrl, dest);
    console.log(`  ✓ ${dest}\n`);
  } catch (e) {
    console.error(`  ✗ ${e.message}\n`);
  }
}

console.log("Done.");
