import { CROSSINGS, BRANCHES } from "@/content/toolbox";
import { NODES } from "./graph";

/**
 * I conti del movimento della mappa: dove sta l'ago, quante tappe ha cucito,
 * quando un clic diventa un trascinamento. Funzioni pure come quelle di
 * grafo.ts: i numeri si provano in un test, gli hook restano DOM e GSAP.
 */

export type MapPoint = { x: number; y: number };
export type Thread = { a: string; b: string; crossing: boolean };

export const THREADS: Thread[] = [
  ...BRANCHES.map(([a, b]) => ({ a, b, crossing: false })),
  ...CROSSINGS.map(([a, b]) => ({ a, b, crossing: true })),
];

/** Dove sta ogni nodo quando nessuno lo tocca: il disegno del server. */
export const restPositions = new Map(NODES.map((n) => [n.id, { x: n.x, y: n.y }]));

/** Oltre questi pixel di schermo un clic diventa un trascinamento. */
export const DRAG_THRESHOLD = 6;

/** Secondi d'ago per ogni tappa: abbastanza per vedere un'etichetta accendersi. */
const SECONDS_PER_STOP = 0.26;
/** Il tetto: un capo con venti attrezzi non deve far aspettare venti secondi. */
const MAX_DURATION = 5.2;
/**
 * Il dondolio dell'ago, su e giu' come un punto a mano: la fase cresce di
 * sessanta radianti lungo tutta la corsa (una decina di punti), alto quattro
 * unita' della mappa.
 */
const SWAY_CYCLES = 60;
const SWAY_HEIGHT = 4;
/** Quanto avanti si guarda sul filo per sapere dove punta l'ago. */
const LOOKAHEAD = 2;
/** Mezza unita' di tolleranza: la tappa si accende quando l'ago ci arriva, non dopo. */
const STOP_TOLERANCE = 0.5;

/** Quanto dura la corsa dell'ago su un percorso di tante tappe. */
export function needleDuration(stops: number): number {
  return Math.min(MAX_DURATION, SECONDS_PER_STOP * stops);
}

/** Il punto del filo che dice la direzione dell'ago, senza uscire dalla fine. */
export function advance(l: number, length: number): number {
  return Math.min(length, l + LOOKAHEAD);
}

/**
 * Il transform dell'ago al punto q della corsa (da 0 a 1): sta in p, punta
 * verso p2 e dondola. Il disegno dell'ago e' verticale, da qui il quarto di
 * giro in piu'.
 */
export function needlePose(q: number, p: MapPoint, p2: MapPoint): string {
  const angle = (Math.atan2(p2.y - p.y, p2.x - p.x) * 180) / Math.PI + 90;
  const lift = Math.sin(q * SWAY_CYCLES) * SWAY_HEIGHT;
  return `translate(${p.x} ${p.y + lift}) rotate(${angle})`;
}

/**
 * Quante tappe ha cucito l'ago arrivato a l lungo il filo, contando da quelle
 * gia' fatte: le soglie sono le lunghezze delle curve parziali, in ordine.
 */
export function sewnStops(thresholds: number[], l: number, done: number): number {
  let n = done;
  while (n < thresholds.length && thresholds[n] <= l + STOP_TOLERANCE) n++;
  return n;
}

/** Se il puntatore si e' allontanato abbastanza da dove e' stato premuto. */
export function pastThreshold(from: MapPoint, to: MapPoint): boolean {
  return Math.hypot(to.x - from.x, to.y - from.y) >= DRAG_THRESHOLD;
}

/**
 * Un punto dello schermo nelle unita' della mappa, data l'inversa della
 * matrice schermo dell'SVG (i sei numeri di un DOMMatrix 2D).
 */
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
