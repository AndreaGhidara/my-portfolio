import { describe, it, expect } from "vitest";
import { CROSSINGS, BRANCHES } from "@/content/toolbox";
import { NODES } from "../graph";
import {
  THREADS,
  DRAG_THRESHOLD,
  advance,
  needleDuration,
  toMapPoint,
  pastThreshold,
  needlePose,
  restPositions,
  sewnStops,
} from "../motion";

describe("la mappa ferma", () => {
  it("un filo per ogni ramo e ogni incrocio, i rami prima", () => {
    expect(THREADS).toHaveLength(BRANCHES.length + CROSSINGS.length);
    expect(THREADS.slice(0, BRANCHES.length).every((f) => !f.crossing)).toBe(true);
    expect(THREADS.slice(BRANCHES.length).every((f) => f.crossing)).toBe(true);
  });

  it("ogni nodo ha il suo posto di riposo, quello del disegno", () => {
    for (const n of NODES) expect(restPositions.get(n.id)).toEqual({ x: n.x, y: n.y });
  });
});

describe("l'ago", () => {
  it("ci mette un tanto per tappa, ma mai piu' del tetto", () => {
    expect(needleDuration(1)).toBeCloseTo(0.26);
    expect(needleDuration(10)).toBeCloseTo(2.6);
    expect(needleDuration(20)).toBeCloseTo(5.2);
    expect(needleDuration(100)).toBe(5.2);
  });

  it("guarda un poco avanti sul filo, senza uscire dalla fine", () => {
    expect(advance(10, 100)).toBe(12);
    expect(advance(99, 100)).toBe(100);
  });

  it("punta lungo il filo: il disegno e' verticale, quindi un quarto di giro in piu'", () => {
    expect(needlePose(0, { x: 0, y: 0 }, { x: 1, y: 0 })).toBe("translate(0 0) rotate(90)");
    expect(needlePose(0, { x: 5, y: 5 }, { x: 5, y: 7 })).toBe("translate(5 5) rotate(180)");
  });

  it("dondola su e giu' di quattro unita' al massimo", () => {
    const quota = (q: number) => {
      const m = needlePose(q, { x: 0, y: 100 }, { x: 1, y: 100 }).match(/translate\(0 ([^)]+)\)/);
      return Number(m![1]) - 100;
    };
    const quote = Array.from({ length: 200 }, (_, i) => quota(i / 199));
    expect(Math.max(...quote)).toBeLessThanOrEqual(4);
    expect(Math.min(...quote)).toBeGreaterThanOrEqual(-4);
    expect(Math.max(...quote)).toBeGreaterThan(3.9);
  });

  it("accende le tappe che ha raggiunto, con mezza unita' di tolleranza", () => {
    const soglie = [0, 50, 120, 200];
    expect(sewnStops(soglie, 10, 1)).toBe(1);
    expect(sewnStops(soglie, 49.5, 1)).toBe(2);
    expect(sewnStops(soglie, 49.4, 1)).toBe(1);
    expect(sewnStops(soglie, 130, 1)).toBe(3);
    expect(sewnStops(soglie, 500, 1)).toBe(4);
  });

  it("non torna indietro sulle tappe gia' fatte", () => {
    expect(sewnStops([0, 50, 120], 0, 3)).toBe(3);
  });
});

describe("il trascinamento", () => {
  it("sotto la soglia e' un clic, dalla soglia in su un trascinamento", () => {
    const da = { x: 100, y: 100 };
    expect(pastThreshold(da, { x: 103, y: 104 })).toBe(false);
    expect(pastThreshold(da, { x: 100 + DRAG_THRESHOLD, y: 100 })).toBe(true);
    expect(pastThreshold(da, { x: 90, y: 100 })).toBe(true);
  });

  it("riporta un punto dello schermo nelle unita' della mappa", () => {
    // Una mappa scalata a meta' e spostata di (10, 20): l'inversa raddoppia e toglie.
    const inversa = { a: 2, b: 0, c: 0, d: 2, e: -20, f: -40 };
    expect(toMapPoint(inversa, 60, 70)).toEqual({ x: 100, y: 100 });
  });
});
