import { describe, it, expect } from "vitest";
import { INCROCI, RAMI } from "@/content/toolbox";
import { NODI } from "../graph";
import {
  FILI,
  SOGLIA_TRASCINA,
  avanti,
  durataAgo,
  inMappa,
  oltreSoglia,
  posaAgo,
  riposo,
  tappeCucite,
} from "../motion";

describe("la mappa ferma", () => {
  it("un filo per ogni ramo e ogni incrocio, i rami prima", () => {
    expect(FILI).toHaveLength(RAMI.length + INCROCI.length);
    expect(FILI.slice(0, RAMI.length).every((f) => !f.incrocio)).toBe(true);
    expect(FILI.slice(RAMI.length).every((f) => f.incrocio)).toBe(true);
  });

  it("ogni nodo ha il suo posto di riposo, quello del disegno", () => {
    for (const n of NODI) expect(riposo.get(n.id)).toEqual({ x: n.x, y: n.y });
  });
});

describe("l'ago", () => {
  it("ci mette un tanto per tappa, ma mai piu' del tetto", () => {
    expect(durataAgo(1)).toBeCloseTo(0.26);
    expect(durataAgo(10)).toBeCloseTo(2.6);
    expect(durataAgo(20)).toBeCloseTo(5.2);
    expect(durataAgo(100)).toBe(5.2);
  });

  it("guarda un poco avanti sul filo, senza uscire dalla fine", () => {
    expect(avanti(10, 100)).toBe(12);
    expect(avanti(99, 100)).toBe(100);
  });

  it("punta lungo il filo: il disegno e' verticale, quindi un quarto di giro in piu'", () => {
    expect(posaAgo(0, { x: 0, y: 0 }, { x: 1, y: 0 })).toBe("translate(0 0) rotate(90)");
    expect(posaAgo(0, { x: 5, y: 5 }, { x: 5, y: 7 })).toBe("translate(5 5) rotate(180)");
  });

  it("dondola su e giu' di quattro unita' al massimo", () => {
    const quota = (q: number) => {
      const m = posaAgo(q, { x: 0, y: 100 }, { x: 1, y: 100 }).match(/translate\(0 ([^)]+)\)/);
      return Number(m![1]) - 100;
    };
    const quote = Array.from({ length: 200 }, (_, i) => quota(i / 199));
    expect(Math.max(...quote)).toBeLessThanOrEqual(4);
    expect(Math.min(...quote)).toBeGreaterThanOrEqual(-4);
    expect(Math.max(...quote)).toBeGreaterThan(3.9);
  });

  it("accende le tappe che ha raggiunto, con mezza unita' di tolleranza", () => {
    const soglie = [0, 50, 120, 200];
    expect(tappeCucite(soglie, 10, 1)).toBe(1);
    expect(tappeCucite(soglie, 49.5, 1)).toBe(2);
    expect(tappeCucite(soglie, 49.4, 1)).toBe(1);
    expect(tappeCucite(soglie, 130, 1)).toBe(3);
    expect(tappeCucite(soglie, 500, 1)).toBe(4);
  });

  it("non torna indietro sulle tappe gia' fatte", () => {
    expect(tappeCucite([0, 50, 120], 0, 3)).toBe(3);
  });
});

describe("il trascinamento", () => {
  it("sotto la soglia e' un clic, dalla soglia in su un trascinamento", () => {
    const da = { x: 100, y: 100 };
    expect(oltreSoglia(da, { x: 103, y: 104 })).toBe(false);
    expect(oltreSoglia(da, { x: 100 + SOGLIA_TRASCINA, y: 100 })).toBe(true);
    expect(oltreSoglia(da, { x: 90, y: 100 })).toBe(true);
  });

  it("riporta un punto dello schermo nelle unita' della mappa", () => {
    // Una mappa scalata a meta' e spostata di (10, 20): l'inversa raddoppia e toglie.
    const inversa = { a: 2, b: 0, c: 0, d: 2, e: -20, f: -40 };
    expect(inMappa(inversa, 60, 70)).toEqual({ x: 100, y: 100 });
  });
});
