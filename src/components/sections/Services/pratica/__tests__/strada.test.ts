import { describe, it, expect } from "vitest";
import { THREAD_ANCHORS } from "@/components/thread/anchors";
import { PARAM } from "../param";
import { campiona, curva, filo, inFuoco, segmenti, strada, type Misura, type Pagina, type Punto } from "../strada";

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

/**
 * Quanto la strada ha il permesso di sbordare a sinistra, IN FRAZIONE della
 * larghezza del palco. E' una frazione e non un numero di pixel perche' la
 * sbandata scala con la larghezza: gli scostamenti sono frazioni di `mondo.w`
 * (vedi `strada()`) e i disegni si allontanano dalla mezzeria man mano che il
 * palco si allarga. Un `-140` assoluto qui dichiarava una tolleranza vera a
 * 1100 e nessuna tolleranza in particolare a qualunque altra larghezza — cioe'
 * non misurava niente di stabile. Il valore e' lo stesso di prima, letto per
 * quello che era: 140 su 1100.
 *
 * E' la sede della decisione del rischio §6.2 della spec, che resta aperto: se
 * un giorno si decide di limitare la strada al bordo, si stringe questo numero
 * e la strada lo segue.
 */
const SBORDO = 0.127;

/**
 * La pagina e' piu' larga della scena, e la scena ci sta dentro centrata: e'
 * la situazione vera sopra i 74rem. Tenerle distinte e' il punto di mezza
 * suite — gli ancoraggi si contano sulla PAGINA, i disegni stanno nella SCENA.
 */
const PAGINA: Pagina = { w: 1400, left: (1400 - MONDO.w) / 2 };
const tracciato = () => strada(MISURE, CODA, MONDO, PARAM, true, PAGINA);
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

  it("esce dove esce il filo — sulla PAGINA, non sul percorso", () => {
    // Il difetto che questa prova chiude: contata sul percorso, l'uscita della
    // freccia finiva altrove rispetto a quella del filo, e lo scarto cresceva
    // con lo schermo (97px a 1440, 280 a 1920). In calibrazione era stato
    // corretto a mano trascinando `coda.fine`, che pero' azzecca una larghezza
    // sola. Qui si verifica che combacino per costruzione: la x della strada,
    // riportata in coordinate di pagina, E' quella del filo.
    const { punti: P, nomi } = tracciato();
    expect(nomi[nomi.length - 1]).toBe("coda.fine");
    const suPagina = P[P.length - 1][0] + PAGINA.left;
    expect(suPagina).toBeCloseTo((PAGINA.w * THREAD_ANCHORS.practice.out) / 100, 6);
    expect(P[P.length - 1][1]).toBe(MONDO.h);
  });

  it("l'uscita segue la finestra: piu' larga e' la pagina, piu' a destra esce", () => {
    // La prova che la correzione a mano non puo' dare: contata sul percorso
    // l'uscita sarebbe la stessa a ogni larghezza, che e' esattamente perche'
    // si staccava dal filo.
    const dove = (w: number) => {
      const p = { w, left: Math.max(0, (w - MONDO.w) / 2) };
      const P = strada(MISURE, CODA, MONDO, PARAM, true, p).punti;
      return P[P.length - 1][0] + p.left;
    };
    expect(dove(1600)).toBeGreaterThan(dove(1400));
    expect(dove(1400)).toBeGreaterThan(dove(1200));
  });

  it("non risale MAI prima della coda", () => {
    expect(risalite().prima).toBeLessThan(25);
  });

  it("nella coda risale, ed e' il 180 voluto", () => {
    // Una risalita qui NON e' un difetto: e' il disegno. Distinguere le due e'
    // l'unico modo di avere una prova che significhi qualcosa.
    expect(risalite().coda).toBeGreaterThan(150);
  });

  it("resta dentro in orizzontale, dove ha senso chiederlo", () => {
    // Il rischio §6.2 della spec: in prototipo sborda a sinistra fra la seconda
    // e la terza voce. La tolleranza e' SBORDO, una frazione del palco — vedi
    // la sua nota. A destra non ci va nemmeno vicino (il massimo cade una
    // sessantina di pixel dentro il bordo), e quei 20px sono il franco di una
    // cosa che non succede, non una tolleranza dichiarata.
    // A destra il limite non e' piu' il bordo del percorso: l'uscita si conta
    // sulla PAGINA, quindi su una finestra larga cade fuori dalla colonna del
    // contenuto — deliberatamente, ed e' dove esce anche il filo. Il vincolo
    // vero e' che non superi quel punto.
    const xs = puntiCampionati().map((p) => p[0]);
    const uscita = (PAGINA.w * THREAD_ANCHORS.practice.out) / 100 - PAGINA.left;
    expect(Math.min(...xs)).toBeGreaterThan(-MONDO.w * SBORDO);
    // Il piu' esterno fra i due: la strada vive nel palco, ma la sua uscita puo'
    // cadere fuori, e nella coda gonfia a destra PRIMA di uscire.
    expect(Math.max(...xs)).toBeLessThan(Math.max(MONDO.w, uscita) + 20);
  });

  it("non sale mai sopra la partenza", () => {
    const ys = puntiCampionati().map((p) => p[1]);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(30);
  });

  it("ogni scostamento e' attaccato a un punto che esiste", () => {
    // Il legame fra le chiavi di `PARAM.scostamenti` e i nomi che `strada()`
    // da' ai suoi punti e' scritto in tre commenti e non lo teneva niente. Una
    // chiave che non corrisponde a nessun nome non fallisce: non si applica, in
    // silenzio, e la correzione a mano che qualcuno ha trovato guardando
    // sparisce dal tracciato senza che nulla lo dica. E' il modo in cui una
    // taratura si perde — «indicizzati per nome e non per indice» e' il patto
    // che rende gli scostamenti sopravvivibili a un punto in piu' sulla strada,
    // e vale solo finche' i nomi combaciano davvero.
    const { nomi } = tracciato();
    for (const chiave of Object.keys(PARAM.scostamenti)) {
      expect(nomi, `PARAM.scostamenti.${chiave} non corrisponde a nessun punto`).toContain(chiave);
    }
  });

  it("l'ultima corsa ha due punti liberi, e da fermi non cambiano la forma", () => {
    // Servono al calibratore: fra il rientro al centro e l'uscita c'era un
    // tratto lungo senza niente da afferrare. Nascono sul segmento fra i due
    // estremi, a un terzo e a due terzi — cosi' aggiungerli non sposta la
    // strada, aggiunge solo due maniglie. Se un giorno qualcuno li spostasse
    // fuori da quella retta, la coda cambierebbe forma senza che nessuno
    // l'abbia chiesto, e questa prova e' li' per dirlo.
    // Sulla strada NUDA, senza gli scostamenti a mano: la collinearita' e' una
    // proprieta' della geometria: `coda.rientra` ha una correzione grossa, e
    // dopo di quella nessuno dei tre e' piu' dove la geometria l'aveva messo.
    const { punti: P, nomi } = strada(MISURE, CODA, MONDO, PARAM, false, PAGINA);
    const i = nomi.indexOf("coda.scende");
    const j = nomi.indexOf("coda.punta");
    const r = nomi.indexOf("coda.rientra");
    const f = nomi.indexOf("coda.fine");
    expect([i, j, r, f].every((k) => k >= 0)).toBe(true);
    // In ordine, e in mezzo agli altri due.
    expect(r).toBeLessThan(i);
    expect(i).toBeLessThan(j);
    expect(j).toBeLessThan(f);
    // Sulla retta: l'area del triangolo con gli estremi e' zero.
    const suRetta = (p: readonly [number, number]) =>
      Math.abs(
        (P[f][0] - P[r][0]) * (p[1] - P[r][1]) - (p[0] - P[r][0]) * (P[f][1] - P[r][1]),
      );
    expect(suRetta(P[i])).toBeLessThan(1);
    expect(suRetta(P[j])).toBeLessThan(1);
  });

  it("sotto i 900px gli scostamenti non si applicano", () => {
    // Li' i blocchi si impilano, i disegni stanno da tutt'altra parte, e una
    // correzione da mezzo schermo non corregge: sposta.
    const nudo = strada(MISURE, CODA, MONDO, PARAM, false, PAGINA);
    const i = nudo.indiciDisegno[1];
    expect(nudo.punti[i][0]).toBe(MISURE[1].cx);
    expect(nudo.punti[i][1]).toBe(MISURE[1].cy);
  });
});

describe("il filo della scena", () => {
  /**
   * La pagina e' piu' larga della scena, e la scena ci sta dentro centrata:
   * e' la situazione vera — [data-pratica] e' largo al massimo 74rem mentre la
   * pagina e' la finestra. Distinguerle e' tutto il punto di questa suite:
   * gli ancoraggi sono percentuali della PAGINA, i disegni stanno nella SCENA.
   */
  const PAGINA: Pagina = { w: 1400, left: (1400 - MONDO.w) / 2 };
  const F = () => filo(MISURE, CODA, MONDO, PAGINA);

  it("entra e esce agli ancoraggi, contati sulla PAGINA e non sulla scena", () => {
    // Il difetto che questa prova chiude: contati sulla scena i due capi
    // cadevano un centinaio di pixel piu' dentro degli altri tratti della
    // pagina, e il filo faceva un gradino a ogni giunzione.
    const f = F();
    expect(f[0][1]).toBe(0);
    expect(f[0][0]).toBeCloseTo((PAGINA.w * THREAD_ANCHORS.practice.in) / 100, 6);
    expect(f[f.length - 1][0]).toBeCloseTo((PAGINA.w * THREAD_ANCHORS.practice.out) / 100, 6);
    expect(f[f.length - 1][1]).toBe(MONDO.h);
  });

  it("l'entrata non e' piu' scritta a mano: segue l'ancora se cambia", () => {
    // Era 0,86 contro un ancoraggio dichiarato 88. Un capo che non segue la
    // sua ancora e' un gradino che nessuna prova vedrebbe.
    expect(F()[0][0]).not.toBeCloseTo(PAGINA.w * 0.86, 2);
  });

  it("i punti in mezzo restano attaccati ai disegni, spostati nella pagina", () => {
    // La serpentina si disegna attorno ai disegni, che stanno nella scena: le
    // loro x vanno traslate, non ricontate sulla pagina.
    const f = F();
    const mezzo = f.slice(1, 1 + MISURE.length);
    for (const p of mezzo) {
      expect(p[0]).toBeGreaterThan(PAGINA.left);
      expect(p[0]).toBeLessThan(PAGINA.left + MONDO.w);
    }
  });

  it("serpeggia: passa da una parte e dall'altra della mezzeria della scena", () => {
    const mezzeria = PAGINA.left + MONDO.w / 2;
    const lati = F()
      .slice(1, 1 + MISURE.length)
      .map((p) => Math.sign(p[0] - mezzeria));
    expect(new Set(lati).size).toBe(2);
  });

  it("e' deterministico: due chiamate danno lo stesso filo", () => {
    // L'irregolarita' viene da un LCG seminato, come le sagome del tavolo. Con
    // Math.random() il filo cambierebbe a ogni render e non sarebbe provabile.
    expect(F()).toEqual(F());
  });
});

describe("quale voce e' in fuoco", () => {
  const SCHERMO = 900;
  const CENTRO = SCHERMO / 2;
  /** La stessa frazione di FUOCO in freccia.ts: un quarto di schermo. */
  const SOGLIA = SCHERMO * 0.25;

  it("accende la voce il cui disegno sta nella fascia attorno al centro", () => {
    expect(inFuoco([CENTRO + 100], CENTRO, SOGLIA)).toBe(0);
  });

  it("NON accende una voce che e' ancora troppo in basso", () => {
    // E' il difetto da correggere, ed e' quello che "vince la piu' vicina"
    // non sapeva evitare: con un solo disegno in campo lo accendeva comunque,
    // fosse anche in fondo allo schermo.
    expect(inFuoco([CENTRO + 400], CENTRO, SOGLIA)).toBe(-1);
  });

  it("la fascia e' simmetrica: si accende sotto e si spegne sopra alla stessa distanza", () => {
    expect(inFuoco([CENTRO + SOGLIA + 1], CENTRO, SOGLIA)).toBe(-1);
    expect(inFuoco([CENTRO + SOGLIA - 1], CENTRO, SOGLIA)).toBe(0);
    expect(inFuoco([CENTRO - SOGLIA + 1], CENTRO, SOGLIA)).toBe(0);
    expect(inFuoco([CENTRO - SOGLIA - 1], CENTRO, SOGLIA)).toBe(-1);
  });

  it("fra due voci distanti c'e' un momento in cui non e' accesa nessuna", () => {
    // La proprieta' che rende la scena una voce alla volta: passando da una
    // all'altra non si scambiano il fuoco a meta' strada, si spegne la prima
    // e piu' tardi si accende la seconda. Due disegni a 700px, che e' la
    // distanza vera con la spaziatura attuale, e la mezzeria fra loro sul
    // centro dello schermo.
    expect(inFuoco([CENTRO - 350, CENTRO + 350], CENTRO, SOGLIA)).toBe(-1);
  });

  it("se due cadessero tutte e due nella fascia, vince la piu' vicina al centro", () => {
    expect(inFuoco([CENTRO - 200, CENTRO + 60], CENTRO, SOGLIA)).toBe(1);
  });

  it("senza disegni non accende niente invece di lanciare", () => {
    expect(inFuoco([], CENTRO, SOGLIA)).toBe(-1);
  });
});
