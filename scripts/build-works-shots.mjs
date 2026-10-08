import sharp from "sharp";
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const SRC = "assets-source/works";
const OUT = "public/works";
const MANIFEST = "src/content/works-shots.ts";

// Da PNG di quasi un mega a un WebP da 1600px, che copre il dossier anche a 2x,
// piu' un LQIP in base64 nel manifesto: viaggia nell'HTML, il riquadro non e' mai vuoto.
const WIDTH = 1600;
const QUALITY = 72;

// Sotto una sfocatura basta la macchia di colore giusta.
const LQIP_WIDTH = 20;

// Per schermata: si scaricano solo aprendo un dossier, ma un sorgente fuori misura deve notarsi.
const MAX_KB = 90;

await mkdir(OUT, { recursive: true });

const sources = (await readdir(SRC)).filter((f) => f.endsWith(".png")).sort();
if (sources.length === 0) {
  console.error(`Nessun PNG in ${SRC}.`);
  process.exit(1);
}

const entries = [];
let overBudget = false;

for (const file of sources) {
  const name = path.basename(file, ".png");
  const inPath = path.join(SRC, file);
  const outPath = path.join(OUT, `${name}.webp`);

  const info = await sharp(inPath)
    .resize({ width: WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 6 })
    .toFile(outPath);

  const lqip = await sharp(inPath)
    .resize({ width: LQIP_WIDTH })
    .webp({ quality: 40 })
    .toBuffer();

  const { size } = await stat(outPath);
  const kb = size / 1024;
  if (kb > MAX_KB) overBudget = true;

  entries.push({
    src: `/works/${name}.webp`,
    width: info.width,
    height: info.height,
    blurDataURL: `data:image/webp;base64,${lqip.toString("base64")}`,
  });

  console.log(
    `${name.padEnd(14)} ${info.width}x${info.height}  ${kb.toFixed(1)} KB` +
      `  (lqip ${lqip.length} B)`,
  );
}

const manifest = `// GENERATO da scripts/build-works-shots.mjs con \`npm run assets\`: non si modifica a mano.
// Fuori da works.ts perche' misure e anteprima le decide il PNG, non la redazione.
export type WorkShot = {
  src: string;
  width: number;
  height: number;
  blurDataURL: string;
};

export const workShots: Record<string, WorkShot> = {
${entries
  .map(
    (e) => `  "${e.src}": {
    src: "${e.src}",
    width: ${e.width},
    height: ${e.height},
    blurDataURL:
      "${e.blurDataURL}",
  },`,
  )
  .join("\n")}
};

// Meglio un errore che un dossier aperto su un riquadro rotto.
export function shotBySrc(src: string): WorkShot {
  const shot = workShots[src];
  if (!shot) {
    throw new Error(
      \`Schermata sconosciuta: \${src}. Manca da assets-source/works, oppure non e' stato lanciato "npm run assets".\`,
    );
  }
  return shot;
}
`;

await writeFile(MANIFEST, manifest, "utf8");
console.log(`\n${MANIFEST} riscritto: ${entries.length} schermate.`);

if (overBudget) {
  console.error(`Almeno una schermata supera i ${MAX_KB} KB.`);
  process.exit(1);
}
