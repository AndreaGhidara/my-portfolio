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
});
