import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { palette } from "../palette";

const css = readFileSync(path.resolve(__dirname, "../tokens.css"), "utf8");

describe("tokens.css", () => {
  it("definisce ogni token della palette con lo stesso valore", () => {
    const paletteVarsInCss = ["paper", "ink", "orange", "graph", "muted"];
    for (const name of paletteVarsInCss) {
      expect(css).toContain(`--${name}: ${palette[name as keyof typeof palette]}`);
    }
  });

  it("definisce il tema scuro invertendo carta e inchiostro", () => {
    expect(css).toContain('[data-theme="dark"]');
    expect(css).toMatch(/\[data-theme="dark"\][\s\S]*--bg:\s*var\(--ink\)/);
  });

  it("contiene solo colori hex dalla palette", () => {
    const hexRegex = /#[0-9A-Fa-f]{6}/g;
    const hexesInCss = css.match(hexRegex) || [];
    const hexesInCssLower = hexesInCss.map((h) => h.toLowerCase());
    const paletteHexesLower = Object.values(palette).map((h) =>
      h.toLowerCase(),
    );
    for (const hex of hexesInCssLower) {
      expect(paletteHexesLower).toContain(hex);
    }
  });
});
