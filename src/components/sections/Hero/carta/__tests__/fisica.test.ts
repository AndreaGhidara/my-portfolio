import { describe, it, expect } from "vitest";
import { GRAVITA, aRiposo, lancio, passo, type Muri, type Pezzo } from "../fisica";

const MURI: Muri = { largo: 1200, alto: 800 };
const pezzo = (p: Partial<Pezzo> = {}): Pezzo => ({
  x: 600, y: 100, vx: 0, vy: 0, rot: 0, vrot: 0, raggio: 30, tenuta: false, ...p,
});
/** Manda avanti la simulazione, di default senza scorrimento. */
const avanti = (p: Pezzo, giri: number, scorrimento = 0) => {
  for (let i = 0; i < giri; i++) passo(p, 1 / 60, MURI, scorrimento);
  return p;
};

describe("la caduta", () => {
  it("cade, e accelera", () => {
    // Dopo un fotogramma la velocita' e' la gravita' meno un po' d'aria: il
    // confronto e' con GRAVITA/60 a meno di quella, non con GRAVITA/60 esatta.
    const dopoUno = passo(pezzo(), 1 / 60, MURI, 0).vy;
    expect(dopoUno).toBeGreaterThan(0);
    expect(dopoUno).toBeLessThanOrEqual(GRAVITA / 60);
    expect(dopoUno).toBeGreaterThan((GRAVITA / 60) * 0.98);
    const p = pezzo();
    const primi = avanti(p, 10).y - 100;
    const dopo = avanti(p, 10).y - 100 - primi;
    expect(dopo, "il secondo decimo di secondo copre piu' strada del primo").toBeGreaterThan(primi);
  });

  it("in mano non cade e non si sposta", () => {
    const p = pezzo({ tenuta: true, vy: 900 });
    const prima = { ...p };
    avanti(p, 60);
    expect(p.x).toBe(prima.x);
    expect(p.y).toBe(prima.y);
  });

  it("si posa sul fondo e ci resta", () => {
    const p = avanti(pezzo(), 600);
    expect(p.y).toBeCloseTo(MURI.alto - p.raggio - 10, 0);
    expect(aRiposo(p, MURI)).toBe(true);
  });

  it("rimbalza molto meno di come arriva: e' carta, non gomma", () => {
    // Il paragone giusto e' fra la velocita' d'IMPATTO e quella di rimbalzo.
    // Confrontarla con la velocita' iniziale non direbbe niente: cadendo
    // accelera, e il rimbalzo puo' superare la partenza restando ben smorzato.
    const p = pezzo({ y: 400, vy: 300 });
    let impatto = 0;
    let rimbalzo = 0;
    for (let i = 0; i < 400; i++) {
      const prima = p.vy;
      passo(p, 1 / 60, MURI, 0);
      if (prima > 0 && p.vy < 0) {
        impatto = prima;
        rimbalzo = -p.vy;
        break;
      }
    }
    expect(impatto, "deve toccare terra").toBeGreaterThan(0);
    expect(rimbalzo).toBeLessThan(impatto * 0.5);
  });

  it("lanciata di lato non esce dallo schermo", () => {
    const destra = avanti(pezzo({ vx: 4000 }), 300);
    expect(destra.x).toBeLessThanOrEqual(MURI.largo - destra.raggio + 0.001);
    const sinistra = avanti(pezzo({ vx: -4000 }), 300);
    expect(sinistra.x).toBeGreaterThanOrEqual(sinistra.raggio - 0.001);
  });

  it("ferma a terra smette anche di girare", () => {
    // Senza questo la pallina posata continuava a ruotare per conto suo, che
    // e' il dettaglio che rovina tutto il resto.
    const p = avanti(pezzo({ vx: 300, vrot: 900 }), 600);
    expect(Math.abs(p.vrot)).toBeLessThan(20);
  });
});

describe("lo scorrimento se la porta dietro", () => {
  it("scorrendo la pagina la pallina resta indietro e poi si rimette in fondo", () => {
    // E' il gesto che l'utente ha chiesto: «mentre scorriamo vedremo i pezzi di
    // carta che scendono giu' con noi». Il bordo basso della finestra scappa,
    // la pallina resta indietro, la gravita' la richiama.
    const p = avanti(pezzo(), 600);
    const posata = p.y;
    passo(p, 1 / 60, MURI, 400);
    expect(p.y, "appena scorri, resta indietro").toBeLessThan(posata - 100);
    avanti(p, 600);
    expect(p.y, "poi torna in fondo").toBeCloseTo(posata, 0);
  });

  it("senza scorrimento non si muove da sola", () => {
    const p = avanti(pezzo(), 600);
    const ferma = p.y;
    avanti(p, 120);
    expect(p.y).toBeCloseTo(ferma, 6);
  });
});

describe("il lancio", () => {
  it("prende la velocita' dalle ultime posizioni del puntatore", () => {
    // 100px in 100ms = 1000px/s.
    const v = lancio([{ x: 0, y: 0, t: 0 }, { x: 100, y: -50, t: 100 }]);
    expect(v.vx).toBeCloseTo(1000, 0);
    expect(v.vy).toBeCloseTo(-500, 0);
  });

  it("senza storia non lancia niente invece di dividere per zero", () => {
    expect(lancio([])).toEqual({ vx: 0, vy: 0 });
    expect(lancio([{ x: 5, y: 5, t: 12 }])).toEqual({ vx: 0, vy: 0 });
  });

  it("due posizioni nello stesso istante non danno velocita' infinita", () => {
    const v = lancio([{ x: 0, y: 0, t: 500 }, { x: 90, y: 0, t: 500 }]);
    expect(Number.isFinite(v.vx)).toBe(true);
  });
});
