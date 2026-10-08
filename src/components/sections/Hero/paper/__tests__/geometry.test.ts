import { describe, it, expect } from "vitest";
import {
  GRID_SIDE,
  RADIUS,
  SHADE_STEPS,
  affineMap,
  buildMesh,
  cellsByDepth,
  noiseField,
  positions,
  rng,
  veilFor,
  type PaperPoint,
  type Triple,
} from "../geometry";

const p = (x: number, y: number): PaperPoint => ({ x, y });
const apply = (m: readonly number[], q: PaperPoint) => ({
  x: m[0] * q.x + m[2] * q.y + m[4],
  y: m[1] * q.x + m[3] * q.y + m[5],
});

describe("la mappa affine", () => {
  const S: Triple = [p(0, 0), p(10, 0), p(0, 10)];

  it("sull'identita' restituisce l'identita'", () => {
    // La prima formula compatta qui dava (1,0,0,-1,0,0): lettere specchiate.
    expect(affineMap(S, S)).toEqual([1, 0, 0, 1, 0, 0]);
  });

  it("porta davvero ogni vertice sul suo, comunque sia messo il triangolo", () => {
    const cases: Array<[string, Triple]> = [
      ["traslato", [p(5, 7), p(15, 7), p(5, 17)]],
      ["scalato", [p(0, 0), p(20, 0), p(0, 20)]],
      ["ruotato di 90", [p(0, 0), p(0, 10), p(-10, 0)]],
      ["deformato", [p(3, 1), p(12, 4), p(-2, 9)]],
    ];
    for (const [name, D] of cases) {
      const m = affineMap(S, D);
      expect(m, name).not.toBeNull();
      for (let k = 0; k < 3; k++) {
        const q = apply(m!, S[k]);
        expect(q.x, `${name}: x del vertice ${k}`).toBeCloseTo(D[k].x, 9);
        expect(q.y, `${name}: y del vertice ${k}`).toBeCloseTo(D[k].y, 9);
      }
    }
  });

  it("su un triangolo degenere non inventa una mappa", () => {
    expect(affineMap([p(0, 0), p(5, 5), p(10, 10)], S)).toBeNull();
  });
});

describe("il generatore e il campo", () => {
  it("e' deterministico: lo stesso seme da' la stessa carta", () => {
    // Con Math.random() la lettera cambierebbe forma a ogni visita.
    expect(buildMesh(11)).toEqual(buildMesh(11));
  });

  it("semi diversi danno pieghe diverse", () => {
    expect(buildMesh(11)).not.toEqual(buildMesh(12));
  });

  it("il campo e' liscio: due punti vicini danno valori vicini", () => {
    // Rumore puro sbriciolerebbe la carta invece di piegarla a pezzi.
    const f = noiseField(rng(5), 3);
    let jump = 0;
    for (let i = 0; i < 40; i++) {
      const u = i / 40;
      jump = Math.max(jump, Math.abs(f(u, 0.5) - f(u + 0.025, 0.5)));
    }
    expect(jump).toBeLessThan(0.2);
  });
});

describe("la pallina", () => {
  const seeds = [11, 24, 37, 50];

  it("e' piccola: il diametro sta sotto la meta' del foglio", () => {
    // A 0,46 di raggio il foglio restava un quadrato rimpicciolito.
    for (const s of seeds) {
      const r = Math.max(...buildMesh(s).map((v) => Math.hypot(v.bx, v.by)));
      expect(2 * r, `seme ${s}`).toBeLessThan(0.5);
      expect(2 * r, `seme ${s}`).toBeGreaterThan(0.25);
    }
  });

  it("il foglio si ripiega su se stesso invece di rimpicciolirsi", () => {
    // Se il raggio d'arrivo seguisse quello di partenza la correlazione sarebbe circa +1.
    for (const s of seeds) {
      const v = buildMesh(s);
      const start = v.map((q) => Math.hypot(q.u - 0.5, q.w - 0.5));
      const end = v.map((q) => Math.hypot(q.bx, q.by));
      const meanStart = start.reduce((x, y) => x + y) / start.length;
      const meanEnd = end.reduce((x, y) => x + y) / end.length;
      let cov = 0;
      let ssStart = 0;
      let ssEnd = 0;
      for (let i = 0; i < v.length; i++) {
        cov += (start[i] - meanStart) * (end[i] - meanEnd);
        ssStart += (start[i] - meanStart) ** 2;
        ssEnd += (end[i] - meanEnd) ** 2;
      }
      const corr = cov / Math.sqrt(ssStart * ssEnd);
      expect(Math.abs(corr), `seme ${s}: correlazione partenza→arrivo`).toBeLessThan(0.6);
    }
  });

  it("il bordo del foglio finisce dentro la pallina", () => {
    // Se il bordo restasse fuori, il quadrato resterebbe riconoscibile.
    for (const s of seeds) {
      const v = buildMesh(s);
      const maxRadius = Math.max(...v.map((q) => Math.hypot(q.bx, q.by)));
      const edge = v.filter((q) => Math.hypot(q.u - 0.5, q.w - 0.5) > 0.45);
      const inside = edge.filter((q) => Math.hypot(q.bx, q.by) < maxRadius * 0.5);
      expect(inside.length, `seme ${s}`).toBeGreaterThan(edge.length * 0.1);
    }
  });
});

describe("il collasso", () => {
  const mesh = buildMesh(11);
  const center = { x: 100, y: 100 };

  it("a foglio disteso i vertici sono dove il foglio li mette", () => {
    const q = positions(mesh, 0, center, 200);
    expect(q[0].x).toBeCloseTo(0, 6);
    expect(q[0].y).toBeCloseTo(0, 6);
    expect(q[q.length - 1].x).toBeCloseTo(200, 6);
  });

  it("appallottolato, tutto sta dentro il raggio della pallina", () => {
    const side = 200;
    for (const q of positions(mesh, 1, center, side)) {
      expect(Math.hypot(q.x - center.x, q.y - center.y)).toBeLessThanOrEqual(RADIUS * side + 0.001);
    }
  });

  it("la carta non cede tutta insieme", () => {
    // E' il ritardo per vertice a farla cedere a pieghe invece di sgonfiarsi.
    const half = positions(mesh, 0.5, center, 200);
    const flat = positions(mesh, 0, center, 200);
    const progress = half.map((q, i) => Math.hypot(q.x - flat[i].x, q.y - flat[i].y));
    expect(Math.max(...progress) - Math.min(...progress)).toBeGreaterThan(5);
  });
});

describe("l'ordine di disegno", () => {
  it("va dalla piu' lontana alla piu' vicina, e le conta tutte", () => {
    // Senza quest'ordine le facce sarebbero un collage piatto.
    const cells = cellsByDepth(positions(buildMesh(24), 1, { x: 0, y: 0 }, 100));
    expect(cells).toHaveLength(GRID_SIDE * GRID_SIDE);
    for (let i = 1; i < cells.length; i++) {
      expect(cells[i].z).toBeGreaterThanOrEqual(cells[i - 1].z);
    }
  });
});

describe("quando compare il foglio", () => {
  it("passando col cursore si vede solo l'inchiostro", () => {
    // Il difetto della prima stesura: il foglio compariva subito, col bordo che si piegava.
    expect(veilFor(0)).toBe(0);
    expect(veilFor(0.25)).toBe(0);
  });

  it("appallottolato il foglio si vede tutto", () => {
    expect(veilFor(1)).toBe(SHADE_STEPS - 1);
  });

  it("in mezzo non torna mai indietro", () => {
    let prev = -1;
    for (let t = 0; t <= 1.0001; t += 0.02) {
      const v = veilFor(t);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
});
