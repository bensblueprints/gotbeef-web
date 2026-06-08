/** Rasterize logo + bag SVGs to PNG for fal.ai reference uploads. */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Resvg } from "@resvg/resvg-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const REFS_DIR = path.join(ROOT, "public", "images", "refs");

function svgToPng(svgPath, pngPath, width) {
  const svg = fs.readFileSync(svgPath, "utf8");
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: width } });
  fs.writeFileSync(pngPath, resvg.render().asPng());
}

fs.mkdirSync(REFS_DIR, { recursive: true });

const logoSvg = path.join(REFS_DIR, "logo-horizontal.svg");
const masterBagSvg = path.join(ROOT, "public", "images", "bag-salt-and-pepper.svg");

svgToPng(logoSvg, path.join(REFS_DIR, "logo-horizontal.png"), 1400);
svgToPng(masterBagSvg, path.join(REFS_DIR, "bag-master-layout.png"), 1200);

const flavors = [
  "bag-salt-and-pepper",
  "bag-salt-pepper-garlic",
  "bag-serrano-salt-and-pepper",
  "bag-carne-asada",
  "bag-simply-bar-b",
];

for (const name of flavors) {
  const svg = path.join(ROOT, "public", "images", `${name}.svg`);
  svgToPng(svg, path.join(REFS_DIR, `${name}.png`), 1200);
}

console.log("Exported refs to", REFS_DIR);
