import { describe, it, expect } from "vitest";
import {
  ARRIVAL_POSE,
  POSES,
  TRACK_PARAMS,
  arrived,
  filledLine,
  phases,
  poseAt,
  trackRoute,
  travel,
  wavePath,
  type TrackPoint,
} from "../track";

const { timings } = TRACK_PARAMS;

/**
 * Un palco da telefono e una corsa qualsiasi: i numeri non contano, contano i
 * rapporti. `viaggio` si ricava come lo ricava il componente, dall'altezza del
 * track meno il palco e la coda, cosi' il test usa la stessa strada del codice.
 */
const STAGE = 800;
const TRACK = 4000;
const TRAVEL = travel({ track: TRACK, stage: STAGE, tail: TRACK_PARAMS.tail });
const TAIL_PX = TRACK_PARAMS.tail * STAGE;

/** Lo scroll fatto quando la coda e' arrivata alla frazione `q`. */
const inTail = (q: number) => TRAVEL + q * TAIL_PX;
const phasesAt = (done: number) =>
  phases({ done, travel: TRAVEL, tail: TRACK_PARAMS.tail, height: STAGE });

/** Le curve di un tracciato: partenza, due maniglie, arrivo. */
type Curve = { from: TrackPoint; c1: TrackPoint; c2: TrackPoint; to: TrackPoint };

function parsePath(d: string): { start: TrackPoint; curves: Curve[] } {
  const numbers = (s: string) => s.trim().split(/[\s,]+/).map(Number);
  const [m, ...pieces] = d.split("C");
  const [mx, my] = numbers(m.replace("M", ""));
  let from: TrackPoint = [mx, my];
  const curves = pieces.map((piece) => {
    const [x1, y1, x2, y2, x, y] = numbers(piece);
    const curve: Curve = { from, c1: [x1, y1], c2: [x2, y2], to: [x, y] };
    from = [x, y];
    return curve;
  });
  return { start: [mx, my], curves };
}

describe("viaggio", () => {
  it("e' il track meno un palco e meno la coda, misurati sullo stesso palco", () => {
    expect(TRAVEL).toBeCloseTo(TRACK - STAGE * (1 + TRACK_PARAMS.tail));
  });

  it("non va sotto zero se il track e' piu' corto di palco e coda", () => {
    expect(travel({ track: 1000, stage: STAGE, tail: TRACK_PARAMS.tail })).toBe(0);
  });
});

describe("fasi", () => {
  it("all'aggancio la fila e' ferma all'inizio e il foglio dei numeri e' spento", () => {
    expect(phasesAt(0)).toEqual({
      p: 0,
      q: 0,
      filled01: 0,
      light: 0,
      fall: 0,
      jolt: 0,
    });
  });

  it("a fine viaggio la fila e' arrivata e la coda non e' ancora partita", () => {
    const f = phasesAt(TRAVEL);
    expect(f.p).toBe(1);
    expect(f.q).toBe(0);
    expect(f.filled01).toBe(0);
    expect(f.light).toBe(0);
  });

  it("a meta' viaggio la fila e' a meta'", () => {
    expect(phasesAt(TRAVEL / 2).p).toBeCloseTo(0.5);
  });

  it(`a ${timings.filled} della coda il tratteggio e' pieno e la luce parte`, () => {
    const f = phasesAt(inTail(timings.filled));
    expect(f.filled01).toBeCloseTo(1);
    expect(f.light).toBeCloseTo(0);
  });

  it(`a ${timings.lit} della coda il foglio e' acceso e il sussulto e' finito`, () => {
    const f = phasesAt(inTail(timings.lit));
    expect(f.light).toBeCloseTo(1);
    expect(f.jolt).toBeCloseTo(0);
    expect(f.fall).toBe(0);
  });

  it("il sussulto e' al massimo a meta' dell'accensione", () => {
    const half = (timings.filled + timings.lit) / 2;
    expect(phasesAt(inTail(half)).jolt).toBeCloseTo(1);
  });

  it(`fino a ${timings.falls} della coda il foglio sta fermo, poi cade`, () => {
    expect(phasesAt(inTail(timings.falls)).fall).toBeCloseTo(0);
    expect(phasesAt(inTail((timings.falls + 1) / 2)).fall).toBeCloseTo(0.5);
  });

  it("a fine coda il foglio e' caduto del tutto", () => {
    const f = phasesAt(inTail(1));
    expect(f.q).toBe(1);
    expect(f.light).toBe(1);
    expect(f.fall).toBe(1);
  });

  it("luce e caduta restano in [0, 1] anche fuori dalla corsa", () => {
    for (let done = -500; done <= TRACK + 500; done += 37) {
      const f = phasesAt(done);
      for (const v of [f.p, f.q, f.filled01, f.light, f.fall]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });

  it("senza viaggio ne' coda tutto e' gia' compiuto, senza NaN", () => {
    const f = phases({ done: 0, travel: 0, tail: 0, height: 0 });
    expect(f.p).toBe(1);
    expect(f.q).toBe(1);
    expect(f.fall).toBe(1);
  });
});

describe("filledLine", () => {
  const width = 1000;
  const arrivalEdge = 3000;
  const arrivalEnd = 3288;
  const gap = TRACK_PARAMS.gap * width;

  it("durante il viaggio arriva al centro dello schermo", () => {
    expect(filledLine({ x: 400, width, arrivalEdge, arrivalEnd, q: 0 })).toBe(900);
  });

  it("vicino all'arrivo si ferma un varco prima del foglio", () => {
    expect(filledLine({ x: 2800, width, arrivalEdge, arrivalEnd, q: 0 })).toBe(
      arrivalEdge - gap,
    );
  });

  it("nella coda il varco si riempie, poi la linea entra nel foglio", () => {
    const x = 2644;
    const half = filledLine({ x, width, arrivalEdge, arrivalEnd, q: timings.filled / 2 });
    expect(half).toBeCloseTo(arrivalEdge - gap / 2);
    expect(filledLine({ x, width, arrivalEdge, arrivalEnd, q: timings.filled })).toBe(
      arrivalEnd,
    );
  });

  it("non e' mai negativa", () => {
    expect(
      filledLine({ x: -2000, width, arrivalEdge, arrivalEnd, q: 0 }),
    ).toBe(0);
  });
});

describe("arrivata", () => {
  it(`una tappa e' arrivata entro ${TRACK_PARAMS.arrivalThreshold} di schermo dal centro`, () => {
    const width = 1000;
    const x = 0;
    expect(arrived({ stopCentre: 749, x, width })).toBe(true);
    expect(arrived({ stopCentre: 751, x, width })).toBe(false);
  });
});

describe("wavePath", () => {
  // Il bordo sinistro a meta' altezza, quattro tappe con lo scostamento delle
  // pose, e l'arrivo: tratti di lunghezze diverse, perche' e' li' che senza la
  // pendenza continua l'onda faceva lo spigolo.
  const points: TrackPoint[] = [
    [0, 300],
    [520, 276],
    [1128, 328],
    [1736, 292],
    [2344, 320],
    [2896, 300],
  ];
  const amplitude = 56;

  for (const waves of [1, 2, 3]) {
    describe(`con ${waves} gobbe per tratto`, () => {
      const { start, curves } = parsePath(wavePath(points, amplitude, waves));

      it("parte dal primo punto e passa per ogni punto", () => {
        expect(start).toEqual(points[0]);
        const ends = curves.map((c) => c.to);
        for (const p of points.slice(1)) {
          expect(
            ends.some(([x, y]) => Math.abs(x - p[0]) < 1e-9 && Math.abs(y - p[1]) < 1e-9),
          ).toBe(true);
        }
        expect(curves.at(-1)!.to).toEqual(points.at(-1));
      });

      it("ha tante curve quante gobbe (una sola nel tratto d'ingresso)", () => {
        expect(curves).toHaveLength(1 + (points.length - 2) * waves);
      });

      it("la pendenza e' continua a ogni giunto", () => {
        for (let i = 1; i < curves.length; i++) {
          const prev = curves[i - 1];
          const next = curves[i];
          const outSlope = (prev.to[1] - prev.c2[1]) / (prev.to[0] - prev.c2[0]);
          const inSlope = (next.c1[1] - next.from[1]) / (next.c1[0] - next.from[0]);
          expect(inSlope).toBeCloseTo(outSlope, 9);
        }
      });

      it("le gobbe si alternano di verso", () => {
        const signs = curves.map((c) => {
          const mid = c.from[1] + (2 * (c.to[1] - c.from[1])) / 3;
          return Math.sign(c.c2[1] - mid);
        });
        for (let i = 1; i < signs.length; i++) expect(signs[i]).toBe(-signs[i - 1]);
      });
    });
  }

  it("con punti coincidenti non scrive mai NaN ne' Infinity", () => {
    // Succede davvero: alla prima misura i fogli sono ancora in colonna, tutti
    // con lo stesso offsetLeft, e un tratto largo zero faceva dividere per zero
    // la pendenza. Il browser rifiuta il tracciato e lo dice in console.
    const stacked: TrackPoint[] = [
      [0, 300],
      [720, 300],
      [720, 276],
      [720, 328],
      [720, 300],
    ];
    for (const waves of [1, 2]) {
      const d = wavePath(stacked, amplitude, waves);
      expect(d).not.toMatch(/NaN|Infinity/);
    }
  });

  it("con un punto solo non disegna curve", () => {
    expect(wavePath([[0, 10]], amplitude, 1)).toBe("M0,10");
  });
});

describe("pose", () => {
  it("le quattro tappe hanno rotazioni tutte diverse", () => {
    const rotations = POSES.map((p) => p.rotation);
    expect(POSES).toHaveLength(4);
    expect(new Set(rotations).size).toBe(rotations.length);
  });

  it("si ripetono in ciclo oltre la quarta tappa", () => {
    expect(poseAt(4)).toEqual(POSES[0]);
    expect(poseAt(7)).toEqual(POSES[3]);
  });

  it("l'arrivo ha la sua inclinazione e sta sulla riga", () => {
    expect(ARRIVAL_POSE).toEqual({ rotation: -0.8, offset: 0 });
  });
});

describe("strada", () => {
  it("coincide con la somma di margini, fogli, arie e arrivo meno lo schermo", () => {
    const sheet = 416;
    const air = 192;
    const arrival = 288;
    for (const width of [375, 390, 1024, 1440]) {
      for (const n of [1, 4, 6]) {
        const leftMargin = width / 2 - sheet / 2;
        const rightMargin = width / 2 - arrival / 2;
        // n tappe, e un'aria dopo ciascuna: l'ultima la separa dall'arrivo.
        const track = leftMargin + n * sheet + n * air + arrival + rightMargin;
        expect(trackRoute({ n, sheet, air, arrival })).toBeCloseTo(track - width);
      }
    }
  });
});
