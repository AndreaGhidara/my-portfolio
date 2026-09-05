import { describe, it, expect } from "vitest";
import {
  LATO,
  RAGGIO,
  GRADINI,
  celleInProfondita,
  campo,
  maglia,
  mappaAffine,
  posizioni,
  rng,
  veloPer,
  type Punto,
  type Terna,
} from "../geometria";

const p = (x: number, y: number): Punto => ({ x, y });
const applica = (m: readonly number[], q: Punto) => ({
  x: m[0] * q.x + m[2] * q.y + m[4],
  y: m[1] * q.x + m[3] * q.y + m[5],
});

describe("la mappa affine", () => {
  const S: Terna = [p(0, 0), p(10, 0), p(0, 10)];

  it("sull'identita' restituisce l'identita'", () => {
    // E' la prova che avrebbe preso il difetto vero. La prima stesura usava una
    // formula compatta con due segni invertiti e qui dava (1,0,0,-1,0,0): le
    // lettere si disegnavano specchiate in verticale. Guardando il codice non
    // si vedeva; guardando questo numero si vede subito.
    expect(mappaAffine(S, S)).toEqual([1, 0, 0, 1, 0, 0]);
  });

  it("porta davvero ogni vertice sul suo, comunque sia messo il triangolo", () => {
    const casi: Array<[string, Terna]> = [
      ["traslato", [p(5, 7), p(15, 7), p(5, 17)]],
      ["scalato", [p(0, 0), p(20, 0), p(0, 20)]],
      ["ruotato di 90", [p(0, 0), p(0, 10), p(-10, 0)]],
      ["deformato", [p(3, 1), p(12, 4), p(-2, 9)]],
    ];
    for (const [nome, D] of casi) {
      const m = mappaAffine(S, D);
      expect(m, nome).not.toBeNull();
      for (let k = 0; k < 3; k++) {
        const q = applica(m!, S[k]);
        expect(q.x, `${nome}: x del vertice ${k}`).toBeCloseTo(D[k].x, 9);
        expect(q.y, `${nome}: y del vertice ${k}`).toBeCloseTo(D[k].y, 9);
      }
    }
  });

  it("su un triangolo degenere non inventa una mappa", () => {
    expect(mappaAffine([p(0, 0), p(5, 5), p(10, 10)], S)).toBeNull();
  });
});

describe("il generatore e il campo", () => {
  it("e' deterministico: lo stesso seme da' la stessa carta", () => {
    // Le pieghe devono essere identiche a ogni caricamento, come le sagome del
    // tavolo. Con Math.random() la lettera cambierebbe forma a ogni visita.
    expect(maglia(11)).toEqual(maglia(11));
  });

  it("semi diversi danno pieghe diverse", () => {
    expect(maglia(11)).not.toEqual(maglia(12));
  });

  it("il campo e' liscio: due punti vicini danno valori vicini", () => {
    // La grana grossa e' quello che tiene insieme le facce. Se il campo fosse
    // rumore puro la carta si sbriciolerebbe invece di piegarsi a pezzi.
    const f = campo(rng(5), 3);
    let salto = 0;
    for (let i = 0; i < 40; i++) {
      const u = i / 40;
      salto = Math.max(salto, Math.abs(f(u, 0.5) - f(u + 0.025, 0.5)));
    }
    expect(salto).toBeLessThan(0.2);
  });
});

describe("la pallina", () => {
  const semi = [11, 24, 37, 50];

  it("e' piccola: il diametro sta sotto la meta' del foglio", () => {
    // A 0,46 di raggio — la prima stesura — il foglio restava un quadrato
    // rimpicciolito e si vedeva il suo bordo accartocciarsi.
    for (const s of semi) {
      const r = Math.max(...maglia(s).map((v) => Math.hypot(v.bx, v.by)));
      expect(2 * r, `seme ${s}`).toBeLessThan(0.5);
      expect(2 * r, `seme ${s}`).toBeGreaterThan(0.25);
    }
  });

  it("il foglio si ripiega su se stesso invece di rimpicciolirsi", () => {
    // LA proprieta' di questo modulo, e la ragione per cui la pallina si legge
    // come carta appallottolata. Se il raggio d'arrivo seguisse quello di
    // partenza — mappatura quadrato -> disco — la correlazione sarebbe circa
    // +1 e la forma del foglio sopravviverebbe intatta.
    for (const s of semi) {
      const v = maglia(s);
      const da = v.map((q) => Math.hypot(q.u - 0.5, q.w - 0.5));
      const a = v.map((q) => Math.hypot(q.bx, q.by));
      const md = da.reduce((x, y) => x + y) / da.length;
      const ma = a.reduce((x, y) => x + y) / a.length;
      let cov = 0;
      let sd = 0;
      let sa = 0;
      for (let i = 0; i < v.length; i++) {
        cov += (da[i] - md) * (a[i] - ma);
        sd += (da[i] - md) ** 2;
        sa += (a[i] - ma) ** 2;
      }
      const corr = cov / Math.sqrt(sd * sa);
      expect(Math.abs(corr), `seme ${s}: correlazione partenza→arrivo`).toBeLessThan(0.6);
    }
  });

  it("il bordo del foglio finisce dentro la pallina", () => {
    // L'altra faccia della stessa proprieta', detta in modo che si veda: se il
    // bordo restasse fuori, il quadrato resterebbe riconoscibile.
    for (const s of semi) {
      const v = maglia(s);
      const raggioMax = Math.max(...v.map((q) => Math.hypot(q.bx, q.by)));
      const bordo = v.filter((q) => Math.hypot(q.u - 0.5, q.w - 0.5) > 0.45);
      const dentro = bordo.filter((q) => Math.hypot(q.bx, q.by) < raggioMax * 0.5);
      expect(dentro.length, `seme ${s}`).toBeGreaterThan(bordo.length * 0.1);
    }
  });
});

describe("il collasso", () => {
  const mesh = maglia(11);
  const centro = { x: 100, y: 100 };

  it("a foglio disteso i vertici sono dove il foglio li mette", () => {
    const q = posizioni(mesh, 0, centro, 200);
    expect(q[0].x).toBeCloseTo(0, 6);
    expect(q[0].y).toBeCloseTo(0, 6);
    expect(q[q.length - 1].x).toBeCloseTo(200, 6);
  });

  it("appallottolato, tutto sta dentro il raggio della pallina", () => {
    const lato = 200;
    for (const q of posizioni(mesh, 1, centro, lato)) {
      expect(Math.hypot(q.x - centro.x, q.y - centro.y)).toBeLessThanOrEqual(RAGGIO * lato + 0.001);
    }
  });

  it("la carta non cede tutta insieme", () => {
    // A meta' strada i vertici non sono tutti allo stesso punto del loro
    // viaggio: e' il ritardo per vertice, ed e' quello che fa sembrare che
    // ceda a pieghe invece di sgonfiarsi.
    const meta = posizioni(mesh, 0.5, centro, 200);
    const distese = posizioni(mesh, 0, centro, 200);
    const fatto = meta.map((q, i) => Math.hypot(q.x - distese[i].x, q.y - distese[i].y));
    expect(Math.max(...fatto) - Math.min(...fatto)).toBeGreaterThan(5);
  });
});

describe("l'ordine di disegno", () => {
  it("va dalla piu' lontana alla piu' vicina, e le conta tutte", () => {
    // Senza quest'ordine le facce si coprono nell'ordine della griglia e il
    // risultato e' un collage piatto: e' questo, piu' dell'ombra, a far
    // leggere una pallina.
    const celle = celleInProfondita(posizioni(maglia(24), 1, { x: 0, y: 0 }, 100));
    expect(celle).toHaveLength(LATO * LATO);
    for (let i = 1; i < celle.length; i++) {
      expect(celle[i].z).toBeGreaterThanOrEqual(celle[i - 1].z);
    }
  });
});

describe("quando compare il foglio", () => {
  it("passando col cursore si vede solo l'inchiostro", () => {
    // Il difetto della prima stesura: il foglio si disegnava subito, era del
    // colore della pagina, e se ne vedeva solo il bordo piegarsi.
    expect(veloPer(0)).toBe(0);
    expect(veloPer(0.25)).toBe(0);
  });

  it("appallottolato il foglio si vede tutto", () => {
    expect(veloPer(1)).toBe(GRADINI - 1);
  });

  it("in mezzo non torna mai indietro", () => {
    let prima = -1;
    for (let t = 0; t <= 1.0001; t += 0.02) {
      const v = veloPer(t);
      expect(v).toBeGreaterThanOrEqual(prima);
      prima = v;
    }
  });
});
