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
const SECONDI_PER_TAPPA = 0.26;
/** Il tetto: un capo con venti attrezzi non deve far aspettare venti secondi. */
const DURATA_MASSIMA = 5.2;
/**
 * Il dondolio dell'ago, su e giu' come un punto a mano: la fase cresce di
 * sessanta radianti lungo tutta la corsa (una decina di punti), alto quattro
 * unita' della mappa.
 */
const DONDOLII = 60;
const ALTEZZA_DONDOLIO = 4;
/** Quanto avanti si guarda sul filo per sapere dove punta l'ago. */
const ANTICIPO = 2;
/** Mezza unita' di tolleranza: la tappa si accende quando l'ago ci arriva, non dopo. */
const TOLLERANZA_TAPPA = 0.5;

/** Quanto dura la corsa dell'ago su un percorso di tante tappe. */
export function needleDuration(tappe: number): number {
  return Math.min(DURATA_MASSIMA, SECONDI_PER_TAPPA * tappe);
}

/** Il punto del filo che dice la direzione dell'ago, senza uscire dalla fine. */
export function advance(l: number, lunghezza: number): number {
  return Math.min(lunghezza, l + ANTICIPO);
}

/**
 * Il transform dell'ago al punto q della corsa (da 0 a 1): sta in p, punta
 * verso p2 e dondola. Il disegno dell'ago e' verticale, da qui il quarto di
 * giro in piu'.
 */
export function needlePose(q: number, p: MapPoint, p2: MapPoint): string {
  const angolo = (Math.atan2(p2.y - p.y, p2.x - p.x) * 180) / Math.PI + 90;
  const su = Math.sin(q * DONDOLII) * ALTEZZA_DONDOLIO;
  return `translate(${p.x} ${p.y + su}) rotate(${angolo})`;
}

/**
 * Quante tappe ha cucito l'ago arrivato a l lungo il filo, contando da quelle
 * gia' fatte: le soglie sono le lunghezze delle curve parziali, in ordine.
 */
export function sewnStops(soglie: number[], l: number, fatti: number): number {
  let n = fatti;
  while (n < soglie.length && soglie[n] <= l + TOLLERANZA_TAPPA) n++;
  return n;
}

/** Se il puntatore si e' allontanato abbastanza da dove e' stato premuto. */
export function pastThreshold(da: MapPoint, a: MapPoint): boolean {
  return Math.hypot(a.x - da.x, a.y - da.y) >= DRAG_THRESHOLD;
}

/**
 * Un punto dello schermo nelle unita' della mappa, data l'inversa della
 * matrice schermo dell'SVG (i sei numeri di un DOMMatrix 2D).
 */
export function toMapPoint(
  inversa: { a: number; b: number; c: number; d: number; e: number; f: number },
  x: number,
  y: number,
): MapPoint {
  return {
    x: inversa.a * x + inversa.c * y + inversa.e,
    y: inversa.b * x + inversa.d * y + inversa.f,
  };
}
