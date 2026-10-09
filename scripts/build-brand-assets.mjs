import sharp from "sharp";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";

const SRC = "assets-source";
const OUT = "public/brand";

// Circa 3x la misura CSS massima: ink-circle arriva a 176px e l'avatar a ~155px,
// quindi 480px bastano anche a 3x.
const WIDTHS = {
  "letter-a": 600, "letter-n": 600, "letter-d": 600,
  "letter-r": 600, "letter-e": 600,
  "quote-open": 900, "quote-close": 500,
  "ink-circle": 480, "avatar": 480,
};

const targets = [
  ["letter-a", "letters/a.webp"], ["letter-n", "letters/n.webp"],
  ["letter-d", "letters/d.webp"], ["letter-r", "letters/r.webp"],
  ["letter-e", "letters/e.webp"],
  ["quote-open", "quote-open.webp"], ["quote-close", "quote-close.webp"],
  ["ink-circle", "ink-circle.webp"], ["avatar", "avatar.webp"],
];

// Il budget di 250 KB vale solo per la hero: le virgolette stanno sotto la piega
// e restano fuori apposta dal totale che decide l'exit code.
const HERO_NAMES = new Set([
  "letter-a", "letter-n", "letter-d", "letter-r", "letter-e",
  "ink-circle", "avatar",
]);

await mkdir(path.join(OUT, "letters"), { recursive: true });

let heroTotal = 0;
let grandTotal = 0;
for (const [name, out] of targets) {
  const inPath = path.join(SRC, `${name}.png`);
  const outPath = path.join(OUT, out);

  let pipeline = sharp(inPath).resize({
    width: WIDTHS[name],
    withoutEnlargement: true,
  });

  if (name === "ink-circle") {
    // Solo mask-image: conta l'alpha, alto per non smussare il bordo del pennello.
    pipeline = pipeline
      .greyscale()
      .webp({ quality: 50, alphaQuality: 95, effort: 6 });
  } else {
    pipeline = pipeline.webp({ quality: 82, effort: 6 });
  }

  const info = await pipeline.toFile(outPath);
  const { size } = await stat(outPath);
  grandTotal += size;
  if (HERO_NAMES.has(name)) heroTotal += size;
  console.log(
    `${out.padEnd(22)} ${info.width}x${info.height}  ${(size / 1024).toFixed(1)} KB`,
  );
}
console.log(`\nHero: ${(heroTotal / 1024).toFixed(1)} KB (budget 250 KB)`);
console.log(`Totale generato: ${(grandTotal / 1024).toFixed(1)} KB`);
if (heroTotal > 250 * 1024) {
  console.error("SUPERATO il budget di 250 KB della spec (hero).");
  process.exit(1);
}
