import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import { SHAPES, buildShape } from "../build-desk.mjs";

describe("le sagome del tavolo", () => {
  it("sono sette, una per ogni forma dichiarata nel contenuto", () => {
    expect(Object.keys(SHAPES).sort()).toEqual(
      ["card", "laptop", "phone", "plate", "postit", "rack", "sheet"],
    );
  });

  it("escono identiche a ogni build: il tremolio e' seminato, non casuale", () => {
    for (const name of Object.keys(SHAPES)) {
      expect(buildShape(name), name).toBe(buildShape(name));
    }
  });

  it("sono quelle che stanno in public/brand/desk: i file committati non invecchiano", () => {
    // La prova qui sopra confronta il generatore con se stesso: dice che non
    // c'e' caso in giro, non che i sette file spediti siano aggiornati. Il CSS
    // le monta come maschere da /brand/desk/*.svg, quindi quello che si vede e'
    // il file, non il generatore: ritoccare una sagoma e scordarsi
    // `npm run assets` spedisce il disegno vecchio, e senza questa prova se ne
    // accorgerebbe solo un viewBox cambiato — un path no, e i path sono tutto
    // il disegno.
    for (const name of Object.keys(SHAPES)) {
      const file = resolve(process.cwd(), `public/brand/desk/${name}.svg`);
      expect(readFileSync(file, "utf8"), `${name}.svg e' da rigenerare: npm run assets`).toBe(
        buildShape(name),
      );
    }
  });

  it("prendono il colore da chi le contiene e non ingrassano il tratto quando si scalano", () => {
    for (const name of Object.keys(SHAPES)) {
      const svg = buildShape(name);
      expect(svg, name).toContain('stroke="currentColor"');
      expect(svg, name).toContain('vector-effect="non-scaling-stroke"');
      expect(svg, name).toContain('aria-hidden="true"');
    }
  });

  it("tremano: nessun bordo e' una retta perfetta", () => {
    // Un rettangolo perfetto avrebbe coordinate ripetute. Un tratto a mano no.
    const svg = buildShape("sheet");
    const xs = [...svg.matchAll(/L(-?\d+\.\d+)/g)].map((m) => Number(m[1]));
    expect(new Set(xs).size).toBeGreaterThan(xs.length * 0.8);
  });

  it("dichiarano un viewBox, cosi' una sagoma sola serve ogni misura", () => {
    for (const name of Object.keys(SHAPES)) {
      expect(buildShape(name), name).toMatch(/viewBox="0 0 \d+ \d+"/);
    }
  });
});
