import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

// Vedi il commento in cima a timing.ts.
describe("le righe d'innesco restano dal lato giusto del confine", () => {
  it("il modulo dei tempi non e' un modulo client, o il buco torna", () => {
    const src = readFileSync("src/animations/timing.ts", "utf8");
    expect(src.startsWith('"use client"')).toBe(false);
    expect(src).not.toContain('from "./gsap"');
  });
});
