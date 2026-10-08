import { describe, it, expect } from "vitest";
import {
  PARAMETRI,
  POSE,
  POSA_ARRIVO,
  arrivata,
  fasi,
  lineaPiena,
  posa,
  strada,
  tracciaOnda,
  viaggio,
  type Punto,
} from "../track";

const { tempi } = PARAMETRI;

/**
 * Un palco da telefono e una corsa qualsiasi: i numeri non contano, contano i
 * rapporti. `viaggio` si ricava come lo ricava il componente, dall'altezza del
 * track meno il palco e la coda, cosi' il test usa la stessa strada del codice.
 */
const PALCO = 800;
const TRACK = 4000;
const VIAGGIO = viaggio({ track: TRACK, palco: PALCO, coda: PARAMETRI.coda });
const CODA_PX = PARAMETRI.coda * PALCO;

/** Lo scroll fatto quando la coda e' arrivata alla frazione `q`. */
const inCoda = (q: number) => VIAGGIO + q * CODA_PX;
const fasiA = (fatta: number) =>
  fasi({ fatta, viaggio: VIAGGIO, coda: PARAMETRI.coda, altezza: PALCO });

/** Le curve di un tracciato: partenza, due maniglie, arrivo. */
type Curva = { da: Punto; c1: Punto; c2: Punto; a: Punto };

function leggiTracciato(d: string): { inizio: Punto; curve: Curva[] } {
  const numeri = (s: string) => s.trim().split(/[\s,]+/).map(Number);
  const [m, ...pezzi] = d.split("C");
  const [mx, my] = numeri(m.replace("M", ""));
  let da: Punto = [mx, my];
  const curve = pezzi.map((pezzo) => {
    const [x1, y1, x2, y2, x, y] = numeri(pezzo);
    const curva: Curva = { da, c1: [x1, y1], c2: [x2, y2], a: [x, y] };
    da = [x, y];
    return curva;
  });
  return { inizio: [mx, my], curve };
}

describe("viaggio", () => {
  it("e' il track meno un palco e meno la coda, misurati sullo stesso palco", () => {
    expect(VIAGGIO).toBeCloseTo(TRACK - PALCO * (1 + PARAMETRI.coda));
  });

  it("non va sotto zero se il track e' piu' corto di palco e coda", () => {
    expect(viaggio({ track: 1000, palco: PALCO, coda: PARAMETRI.coda })).toBe(0);
  });
});

describe("fasi", () => {
  it("all'aggancio la fila e' ferma all'inizio e il foglio dei numeri e' spento", () => {
    expect(fasiA(0)).toEqual({
      p: 0,
      q: 0,
      pieno01: 0,
      luce: 0,
      caduta: 0,
      sussulto: 0,
    });
  });

  it("a fine viaggio la fila e' arrivata e la coda non e' ancora partita", () => {
    const f = fasiA(VIAGGIO);
    expect(f.p).toBe(1);
    expect(f.q).toBe(0);
    expect(f.pieno01).toBe(0);
    expect(f.luce).toBe(0);
  });

  it("a meta' viaggio la fila e' a meta'", () => {
    expect(fasiA(VIAGGIO / 2).p).toBeCloseTo(0.5);
  });

  it(`a ${tempi.riempito} della coda il tratteggio e' pieno e la luce parte`, () => {
    const f = fasiA(inCoda(tempi.riempito));
    expect(f.pieno01).toBeCloseTo(1);
    expect(f.luce).toBeCloseTo(0);
  });

  it(`a ${tempi.acceso} della coda il foglio e' acceso e il sussulto e' finito`, () => {
    const f = fasiA(inCoda(tempi.acceso));
    expect(f.luce).toBeCloseTo(1);
    expect(f.sussulto).toBeCloseTo(0);
    expect(f.caduta).toBe(0);
  });

  it("il sussulto e' al massimo a meta' dell'accensione", () => {
    const meta = (tempi.riempito + tempi.acceso) / 2;
    expect(fasiA(inCoda(meta)).sussulto).toBeCloseTo(1);
  });

  it(`fino a ${tempi.cade} della coda il foglio sta fermo, poi cade`, () => {
    expect(fasiA(inCoda(tempi.cade)).caduta).toBeCloseTo(0);
    expect(fasiA(inCoda((tempi.cade + 1) / 2)).caduta).toBeCloseTo(0.5);
  });

  it("a fine coda il foglio e' caduto del tutto", () => {
    const f = fasiA(inCoda(1));
    expect(f.q).toBe(1);
    expect(f.luce).toBe(1);
    expect(f.caduta).toBe(1);
  });

  it("luce e caduta restano in [0, 1] anche fuori dalla corsa", () => {
    for (let fatta = -500; fatta <= TRACK + 500; fatta += 37) {
      const f = fasiA(fatta);
      for (const v of [f.p, f.q, f.pieno01, f.luce, f.caduta]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });

  it("senza viaggio ne' coda tutto e' gia' compiuto, senza NaN", () => {
    const f = fasi({ fatta: 0, viaggio: 0, coda: 0, altezza: 0 });
    expect(f.p).toBe(1);
    expect(f.q).toBe(1);
    expect(f.caduta).toBe(1);
  });
});

describe("lineaPiena", () => {
  const larghezza = 1000;
  const bordoArrivo = 3000;
  const fineArrivo = 3288;
  const varco = PARAMETRI.varco * larghezza;

  it("durante il viaggio arriva al centro dello schermo", () => {
    expect(lineaPiena({ x: 400, larghezza, bordoArrivo, fineArrivo, q: 0 })).toBe(900);
  });

  it("vicino all'arrivo si ferma un varco prima del foglio", () => {
    expect(lineaPiena({ x: 2800, larghezza, bordoArrivo, fineArrivo, q: 0 })).toBe(
      bordoArrivo - varco,
    );
  });

  it("nella coda il varco si riempie, poi la linea entra nel foglio", () => {
    const x = 2644;
    const meta = lineaPiena({ x, larghezza, bordoArrivo, fineArrivo, q: tempi.riempito / 2 });
    expect(meta).toBeCloseTo(bordoArrivo - varco / 2);
    expect(lineaPiena({ x, larghezza, bordoArrivo, fineArrivo, q: tempi.riempito })).toBe(
      fineArrivo,
    );
  });

  it("non e' mai negativa", () => {
    expect(
      lineaPiena({ x: -2000, larghezza, bordoArrivo, fineArrivo, q: 0 }),
    ).toBe(0);
  });
});

describe("arrivata", () => {
  it(`una tappa e' arrivata entro ${PARAMETRI.sogliaArrivo} di schermo dal centro`, () => {
    const larghezza = 1000;
    const x = 0;
    expect(arrivata({ centroTappa: 749, x, larghezza })).toBe(true);
    expect(arrivata({ centroTappa: 751, x, larghezza })).toBe(false);
  });
});

describe("tracciaOnda", () => {
  // Il bordo sinistro a meta' altezza, quattro tappe con lo scostamento delle
  // pose, e l'arrivo: tratti di lunghezze diverse, perche' e' li' che senza la
  // pendenza continua l'onda faceva lo spigolo.
  const punti: Punto[] = [
    [0, 300],
    [520, 276],
    [1128, 328],
    [1736, 292],
    [2344, 320],
    [2896, 300],
  ];
  const ampiezza = 56;

  for (const onde of [1, 2, 3]) {
    describe(`con ${onde} gobbe per tratto`, () => {
      const { inizio, curve } = leggiTracciato(tracciaOnda(punti, ampiezza, onde));

      it("parte dal primo punto e passa per ogni punto", () => {
        expect(inizio).toEqual(punti[0]);
        const estremi = curve.map((c) => c.a);
        for (const p of punti.slice(1)) {
          expect(
            estremi.some(([x, y]) => Math.abs(x - p[0]) < 1e-9 && Math.abs(y - p[1]) < 1e-9),
          ).toBe(true);
        }
        expect(curve.at(-1)!.a).toEqual(punti.at(-1));
      });

      it("ha tante curve quante gobbe (una sola nel tratto d'ingresso)", () => {
        expect(curve).toHaveLength(1 + (punti.length - 2) * onde);
      });

      it("la pendenza e' continua a ogni giunto", () => {
        for (let i = 1; i < curve.length; i++) {
          const prima = curve[i - 1];
          const dopo = curve[i];
          const uscita = (prima.a[1] - prima.c2[1]) / (prima.a[0] - prima.c2[0]);
          const entrata = (dopo.c1[1] - dopo.da[1]) / (dopo.c1[0] - dopo.da[0]);
          expect(entrata).toBeCloseTo(uscita, 9);
        }
      });

      it("le gobbe si alternano di verso", () => {
        const versi = curve.map((c) => {
          const medio = c.da[1] + (2 * (c.a[1] - c.da[1])) / 3;
          return Math.sign(c.c2[1] - medio);
        });
        for (let i = 1; i < versi.length; i++) expect(versi[i]).toBe(-versi[i - 1]);
      });
    });
  }

  it("con punti coincidenti non scrive mai NaN ne' Infinity", () => {
    // Succede davvero: alla prima misura i fogli sono ancora in colonna, tutti
    // con lo stesso offsetLeft, e un tratto largo zero faceva dividere per zero
    // la pendenza. Il browser rifiuta il tracciato e lo dice in console.
    const fermi: Punto[] = [
      [0, 300],
      [720, 300],
      [720, 276],
      [720, 328],
      [720, 300],
    ];
    for (const onde of [1, 2]) {
      const d = tracciaOnda(fermi, ampiezza, onde);
      expect(d).not.toMatch(/NaN|Infinity/);
    }
  });

  it("con un punto solo non disegna curve", () => {
    expect(tracciaOnda([[0, 10]], ampiezza, 1)).toBe("M0,10");
  });
});

describe("pose", () => {
  it("le quattro tappe hanno rotazioni tutte diverse", () => {
    const rotazioni = POSE.map((p) => p.rotazione);
    expect(POSE).toHaveLength(4);
    expect(new Set(rotazioni).size).toBe(rotazioni.length);
  });

  it("si ripetono in ciclo oltre la quarta tappa", () => {
    expect(posa(4)).toEqual(POSE[0]);
    expect(posa(7)).toEqual(POSE[3]);
  });

  it("l'arrivo ha la sua inclinazione e sta sulla riga", () => {
    expect(POSA_ARRIVO).toEqual({ rotazione: -0.8, scostamento: 0 });
  });
});

describe("strada", () => {
  it("coincide con la somma di margini, fogli, arie e arrivo meno lo schermo", () => {
    const foglio = 416;
    const aria = 192;
    const arrivo = 288;
    for (const larghezza of [375, 390, 1024, 1440]) {
      for (const n of [1, 4, 6]) {
        const margineSinistro = larghezza / 2 - foglio / 2;
        const margineDestro = larghezza / 2 - arrivo / 2;
        // n tappe, e un'aria dopo ciascuna: l'ultima la separa dall'arrivo.
        const binario = margineSinistro + n * foglio + n * aria + arrivo + margineDestro;
        expect(strada({ n, foglio, aria, arrivo })).toBeCloseTo(binario - larghezza);
      }
    }
  });
});
