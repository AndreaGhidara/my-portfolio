import { describe, it, expect } from "vitest";
import { contrastRatio, relativeLuminance } from "../contrast";
import { palette } from "../palette";
import { LINGUETTA, PARAMETRI, tonoLinguetta } from "../../components/sections/Works/archivio";

describe("relativeLuminance", () => {
  it("vale 0 sul nero e 1 sul bianco", () => {
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 5);
    expect(relativeLuminance("#FFFFFF")).toBeCloseTo(1, 5);
  });
});

describe("contrastRatio", () => {
  it("dà 21:1 tra bianco e nero", () => {
    expect(contrastRatio("#FFFFFF", "#000000")).toBeCloseTo(21, 1);
  });

  it("è simmetrico", () => {
    expect(contrastRatio(palette.ink, palette.orange))
      .toBeCloseTo(contrastRatio(palette.orange, palette.ink), 5);
  });
});

describe("vincoli di accessibilità della spec", () => {
  it("inchiostro su carta supera AAA per il testo corrente", () => {
    expect(contrastRatio(palette.ink, palette.paper)).toBeGreaterThanOrEqual(7);
  });

  it("inchiostro su arancio supera AA: è il colore obbligatorio delle descrizioni nel blocco servizi", () => {
    expect(contrastRatio(palette.ink, palette.orange)).toBeGreaterThanOrEqual(4.5);
  });

  it("carta su arancio NON raggiunge AA: ammessa solo per testo grande", () => {
    const ratio = contrastRatio(palette.paper, palette.orange);
    expect(ratio).toBeGreaterThanOrEqual(3);
    expect(ratio).toBeLessThan(4.5);
  });

  it("arancio su carta NON raggiunge AA: mai testo corrente arancione", () => {
    expect(contrastRatio(palette.orange, palette.paper)).toBeLessThan(4.5);
  });

  it("testo secondario su carta supera AA", () => {
    expect(contrastRatio(palette.muted, palette.paper)).toBeGreaterThanOrEqual(4.5);
  });

  it("il verde dell'esito supera AA sulla carta: e' segno e bordo, e un giorno puo' essere testo", () => {
    expect(contrastRatio(palette.green, palette.paper)).toBeGreaterThanOrEqual(4.5);
  });

  it("il verde si legge sul fondo VERO del riquadro, nei due temi", () => {
    // Il fondo del riquadro non e' un token: e' il verde tinto al 9% dentro la
    // superficie, cioe' una color-mix che sa risolvere solo il browser. I due
    // valori qui sotto sono quelli letti da li', disegnando il colore su una
    // tela e leggendo il pixel: a mente non si ricavano.
    const fondoChiaro = "#E3E5D9";
    const fondoScuro = "#292B24";
    // 3:1 e' la soglia WCAG per gli elementi non testuali, e la spunta con la
    // barra di bordo stanno li' dentro.
    expect(contrastRatio(palette.green, fondoChiaro)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(palette.greenDark, fondoScuro)).toBeGreaterThanOrEqual(3);
    // Ed ecco perche' i verdi sono due: quello di carta, sul fondo scuro, fa
    // 2,39:1. Un "e' andata bene" che in tema scuro non si vede.
    expect(contrastRatio(palette.green, fondoScuro)).toBeLessThan(3);
  });
});

describe("tema scuro", () => {
  it("il testo secondario scuro supera AA su inchiostro", () => {
    expect(contrastRatio(palette.mutedDark, palette.ink)).toBeGreaterThanOrEqual(4.5);
  });

  it("l'arancio su inchiostro è ammesso solo per testo grande", () => {
    expect(contrastRatio(palette.orange, palette.ink)).toBeGreaterThanOrEqual(3);
  });

  it("il border scuro (--line = --muted in tema scuro) supera 3:1 su inchiostro: soglia WCAG per elementi non testuali", () => {
    expect(contrastRatio(palette.muted, palette.ink)).toBeGreaterThanOrEqual(3);
  });

  it("la lampadina accesa supera 3:1 su inchiostro: soglia WCAG per elementi non testuali", () => {
    expect(contrastRatio(palette.bulb, palette.ink)).toBeGreaterThanOrEqual(3);
  });

  it("la lampadina accesa e' invisibile su carta: per questo si accende solo in tema scuro", () => {
    expect(contrastRatio(palette.bulb, palette.paper)).toBeLessThan(1.5);
  });
});

describe("il filo che attraversa la pagina", () => {
  /**
   * Difetto vero, arrivato in pagina. Il filo era disegnato con --line, che e'
   * scelto contro il fondo di PAGINA e non e' mai stato verificato contro
   * l'arancio, che e' il fondo di due sezioni intere: «Cosa stai cercando?» e
   * «Dove ho imparato», che il filo attraversa tutte e due.
   * La soglia e' 3:1, WCAG 2.1 per gli elementi non testuali.
   */
  const SOGLIA = 3;

  it("si legge sulla carta", () => {
    expect(contrastRatio(palette.muted, palette.paper)).toBeGreaterThanOrEqual(SOGLIA);
  });

  it("si legge sull'inchiostro", () => {
    expect(contrastRatio(palette.muted, palette.ink)).toBeGreaterThanOrEqual(SOGLIA);
  });

  it("si legge sull'arancio, che e' il fondo di due sezioni intere", () => {
    expect(contrastRatio(palette.ink, palette.orange)).toBeGreaterThanOrEqual(SOGLIA);
  });

  it("il colore vecchio del filo sull'arancio NON si leggeva: e' il difetto che questi test bloccano", () => {
    expect(contrastRatio(palette.graph, palette.orange)).toBeLessThan(SOGLIA);
    expect(contrastRatio(palette.graph, palette.paper)).toBeLessThan(SOGLIA);
  });
});

describe("l'archivio dei Lavori", () => {
  // Anche qui i fondi e i testi sono color-mix: i valori sono quelli risolti da
  // Chrome (disegnati su una tela e letti dal pixel), non ricavati a mente.
  const dorsoChiaro = "#DBD7CF"; // inchiostro al 10% nella carta
  const tenueChiaro = "#5A5449"; // --fg-muted all'80% verso --fg
  const facciaScura = "#262420"; // inchiostro al 90% con la carta
  const dorsoScuro = "#1F1D19"; // inchiostro al 94% con la carta
  const riquadroScuro = "#383531"; // carta al 10% nella faccia scura
  const accentoScuro = "#E86944"; // arancio al 90% verso la carta

  it("sul chiaro l'anno della linguetta e la scritta del riservato superano AA", () => {
    // Col tenue globale erano 3,90:1: il dorso e' piu' scuro della carta.
    expect(contrastRatio(palette.muted, dorsoChiaro)).toBeLessThan(4.5);
    expect(contrastRatio(tenueChiaro, dorsoChiaro)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(tenueChiaro, palette.paper)).toBeGreaterThanOrEqual(4.5);
  });

  it("sullo scuro il tenue globale basta gia'", () => {
    expect(contrastRatio(palette.mutedDark, dorsoScuro)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(palette.mutedDark, riquadroScuro)).toBeGreaterThanOrEqual(4.5);
  });

  /**
   * Il fondo della linguetta a profondita' p: il dorso mischiato con
   * l'inchiostro in sRGB, come fa il CSS (color-mix in srgb), che e' la stessa
   * cosa di un velo d'inchiostro sopra. Nel tono chiaro il velo non scende
   * sotto LINGUETTA.buioMinimo.
   */
  const fondoLinguetta = (dorso: string, p: number) => {
    const quota = Math.min(
      1,
      tonoLinguetta(p) === 2
        ? Math.max(p * PARAMETRI.scurisce, LINGUETTA.buioMinimo)
        : p * PARAMETRI.scurisce,
    );
    const canali = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const a = canali(dorso);
    const b = canali(palette.ink);
    return (
      "#" +
      a.map((v, i) => Math.round(v * (1 - quota) + b[i] * quota).toString(16).padStart(2, "0")).join("")
    );
  };
  /** Nome e anno nei tre toni: sul chiaro cambiano, sullo scuro no. */
  const testiChiaro = (p: number) =>
    [
      [palette.ink, tenueChiaro],
      [palette.ink, palette.ink],
      [palette.paper, palette.paper],
    ][tonoLinguetta(p)];
  const testiScuro = [palette.paper, palette.mutedDark];

  it("la linguetta si legge alle due profondita' estreme, nei due temi", () => {
    for (const p of [0, 3]) {
      for (const testo of testiChiaro(p)) {
        expect(contrastRatio(testo, fondoLinguetta(dorsoChiaro, p)), `chiaro a ${p}`).toBeGreaterThanOrEqual(4.5);
      }
      for (const testo of testiScuro) {
        expect(contrastRatio(testo, fondoLinguetta(dorsoScuro, p)), `scuro a ${p}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("e anche a ogni profondita' di mezzo, mentre la cartella scende", () => {
    for (let p = 0; p <= 3.0001; p += 0.01) {
      for (const testo of testiChiaro(p)) {
        expect(
          contrastRatio(testo, fondoLinguetta(dorsoChiaro, p)),
          `chiaro a ${p.toFixed(2)}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
      for (const testo of testiScuro) {
        expect(
          contrastRatio(testo, fondoLinguetta(dorsoScuro, p)),
          `scuro a ${p.toFixed(2)}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("«Apri il caso» sullo scuro supera AA solo con l'arancio schiarito", () => {
    // Pieno faceva 4,21:1 sulla faccia, che e' un gradino sopra l'inchiostro.
    expect(contrastRatio(palette.orange, facciaScura)).toBeLessThan(4.5);
    expect(contrastRatio(accentoScuro, facciaScura)).toBeGreaterThanOrEqual(4.5);
  });
});
