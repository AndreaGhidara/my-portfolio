import sharp from "sharp";
import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";

const SRC = "assets-source";
const OUT = "public/brand";

/** Larghezza di uscita per asset. Il doppio della massima resa a schermo. */
const WIDTHS = {
  "letter-a": 600, "letter-n": 600, "letter-d": 600,
  "letter-r": 600, "letter-e": 600,
  "quote-open": 900, "quote-close": 500,
  "ink-circle": 800, "avatar": 700,
};

const targets = [
  ["letter-a", "letters/a.webp"], ["letter-n", "letters/n.webp"],
  ["letter-d", "letters/d.webp"], ["letter-r", "letters/r.webp"],
  ["letter-e", "letters/e.webp"],
  ["quote-open", "quote-open.webp"], ["quote-close", "quote-close.webp"],
  ["ink-circle", "ink-circle.webp"], ["avatar", "avatar.webp"],
];

/**
 * Il budget di 250 KB della spec riguarda SOLO gli asset della hero:
 * le cinque lettere, ink-circle e avatar. quote-open/quote-close vivono
 * in Services e Works, ben sotto la piega, e non contano per il budget.
 * Non sommarli di nuovo nel totale che decide l'exit code: e' apposta.
 */
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
    // Usata solo come mask-image CSS: al browser serve solo il canale
    // alpha, i canali colore sono a zero e non vale la pena pagarli.
    // alphaQuality alto per non smussare il bordo irregolare del pennello.
    pipeline = pipeline
      .greyscale()
      .webp({ quality: 50, alphaQuality: 95, effort: 6 });
  } else {
    pipeline = pipeline.webp({ quality: 78, effort: 6 });
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
