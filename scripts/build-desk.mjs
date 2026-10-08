import { writeFile, mkdir } from "node:fs/promises";

const OUT = "public/brand/desk";

export const SHAPES = {
  sheet:  { w: 150, h: 96,  parts: ["rect", "rules"] },
  // Le prime 16 unita' sono per la linguetta, che altrimenti il viewBox taglia.
  card:   { w: 152, h: 78,  parts: ["rect", "tab"] },
  postit: { w: 126, h: 126, parts: ["rect", "curl"] },
  plate:  { w: 118, h: 54,  parts: ["rect", "holes"] },
  rack:   { w: 132, h: 104, parts: ["rect", "units"] },
  phone:  { w: 74,  h: 148, parts: ["rect", "screen"] },
  laptop: { w: 360, h: 240, parts: ["rect", "screen", "hinge"] },
};

const CARD_TAB_MARGIN = 16;

// Un generatore seminato: con Math.random ogni build sporcherebbe il diff di sette file.
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
}

const round = (n) => +n.toFixed(2);

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

// Un seme per sagoma: aggiungerne una non cambia le altre.
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
    paths.push(wobblyRect(12, 2, 44, CARD_TAB_MARGIN + 2, random, 1.1, 14));
  }
  if (spec.parts.includes("curl")) {
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

// Il primo sorteggio di ogni sagoma, chiamato sia dal contorno sia dal pieno:
// cosi' i due tracciati coincidono. Ridisegnato a parte farebbe un alone.
function outerPath(name, spec, random) {
  const top = name === "card" ? 2 + CARD_TAB_MARGIN : 2;
  return wobblyRect(2, top, spec.w - 4, spec.h - 2 - top, random);
}

export function buildShape(name) {
  const spec = SHAPES[name];
  const random = rng(SEEDS[name]);
  const paths = [
    outerPath(name, spec, random),
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

// Una maschera CSS dipinge un colore solo: il pieno sotto il contorno da' una
// seconda superficie da colorare. Stesso seme e stesso primo sorteggio di
// buildShape, quindi i tracciati combaciano carattere per carattere.
export function buildFill(name) {
  const spec = SHAPES[name];
  const d = outerPath(name, spec, rng(SEEDS[name]));
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${spec.w} ${spec.h}"`,
    ` fill="currentColor" aria-hidden="true">\n`,
    `  <path d="${d}" />`,
    `\n</svg>\n`,
  ].join("");
}

async function main() {
  await mkdir(OUT, { recursive: true });
  for (const name of Object.keys(SHAPES)) {
    await writeFile(`${OUT}/${name}.svg`, buildShape(name), "utf8");
    await writeFile(`${OUT}/${name}-fill.svg`, buildFill(name), "utf8");
    console.log(`  ${name}.svg + ${name}-fill.svg`);
  }
  console.log(`${Object.keys(SHAPES).length} sagome (contorno e pieno) in ${OUT}`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
