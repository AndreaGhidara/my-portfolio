import { describe, it, expect } from "vitest";
import { THREAD_ANCHORS } from "@/components/thread/anchors";
import { PARAM } from "../param";
import { campiona, curva, filo, segmenti, strada, type Misura, type Punto } from "../strada";

/**
 * Un impaginato finto ma realistico: quattro disegni alternati, la coda in
 * fondo. Sono le stesse misure con cui girava verifica.mjs nel prototipo, ed e'
 * quello script che questo file porta dentro la suite. Ha gia' trovato tre
 * difetti che a occhio non si vedevano — una spline che sparava fuori, un
 * cappio che faceva risalire la freccia sopra lo schermo, e posizioni misurate
 * una volta sola: merita di girare in CI, non a mano.
 */
const MONDO = { w: 1100, h: 3600 };
const CODA = { top: 2900, h: 700 };
const MISURE: Misura[] = [
  { cx: 0.72 * MONDO.w, cy: 420, h: 300, lato: "dx" },
  { cx: 0.28 * MONDO.w, cy: 1120, h: 300, lato: "sx" },
  { cx: 0.72 * MONDO.w, cy: 1820, h: 300, lato: "dx" },
  { cx: 0.28 * MONDO.w, cy: 2520, h: 300, lato: "sx" },
];

const tracciato = () => strada(MISURE, CODA, MONDO, PARAM, true);
const puntiCampionati = () => campiona(segmenti(tracciato().punti), 0.01);

/**
 * Quanto risale il tracciato, separando le due cose: prima della coda non deve
 * risalire per niente, nella coda deve risalire parecchio.
 *
 * La misura e' CUMULATIVA e non fra due campioni consecutivi: la prima stesura
 * di questa verifica leggeva 2px e passava, mentre il tracciato risaliva di
 * 150. E' il difetto che una prova scritta male non vede — e passa lo stesso.
 */
function risalite(): { prima: number; coda: number } {
  const { punti: P, indiceCoda } = tracciato();
  const segs = segmenti(P);
  let prevY: number | null = null;
  let corsa = 0;
  let dove = 0;
  let prima = 0;
  let coda = 0;
  const chiudi = () => {
    if (corsa > 0) {
      if (dove < indiceCoda) prima = Math.max(prima, corsa);
      else coda = Math.max(coda, corsa);
    }
    corsa = 0;
  };
  segs.forEach((s, si) => {
    for (const [, y] of campiona([s], 0.01)) {
      if (prevY !== null) {
        if (y < prevY) {
          if (corsa === 0) dove = si;
          corsa += prevY - y;
        } else chiudi();
      }
      prevY = y;
    }
  });
  chiudi();
  return { prima, coda };
}

describe("la spline", () => {
  it("passa per tutti i punti che le si danno", () => {
    const P: Punto[] = [[0, 0], [100, 50], [40, 200], [300, 260]];
    const campioni = campiona(segmenti(P), 0.01);
    for (const p of P) {
      const vicino = Math.min(...campioni.map((c) => Math.hypot(c[0] - p[0], c[1] - p[1])));
      expect(vicino).toBeLessThan(1);
    }
  });

  it("e' centripeta: su punti a distanze molto diverse non spara fuori", () => {
    // Il difetto vero, quello per cui la centripeta esiste. Con la Catmull-Rom
    // UNIFORME la tangente in un punto non tiene conto di quanto distano i
    // vicini: accanto a un segmento corto la stima diventa enorme e la curva
    // esce dalla scatola dei punti. Qui i due gruppi distano 20px e 800px.
    const P: Punto[] = [[0, 0], [20, 10], [40, 20], [840, 40], [860, 50]];
    const campioni = campiona(segmenti(P), 0.005);
    const xs = campioni.map((c) => c[0]);
    const ys = campioni.map((c) => c[1]);
    expect(Math.min(...xs)).toBeGreaterThan(-60);
    expect(Math.max(...xs)).toBeLessThan(920);
    expect(Math.min(...ys)).toBeGreaterThan(-60);
    expect(Math.max(...ys)).toBeLessThan(110);
  });

  it("produce un `d` che comincia con M e prosegue a cubiche", () => {
    const P: Punto[] = [[0, 0], [10, 10], [20, 0]];
    const d = curva(P);
    expect(d.startsWith("M0.00 0.00")).toBe(true);
    expect(d.split("C")).toHaveLength(3);
  });
});

describe("la strada della freccia", () => {
  it("parte in alto a destra, dentro l'inquadratura", () => {
    // Prima partiva a -5,5% dell'altezza, cioe' fuori: all'inizio non indicava
    // niente perche' non c'era niente da vedere. Il primo fotogramma della
    // scena e' lei ferma che indica gia' il primo disegno.
    const { punti: P, nomi } = tracciato();
    expect(nomi[0]).toBe("partenza");
    expect(P[0][1]).toBeGreaterThan(0);
    expect(P[0][0]).toBeGreaterThan(MONDO.w * 0.6);
  });

  it("ha un punto per ogni disegno, e sta sul suo disegno", () => {
    const { punti: P, indiciDisegno } = tracciato();
    expect(indiciDisegno).toHaveLength(MISURE.length);
    // Prima degli scostamenti il punto E' il centro; dopo, gli scostamenti lo
    // spostano — ed e' voluto, sono le correzioni a mano. Qui si verifica che
    // ogni disegno abbia il suo punto e che nessuno sia finito da un'altra parte.
    indiciDisegno.forEach((i, k) => {
      const d = Math.hypot(P[i][0] - MISURE[k].cx, P[i][1] - MISURE[k].cy);
      expect(d, `il punto del disegno ${k + 1} e' lontano dal disegno`).toBeLessThan(MONDO.w * 0.65);
    });
  });

  it("esce dove esce il filo, e il numero non e' scritto a mano", () => {
    const { punti: P, nomi } = tracciato();
    expect(nomi[nomi.length - 1]).toBe("coda.fine");
    expect(P[P.length - 1][0]).toBeCloseTo((MONDO.w * THREAD_ANCHORS.practice.out) / 100, 6);
    expect(P[P.length - 1][1]).toBe(MONDO.h);
  });

  it("non risale MAI prima della coda", () => {
    expect(risalite().prima).toBeLessThan(25);
  });

  it("nella coda risale, ed e' il 180 voluto", () => {
    // Una risalita qui NON e' un difetto: e' il disegno. Distinguere le due e'
    // l'unico modo di avere una prova che significhi qualcosa.
    expect(risalite().coda).toBeGreaterThan(150);
  });

  it("resta dentro in orizzontale", () => {
    // Il rischio §6.2 della spec: in prototipo sborda di 124px a sinistra fra
    // la seconda e la terza voce. La tolleranza dichiarata qui E' la decisione:
    // se un giorno si stringe, si stringe questo numero e la strada lo segue.
    const xs = puntiCampionati().map((p) => p[0]);
    expect(Math.min(...xs)).toBeGreaterThan(-140);
    expect(Math.max(...xs)).toBeLessThan(MONDO.w + 20);
  });

  it("non sale mai sopra la partenza", () => {
    const ys = puntiCampionati().map((p) => p[1]);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(30);
  });

  it("sotto i 900px gli scostamenti non si applicano", () => {
    // Li' i blocchi si impilano, i disegni stanno da tutt'altra parte, e una
    // correzione da mezzo schermo non corregge: sposta.
    const nudo = strada(MISURE, CODA, MONDO, PARAM, false);
    const i = nudo.indiciDisegno[1];
    expect(nudo.punti[i][0]).toBe(MISURE[1].cx);
    expect(nudo.punti[i][1]).toBe(MISURE[1].cy);
  });
});

describe("il filo della scena", () => {
  it("entra e esce agli ancoraggi dichiarati", () => {
    const F = filo(MISURE, CODA, MONDO);
    expect(F[0][1]).toBe(0);
    expect(F[F.length - 1][0]).toBeCloseTo((MONDO.w * THREAD_ANCHORS.practice.out) / 100, 6);
    expect(F[F.length - 1][1]).toBe(MONDO.h);
  });

  it("serpeggia: passa da una parte e dall'altra della mezzeria", () => {
    const F = filo(MISURE, CODA, MONDO);
    const lati = F.slice(1, 1 + MISURE.length).map((p) => Math.sign(p[0] - MONDO.w / 2));
    expect(new Set(lati).size).toBe(2);
  });

  it("e' deterministico: due chiamate danno lo stesso filo", () => {
    // L'irregolarita' viene da un LCG seminato, come le sagome del tavolo. Con
    // Math.random() il filo cambierebbe a ogni render e non sarebbe provabile.
    expect(filo(MISURE, CODA, MONDO)).toEqual(filo(MISURE, CODA, MONDO));
  });
});
