import { describe, it, expect } from "vitest";
import { GRAVITY, atRest, fling, physicsStep, type Piece, type Walls } from "../physics";

const WALLS: Walls = { width: 1200, height: 800 };
const piece = (p: Partial<Piece> = {}): Piece => ({
  x: 600, y: 100, vx: 0, vy: 0, rot: 0, vrot: 0, radius: 30, held: false, ...p,
});
const advance = (p: Piece, frames: number, scrollDelta = 0) => {
  for (let i = 0; i < frames; i++) physicsStep(p, 1 / 60, WALLS, scrollDelta);
  return p;
};

describe("la caduta", () => {
  it("cade, e accelera", () => {
    // Dopo un fotogramma: GRAVITY/60 meno un po' d'aria, non esatta.
    const afterOne = physicsStep(piece(), 1 / 60, WALLS, 0).vy;
    expect(afterOne).toBeGreaterThan(0);
    expect(afterOne).toBeLessThanOrEqual(GRAVITY / 60);
    expect(afterOne).toBeGreaterThan((GRAVITY / 60) * 0.98);
    const p = piece();
    const first = advance(p, 10).y - 100;
    const second = advance(p, 10).y - 100 - first;
    expect(second, "il secondo decimo di secondo copre piu' strada del primo").toBeGreaterThan(first);
  });

  it("in mano non cade e non si sposta", () => {
    const p = piece({ held: true, vy: 900 });
    const before = { ...p };
    advance(p, 60);
    expect(p.x).toBe(before.x);
    expect(p.y).toBe(before.y);
  });

  it("si posa sul fondo e ci resta", () => {
    const p = advance(piece(), 600);
    expect(p.y).toBeCloseTo(WALLS.height - p.radius - 10, 0);
    expect(atRest(p, WALLS)).toBe(true);
  });

  it("rimbalza molto meno di come arriva: e' carta, non gomma", () => {
    // Il confronto giusto e' con la velocita' d'impatto: cadendo accelera.
    const p = piece({ y: 400, vy: 300 });
    let impact = 0;
    let bounce = 0;
    for (let i = 0; i < 400; i++) {
      const before = p.vy;
      physicsStep(p, 1 / 60, WALLS, 0);
      if (before > 0 && p.vy < 0) {
        impact = before;
        bounce = -p.vy;
        break;
      }
    }
    expect(impact, "deve toccare terra").toBeGreaterThan(0);
    expect(bounce).toBeLessThan(impact * 0.5);
  });

  it("lanciata di lato non esce dallo schermo", () => {
    const right = advance(piece({ vx: 4000 }), 300);
    expect(right.x).toBeLessThanOrEqual(WALLS.width - right.radius + 0.001);
    const left = advance(piece({ vx: -4000 }), 300);
    expect(left.x).toBeGreaterThanOrEqual(left.radius - 0.001);
  });

  it("ferma a terra smette anche di girare", () => {
    // La pallina posata continuava a ruotare per conto suo.
    const p = advance(piece({ vx: 300, vrot: 900 }), 600);
    expect(Math.abs(p.vrot)).toBeLessThan(20);
  });
});

describe("lo scorrimento se la porta dietro", () => {
  it("scorrendo la pagina la pallina resta indietro e poi si rimette in fondo", () => {
    // Il bordo basso scappa, la pallina resta indietro e la gravita' la richiama.
    const p = advance(piece(), 600);
    const rested = p.y;
    physicsStep(p, 1 / 60, WALLS, 400);
    expect(p.y, "appena scorri, resta indietro").toBeLessThan(rested - 100);
    advance(p, 600);
    expect(p.y, "poi torna in fondo").toBeCloseTo(rested, 0);
  });

  it("senza scorrimento non si muove da sola", () => {
    const p = advance(piece(), 600);
    const still = p.y;
    advance(p, 120);
    expect(p.y).toBeCloseTo(still, 6);
  });
});

describe("il lancio", () => {
  it("prende la velocita' dalle ultime posizioni del puntatore", () => {
    // 100px in 100ms = 1000px/s.
    const v = fling([{ x: 0, y: 0, t: 0 }, { x: 100, y: -50, t: 100 }]);
    expect(v.vx).toBeCloseTo(1000, 0);
    expect(v.vy).toBeCloseTo(-500, 0);
  });

  it("senza storia non lancia niente invece di dividere per zero", () => {
    expect(fling([])).toEqual({ vx: 0, vy: 0 });
    expect(fling([{ x: 5, y: 5, t: 12 }])).toEqual({ vx: 0, vy: 0 });
  });

  it("due posizioni nello stesso istante non danno velocita' infinita", () => {
    const v = fling([{ x: 0, y: 0, t: 500 }, { x: 90, y: 0, t: 500 }]);
    expect(Number.isFinite(v.vx)).toBe(true);
  });
});
