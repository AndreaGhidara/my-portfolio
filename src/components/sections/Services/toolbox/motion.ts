import { CROSSINGS, BRANCHES } from "@/content/toolbox";
import { NODES } from "./graph";

// Funzioni pure come quelle di graph.ts: i numeri si provano in un test, gli
// hook restano DOM e GSAP.

export type MapPoint = { x: number; y: number };
export type Thread = { a: string; b: string; crossing: boolean };

export const THREADS: Thread[] = [
  ...BRANCHES.map(([a, b]) => ({ a, b, crossing: false })),
  ...CROSSINGS.map(([a, b]) => ({ a, b, crossing: true })),
];

/** Le posizioni del disegno del server. */
export const restPositions = new Map(NODES.map((n) => [n.id, { x: n.x, y: n.y }]));

/** In pixel di schermo, non in unita' della mappa. */
export const DRAG_THRESHOLD = 6;

// Abbastanza per vedere un'etichetta accendersi.
const SECONDS_PER_STOP = 0.26;
// Un capo con venti attrezzi non deve far aspettare venti secondi.
const MAX_DURATION = 5.2;
// Sessanta radianti su tutta la corsa sono una decina di punti, alti quattro unita'.
const SWAY_CYCLES = 60;
const SWAY_HEIGHT = 4;
const LOOKAHEAD = 2;
// La tappa si accende quando l'ago ci arriva, non un fotogramma dopo.
const STOP_TOLERANCE = 0.5;

export function needleDuration(stops: number): number {
  return Math.min(MAX_DURATION, SECONDS_PER_STOP * stops);
}

export function advance(l: number, length: number): number {
  return Math.min(length, l + LOOKAHEAD);
}

// q va da 0 a 1 lungo la corsa. Il disegno dell'ago e' verticale, da qui il
// quarto di giro in piu'.
export function needlePose(q: number, p: MapPoint, p2: MapPoint): string {
  const angle = (Math.atan2(p2.y - p.y, p2.x - p.x) * 180) / Math.PI + 90;
  const lift = Math.sin(q * SWAY_CYCLES) * SWAY_HEIGHT;
  return `translate(${p.x} ${p.y + lift}) rotate(${angle})`;
}

// Le soglie sono le lunghezze delle curve parziali, in ordine; si riparte da
// quelle gia' fatte, quindi il conto non torna mai indietro.
export function sewnStops(thresholds: number[], l: number, done: number): number {
  let n = done;
  while (n < thresholds.length && thresholds[n] <= l + STOP_TOLERANCE) n++;
  return n;
}

export function pastThreshold(from: MapPoint, to: MapPoint): boolean {
  return Math.hypot(to.x - from.x, to.y - from.y) >= DRAG_THRESHOLD;
}

/** `inverse` e' l'inversa di getScreenCTM(): i sei numeri di un DOMMatrix 2D. */
export function toMapPoint(
  inverse: { a: number; b: number; c: number; d: number; e: number; f: number },
  x: number,
  y: number,
): MapPoint {
  return {
    x: inverse.a * x + inverse.c * y + inverse.e,
    y: inverse.b * x + inverse.d * y + inverse.f,
  };
}
