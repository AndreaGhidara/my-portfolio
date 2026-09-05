import { THREAD_ANCHORS } from "@/components/thread/anchors";
import type { Param } from "./param";

export type Punto = readonly [number, number];

/** Dove sta un disegno, adesso, misurato dalla scena. */
export type Misura = { cx: number; cy: number; h: number; lato: "dx" | "sx" };

/** Il blocco vuoto in fondo, dove la freccia fa il suo 180. */
export type Coda = { top: number; h: number };

export type Mondo = { w: number; h: number };

export type Strada = {
  punti: Punto[];
  /** I punti sono indicizzati per NOME e non per indice: cosi' gli scostamenti
   *  restano attaccati al punto giusto anche se domani il tracciato ne guadagna
   *  uno. */
  nomi: string[];
  indiciDisegno: number[];
  /** Da quale punto comincia la coda: prima di li' la discesa e' monotona. */
  indiceCoda: number;
};

export type Segmento = readonly [Punto, Punto, Punto, Punto];

/**
 * Lo stesso generatore di scripts/build-desk.mjs: seme fisso, cosi'
 * l'irregolarita' e' identica a ogni caricamento. E' duplicato e non importato
 * perche' `src` non importa da `scripts` — quello e' un attrezzo di build, non
 * una dipendenza dell'applicazione.
 */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => (((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1);
}

/** Dove esce il filo di questa scena, in frazione della larghezza. Il numero
 *  non si scrive a mano: e' l'ancora con cui la sezione si aggancia ai Lavori. */
export const USCITA = THREAD_ANCHORS.practice.out / 100;

/**
 * Catmull-Rom CENTRIPETA (alfa 0,5), non uniforme.
 *
 * Con la versione uniforme la tangente in un punto e' (p2-p0)/6 senza tener
 * conto di QUANTO distano: fra un disegno e l'altro ci sono settecento pixel e
 * fra due punti ravvicinati un centinaio, e accanto ai segmenti corti la stima
 * diventa enorme — la curva spara fuori, torna indietro, sale. Erano quelli gli
 * scostamenti a destra e sinistra, su e giu' che si vedevano scorrendo.
 *
 * La centripeta pesa ogni tangente con la radice della distanza, ed e' l'unica
 * delle tre varianti che NON produce cuspidi ne' cappi involontari su punti
 * distribuiti male. E' il motivo per cui esiste.
 */
export function segmenti(punti: readonly Punto[]): Segmento[] {
  if (punti.length < 2) return [];
  const A = 0.5;
  const d = (a: Punto, b: Punto) =>
    Math.max(1e-4, Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1]), A));

  const out: Segmento[] = [];
  for (let i = 0; i < punti.length - 1; i++) {
    const p0 = punti[i - 1] ?? punti[i];
    const p1 = punti[i];
    const p2 = punti[i + 1];
    const p3 = punti[i + 2] ?? punti[i + 1];
    const d1 = d(p0, p1);
    const d2 = d(p1, p2);
    const d3 = d(p2, p3);
    const d1q = d1 * d1;
    const d2q = d2 * d2;
    const d3q = d3 * d3;
    const b1: number[] = [];
    const b2: number[] = [];
    for (let k = 0; k < 2; k++) {
      b1[k] =
        (d1q * p2[k] - d2q * p0[k] + (2 * d1q + 3 * d1 * d2 + d2q) * p1[k]) / (3 * d1 * (d1 + d2));
      b2[k] =
        (d3q * p1[k] - d2q * p3[k] + (2 * d3q + 3 * d3 * d2 + d2q) * p2[k]) / (3 * d3 * (d3 + d2));
    }
    const c1: Punto = [b1[0], b1[1]];
    const c2: Punto = [b2[0], b2[1]];
    out.push([p1, c1, c2, p2]);
  }
  return out;
}

/** Il `d` di un path SVG. */
export function curva(punti: readonly Punto[]): string {
  const segs = segmenti(punti);
  if (segs.length === 0) return "";
  const n = (v: number) => v.toFixed(2);
  let d = `M${n(punti[0][0])} ${n(punti[0][1])}`;
  for (const [, b1, b2, p2] of segs) {
    d += ` C${n(b1[0])} ${n(b1[1])}, ${n(b2[0])} ${n(b2[1])}, ${n(p2[0])} ${n(p2[1])}`;
  }
  return d;
}

/**
 * Campiona le cubiche. Serve alle PROVE, e non al disegno: in pagina la
 * lunghezza d'arco la da' getPointAtLength su un path vero, che e' preciso e
 * gratis. Qui non c'e' un browser, ed e' esattamente il punto di questo modulo.
 */
export function campiona(segs: readonly Segmento[], passo = 0.01): Punto[] {
  const out: Punto[] = [];
  for (const s of segs) {
    for (let t = 0; t <= 1 + 1e-9; t += passo) {
      const u = 1 - t;
      out.push([
        u * u * u * s[0][0] + 3 * u * u * t * s[1][0] + 3 * u * t * t * s[2][0] + t * t * t * s[3][0],
        u * u * u * s[0][1] + 3 * u * u * t * s[1][1] + 3 * u * t * t * s[2][1] + t * t * t * s[3][1],
      ]);
    }
  }
  return out;
}

/**
 * Quale voce e' in fuoco: quella il cui disegno sta piu' vicino al centro
 * dello schermo, oppure -1 se nessuna e' abbastanza vicina.
 *
 * Perche' non lo decide piu' la freccia. Prima si accendeva la voce piu'
 * vicina alla PUNTA, e la punta insegue lo scorrimento con inerzia dopo un
 * ritardo: arrivava sempre in ritardo, e la voce si accendeva quando era gia'
 * scesa sotto la meta' dello schermo. Il fuoco non e' un fatto della freccia,
 * e' un fatto di dove sta guardando chi legge — quindi si misura li'.
 *
 * Staccarli non li fa litigare: la freccia arriva DENTRO una voce gia' accesa
 * invece di trascinarsela dietro, che e' anche il verso giusto del gesto.
 *
 * Sta qui e non dentro il ciclo perche' e' aritmetica pura, e dentro il ciclo
 * nessun test la vedrebbe piu' — e' la lezione del difetto che la review
 * finale ha trovato.
 */
export function inFuoco(
  /** La y del centro di ogni disegno, in coordinate dello SCHERMO. */
  centri: readonly number[],
  /** La y del centro dello schermo. */
  centroSchermo: number,
  /** Oltre questa distanza dal centro non si accende niente: fuori dai due
   *  estremi della scena non c'e' nessuna voce da guardare. */
  soglia: number,
): number {
  let scelta = -1;
  let minima = Infinity;
  centri.forEach((y, k) => {
    const d = Math.abs(y - centroSchermo);
    if (d < minima) {
      minima = d;
      scelta = k;
    }
  });
  return minima <= soglia ? scelta : -1;
}

/**
 * La strada della freccia. Pochi punti e archi larghi: dietro un disegno, poi
 * un punto a meta' che tira la spline sulla retta, poi dietro il disegno
 * successivo dall'altro lato. Senza quel punto di mezzo due disegni su lati
 * opposti darebbero comunque una S — la curva passa per i punti giusti ma ci
 * arriva girando, e «dritta verso la seconda immagine» vuol dire non farlo.
 *
 * La coda non e' un anello: dopo l'ultimo disegno la freccia punta in basso,
 * apre un 180 LARGO mentre scende, rientra al centro e finisce dove finisce il
 * filo. Un anello e' un giro completo e si legge come un'acrobazia; questo e'
 * un cambio di direzione, e chiude invece di stupire.
 */
export function strada(
  misure: readonly Misura[],
  coda: Coda,
  mondo: Mondo,
  param: Param,
  /** Solo sopra i 900px gli scostamenti a mano hanno senso. */
  largo: boolean,
): Strada {
  const punti: Punto[] = [];
  const nomi: string[] = [];
  const indiciDisegno: number[] = [];
  const push = (p: Punto, n: string) => {
    punti.push(p);
    nomi.push(n);
  };
  const N = misure.length;

  // Dentro l'inquadratura, in alto a destra, sopra il primo disegno — che sta a
  // destra anche lui. Da li' lo punta gia': il primo fotogramma della scena e'
  // una freccia ferma che indica.
  push([mondo.w * 0.945, 34], "partenza");

  misure.forEach((g, i) => {
    indiciDisegno.push(punti.length);
    push([g.cx, g.cy], `disegno${i}`);
    if (i < N - 1) {
      const b = misure[i + 1];
      push([g.cx + (b.cx - g.cx) * 0.5, g.cy + (b.cy - g.cy) * 0.5], `mezzo${i}`);
    }
  });

  const indiceCoda = punti.length;
  const ultimo = misure[N - 1];
  const verso = ultimo.lato === "dx" ? 1 : -1;
  push([ultimo.cx, coda.top + coda.h * 0.06], "coda.giu");
  push([ultimo.cx + verso * mondo.w * 0.17, coda.top + coda.h * 0.28], "coda.apre");
  push([mondo.w * 0.5 - verso * mondo.w * 0.13, coda.top + coda.h * 0.54], "coda.colmo");
  push([mondo.w * 0.5, coda.top + coda.h * 0.8], "coda.rientra");
  push([mondo.w * USCITA, mondo.h], "coda.fine");

  // Le correzioni a mano si applicano DOPO che la geometria ha fatto il suo
  // mestiere: la strada resta calcolata dall'impaginato — che si muove quando
  // arrivano i caratteri — e queste sono le correzioni sopra. Salvando posizioni
  // assolute, il primo riflow le butterebbe.
  if (largo) {
    for (let k = 0; k < punti.length; k++) {
      const s = param.scostamenti[nomi[k]];
      if (s) punti[k] = [punti[k][0] + s[0] * mondo.w, punti[k][1] + s[1] * mondo.w];
    }
  }

  return { punti, nomi, indiciDisegno, indiceCoda };
}

/** Il filo: serpentina per tutta la scena, seme suo. Entra e esce agli
 *  ancoraggi, e finisce insieme alla strada. */
export function filo(misure: readonly Misura[], coda: Coda, mondo: Mondo): Punto[] {
  const rf = rng(778899);
  const A = 0.42;
  const F: Punto[] = [[mondo.w * 0.86, 0]];
  for (const g of misure) {
    F.push([mondo.w / 2 + (g.cx - mondo.w / 2) * A * (1 + rf() * 0.28), g.cy + rf() * 0.2 * g.h]);
  }
  const ultimo = misure[misure.length - 1];
  F.push([mondo.w / 2 - (ultimo.cx - mondo.w / 2) * A * 0.7, coda.top + coda.h * 0.45]);
  F.push([mondo.w * USCITA, mondo.h]);
  return F;
}
