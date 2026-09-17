import sharp from "sharp";
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const SRC = "assets-source/works";
const OUT = "public/works";
const MANIFEST = "src/content/works-shots.ts";

/**
 * Le schermate dei casi, pronte per il dossier.
 *
 * I sorgenti sono PNG da 1920px e da quasi un mega l'uno. Non li vede mai
 * nessuno: il dossier mostra la schermata dentro un riquadro alto al massimo
 * 34vh, tagliato dall'alto. Un mega di PNG per quel riquadro significa che la
 * cartella si apre e la schermata arriva dopo, ed e' esattamente il difetto
 * che questo script esiste per togliere.
 *
 * Fuori escono due cose per ogni schermata:
 *  - un WebP a 1600px, che a schermo intero su un display 2x copre comunque
 *    l'intera larghezza del dossier;
 *  - un LQIP: la stessa immagine ridotta a 20px e infilata in base64 dentro
 *    il manifesto. Pesa quanto una parola, viaggia nell'HTML e non fa una
 *    richiesta, quindi il riquadro non e' mai vuoto nemmeno al primo frame.
 */
const WIDTH = 1600;
const QUALITY = 72;

/** Larghezza dell'LQIP. Venti pixel: a quella misura non e' piu' un'immagine,
 *  e' la macchia di colore giusta al posto giusto, ed e' tutto quello che
 *  serve sotto a una sfocatura. */
const LQIP_WIDTH = 20;

/** Tetto per singola schermata. Non e' il budget della hero: queste immagini
 *  si scaricano solo quando qualcuno apre un dossier. Serve a non lasciar
 *  passare inosservato un sorgente molto piu' pesante degli altri. */
const MAX_KB = 90;

await mkdir(OUT, { recursive: true });

const sources = (await readdir(SRC)).filter((f) => f.endsWith(".png")).sort();
if (sources.length === 0) {
  console.error(`Nessun PNG in ${SRC}.`);
  process.exit(1);
}

const entries = [];
let oltreIlTetto = false;

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
  if (kb > MAX_KB) oltreIlTetto = true;

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

const manifest = `/**
 * GENERATO da scripts/build-works-shots.mjs. Non si modifica a mano:
 * \`npm run assets\` lo riscrive.
 *
 * Misure e anteprima sfocata delle schermate. Stanno qui e non in works.ts
 * perche' non sono contenuto: works.ts dichiara SE un caso ha una schermata,
 * che e' una decisione editoriale; quanto e' alta e di che colore e' sfocata
 * lo decide il file PNG, e va riscritto ogni volta che il file cambia.
 */
export type WorkShot = {
  src: string;
  width: number;
  height: number;
  /** LQIP a ${LQIP_WIDTH}px in base64: l'anteprima che riempie il riquadro
   *  prima che la schermata vera arrivi. */
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

/**
 * Lancia se la schermata non e' nel manifesto: vuol dire che works.ts punta a
 * un file che non e' mai stato generato, e in quel caso il dossier si aprirebbe
 * su un riquadro rotto. Meglio che non compili.
 */
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

if (oltreIlTetto) {
  console.error(`Almeno una schermata supera i ${MAX_KB} KB.`);
  process.exit(1);
}
