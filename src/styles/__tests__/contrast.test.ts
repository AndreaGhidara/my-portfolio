import { describe, it, expect } from "vitest";
import { contrastRatio, relativeLuminance } from "../contrast";
import { palette } from "../palette";

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
