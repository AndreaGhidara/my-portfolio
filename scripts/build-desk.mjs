import { writeFile, mkdir } from "node:fs/promises";

const OUT = "public/brand/desk";

/**
 * Le sette sagome del tavolo. Ventiquattro oggetti da sette forme: la varieta'
 * la fanno la rotazione, la misura e l'etichetta, non una sagoma nuova per ogni
 * voce. Sei sagome diverse in uno strato solo sarebbero un catalogo di icone,
 * che e' esattamente il posto dove questi disegni smettono di essere disegni.
 */
export const SHAPES = {
  sheet:  { w: 150, h: 96,  parts: ["rect", "rules"] },
  // La card e' piu' alta delle altre: le prime 16 unita' sono lo spazio dove
  // vive la linguetta, cosi' che sporga davvero invece di finire tagliata dal
  // viewBox (dove viveva prima di questa correzione).
  card:   { w: 152, h: 78,  parts: ["rect", "tab"] },
  postit: { w: 126, h: 126, parts: ["rect", "curl"] },
  plate:  { w: 118, h: 54,  parts: ["rect", "holes"] },
  rack:   { w: 132, h: 104, parts: ["rect", "units"] },
  phone:  { w: 74,  h: 148, parts: ["rect", "screen"] },
  laptop: { w: 360, h: 240, parts: ["rect", "screen", "hinge"] },
};

/** Spazio in cima al viewBox della card, riservato alla linguetta. */
const CARD_TAB_MARGIN = 16;

/**
 * Generatore lineare congruenziale. Serve UN SOLO numero: che il tremolio sia
 * lo stesso a ogni build. Con Math.random ogni build sporcherebbe il diff di
 * sette file, e nessuno guarderebbe piu' quei diff.
 */
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
}

const round = (n) => +n.toFixed(2);

/**
 * Un rettangolo disegnato a mano: si campiona il perimetro e si sposta ogni
 * punto di un'inezia. Il tratto non chiude mai perfettamente — e' voluto:
 * l'ink-circle del brand non chiude, e questo e' lo stesso gesto.
 */
function wobblyRect(x, y, w, h, random, jitter = 1.6, step = 22) {
  const pts = [];
  const edge = (x1, y1, x2, y2) => {
    const len = Math.hypot(x2 - x1, y2 - y1);
    const n = Math.max(2, Math.round(len / step));
    for (let i = 0; i < n; i++) {
      const t = i / n;
      pts.push([
        round(x1 + (x2 - x1) * t + random() * jitter),
        round(y1 + (y2 - y1) * t + random() * jitter),
      ]);
    }
  };
  edge(x, y, x + w, y);
  edge(x + w, y, x + w, y + h);
  edge(x + w, y + h, x, y + h);
  edge(x, y + h, x, y);
  const [first] = pts;
  return `M${first[0]} ${first[1]} ${pts.slice(1).map(([px, py]) => `L${px} ${py}`).join(" ")} Z`;
}

function wobblyLine(x1, y1, x2, y2, random, jitter = 1.1) {
  const mx = (x1 + x2) / 2 + random() * jitter * 2;
  const my = (y1 + y2) / 2 + random() * jitter * 2;
  return `M${round(x1)} ${round(y1)} Q${round(mx)} ${round(my)} ${round(x2)} ${round(y2)}`;
}

/** Ogni sagoma ha il proprio seme, cosi' aggiungerne una non cambia le altre. */
const SEEDS = { sheet: 11, card: 23, postit: 37, plate: 51, rack: 67, phone: 83, laptop: 97 };

function inner(name, spec, random) {
  const { w, h } = spec;
  const paths = [];
  if (spec.parts.includes("rules")) {
    for (let i = 1; i <= 3; i++) {
      const y = 26 + i * 16;
      paths.push(wobblyLine(14, y, w - 14 - i * 14, y, random));
    }
  }
  if (spec.parts.includes("tab")) {
    // Sporge sopra il bordo del corpo (che qui parte piu' in basso, a
    // CARD_TAB_MARGIN), ma resta dentro il viewBox: sporgere e uscire dal
    // disegno non sono la stessa cosa.
    paths.push(wobblyRect(12, 2, 44, CARD_TAB_MARGIN + 2, random, 1.1, 14));
  }
  if (spec.parts.includes("curl")) {
    // La piega dell'angolo che si solleva: una diagonale corta, appena
    // dentro il bordo, non una linea che lo attraversa e lo supera.
    paths.push(wobblyLine(w - 34, h - 8, w - 8, h - 34, random, 2.2));
  }
  if (spec.parts.includes("holes")) {
    paths.push(wobblyRect(10, 10, 12, 12, random, 0.9, 8));
    paths.push(wobblyRect(w - 22, 10, 12, 12, random, 0.9, 8));
  }
  if (spec.parts.includes("units")) {
    for (let i = 0; i < 4; i++) {
      paths.push(wobblyRect(10, 10 + i * 22, w - 20, 15, random, 1.0, 18));
    }
  }
  if (spec.parts.includes("screen")) {
    paths.push(wobblyRect(9, 9, w - 18, h - (name === "laptop" ? 40 : 18), random, 1.2, 26));
  }
  if (spec.parts.includes("hinge")) {
    paths.push(wobblyLine(9, h - 22, w - 9, h - 22, random, 1.4));
  }
  return paths;
}

export function buildShape(name) {
  const spec = SHAPES[name];
  const random = rng(SEEDS[name]);
  // Solo la card lascia margine in cima, per la linguetta: per tutte le altre
  // il corpo occupa il viewBox intero, come sempre.
  const top = name === "card" ? 2 + CARD_TAB_MARGIN : 2;
  const paths = [
    wobblyRect(2, top, spec.w - 4, spec.h - 2 - top, random),
    ...inner(name, spec, random),
  ];
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${spec.w} ${spec.h}"`,
    ` fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"`,
    ` stroke-linejoin="round" vector-effect="non-scaling-stroke" aria-hidden="true">\n`,
    paths.map((d) => `  <path d="${d}" vector-effect="non-scaling-stroke" />`).join("\n"),
    `\n</svg>\n`,
  ].join("");
}

async function main() {
  await mkdir(OUT, { recursive: true });
  for (const name of Object.keys(SHAPES)) {
    await writeFile(`${OUT}/${name}.svg`, buildShape(name), "utf8");
    console.log(`  ${name}.svg`);
  }
  console.log(`${Object.keys(SHAPES).length} sagome in ${OUT}`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
