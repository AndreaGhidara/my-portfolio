import { writeFile, mkdir } from "node:fs/promises";

const SIZE = 400;          // viewBox quadrato
const RADIALS = 6;         // fili dritti dall'origine
const RINGS = 7;           // archi concentrici
const SPREAD = Math.PI / 2; // quarto di cerchio: angolo in alto a sinistra
const SAG = 0.16;          // quanto "cede" ogni arco verso l'origine

const angleAt = (i) => (i / (RADIALS - 1)) * SPREAD;
const pointAt = (angle, radius) => [
  +(Math.cos(angle) * radius).toFixed(2),
  +(Math.sin(angle) * radius).toFixed(2),
];

const paths = [];

// Fili radiali: dall'origine verso il bordo.
for (let i = 0; i < RADIALS; i++) {
  const [x, y] = pointAt(angleAt(i), SIZE * 1.05);
  paths.push(`M0 0 L${x} ${y}`);
}

// Archi concentrici: fra due radiali adiacenti, con la corda che cede.
for (let r = 1; r <= RINGS; r++) {
  const radius = (r / RINGS) * SIZE;
  const segments = [];
  for (let i = 0; i < RADIALS - 1; i++) {
    const [x1, y1] = pointAt(angleAt(i), radius);
    const [x2, y2] = pointAt(angleAt(i + 1), radius);
    const mid = (angleAt(i) + angleAt(i + 1)) / 2;
    const [cx, cy] = pointAt(mid, radius * (1 - SAG));
    segments.push(
      i === 0 ? `M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}` : `Q${cx} ${cy} ${x2} ${y2}`,
    );
  }
  paths.push(segments.join(" "));
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true">
${paths.map((d) => `  <path d="${d}" />`).join("\n")}
</svg>
`;

await mkdir("public/brand", { recursive: true });
await writeFile("public/brand/web-corner.svg", svg);
console.log(`web-corner.svg: ${paths.length} path, ${svg.length} byte`);
