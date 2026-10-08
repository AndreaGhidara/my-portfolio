import { INCROCI, RAMI } from "@/content/toolbox";
import { NODI } from "./graph";

/**
 * I conti del movimento della mappa: dove sta l'ago, quante tappe ha cucito,
 * quando un clic diventa un trascinamento. Funzioni pure come quelle di
 * grafo.ts: i numeri si provano in un test, gli hook restano DOM e GSAP.
 */

export type Punto = { x: number; y: number };
export type Filo = { a: string; b: string; incrocio: boolean };

export const FILI: Filo[] = [
  ...RAMI.map(([a, b]) => ({ a, b, incrocio: false })),
  ...INCROCI.map(([a, b]) => ({ a, b, incrocio: true })),
];

/** Dove sta ogni nodo quando nessuno lo tocca: il disegno del server. */
export const riposo = new Map(NODI.map((n) => [n.id, { x: n.x, y: n.y }]));

/** Oltre questi pixel di schermo un clic diventa un trascinamento. */
export const SOGLIA_TRASCINA = 6;

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
export function durataAgo(tappe: number): number {
  return Math.min(DURATA_MASSIMA, SECONDI_PER_TAPPA * tappe);
}

/** Il punto del filo che dice la direzione dell'ago, senza uscire dalla fine. */
export function avanti(l: number, lunghezza: number): number {
  return Math.min(lunghezza, l + ANTICIPO);
}

/**
 * Il transform dell'ago al punto q della corsa (da 0 a 1): sta in p, punta
 * verso p2 e dondola. Il disegno dell'ago e' verticale, da qui il quarto di
 * giro in piu'.
 */
export function posaAgo(q: number, p: Punto, p2: Punto): string {
  const angolo = (Math.atan2(p2.y - p.y, p2.x - p.x) * 180) / Math.PI + 90;
  const su = Math.sin(q * DONDOLII) * ALTEZZA_DONDOLIO;
  return `translate(${p.x} ${p.y + su}) rotate(${angolo})`;
}

/**
 * Quante tappe ha cucito l'ago arrivato a l lungo il filo, contando da quelle
 * gia' fatte: le soglie sono le lunghezze delle curve parziali, in ordine.
 */
export function tappeCucite(soglie: number[], l: number, fatti: number): number {
  let n = fatti;
  while (n < soglie.length && soglie[n] <= l + TOLLERANZA_TAPPA) n++;
  return n;
}

/** Se il puntatore si e' allontanato abbastanza da dove e' stato premuto. */
export function oltreSoglia(da: Punto, a: Punto): boolean {
  return Math.hypot(a.x - da.x, a.y - da.y) >= SOGLIA_TRASCINA;
}

/**
 * Un punto dello schermo nelle unita' della mappa, data l'inversa della
 * matrice schermo dell'SVG (i sei numeri di un DOMMatrix 2D).
 */
export function inMappa(
  inversa: { a: number; b: number; c: number; d: number; e: number; f: number },
  x: number,
  y: number,
): Punto {
  return {
    x: inversa.a * x + inversa.c * y + inversa.e,
    y: inversa.b * x + inversa.d * y + inversa.f,
  };
}
