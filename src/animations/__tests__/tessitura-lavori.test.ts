import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

// Il filo dei Lavori non c'e' piu': i Lavori sono un archivio di cartelle
// sticky, e il filo si interrompe fra «Partiamo da qui» e «Come lavoro» (vedi
// INTERRUZIONE in anchors.ts). Con lui se ne sono andate la sua finestra e le
// prove che la tenevano dietro la freccia della pratica. Restano le due che non
// parlavano dei Lavori ma del buco in cui erano caduti: una finestra passata
// da un Server Component arriva `undefined`, e ci sono voluti tre tentativi
// per accorgersene.
describe("le finestre del filo restano dal lato giusto del confine", () => {
  it("ThreadSegment sceglie la finestra da se', dentro il lato client", () => {
    const src = readFileSync("src/components/thread/ThreadSegment.tsx", "utf8");
    expect(src).toContain("FINESTRE_FILO[section]");
    expect(src).toMatch(/start:\s*finestra\?\.inizio/);
  });

  it("il modulo delle finestre non e' un modulo client, o il buco torna", () => {
    const src = readFileSync("src/animations/finestre.ts", "utf8");
    expect(src.startsWith('"use client"')).toBe(false);
    expect(src).not.toContain('from "./gsap"');
  });
});
