import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { palette } from "../palette";

const css = readFileSync(path.resolve(__dirname, "../tokens.css"), "utf8");

describe("tokens.css", () => {
  it("definisce ogni token della palette con lo stesso valore", () => {
    for (const [name, hex] of Object.entries(palette)) {
      expect(css).toContain(`--${name}: ${hex}`);
    }
  });

  it("definisce il tema scuro invertendo carta e inchiostro", () => {
    expect(css).toContain('[data-theme="dark"]');
    expect(css).toMatch(/\[data-theme="dark"\][\s\S]*--bg:\s*var\(--ink\)/);
  });
});
