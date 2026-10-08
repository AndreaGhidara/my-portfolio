import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

// Il buco in cui e' caduta una costante passata da un Server Component: da un
// modulo client arriva `undefined`, e ci sono voluti tre tentativi per
// accorgersene. Vedi il commento in cima a finestre.ts.
describe("le righe d'innesco restano dal lato giusto del confine", () => {
  it("il modulo delle finestre non e' un modulo client, o il buco torna", () => {
    const src = readFileSync("src/animations/timing.ts", "utf8");
    expect(src.startsWith('"use client"')).toBe(false);
    expect(src).not.toContain('from "./gsap"');
  });
});
