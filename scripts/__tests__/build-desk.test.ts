import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import { SHAPES, buildShape, buildFill } from "../build-desk.mjs";

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
    // c'e' caso in giro, non che i file spediti siano aggiornati. Il CSS li
    // monta come maschere da /brand/desk/*.svg, quindi quello che si vede e'
    // il file, non il generatore: ritoccare una sagoma e scordarsi
    // `npm run assets` spedisce il disegno vecchio, e senza questa prova se ne
    // accorgerebbe solo un viewBox cambiato — un path no, e i path sono tutto
    // il disegno.
    //
    // Vale per tutti e due gli strati: il pieno e' un file come il contorno, e
    // un pieno vecchio sotto un contorno nuovo non e' un disegno vecchio, e'
    // un alone.
    for (const name of Object.keys(SHAPES)) {
      const contorno = resolve(process.cwd(), `public/brand/desk/${name}.svg`);
      expect(readFileSync(contorno, "utf8"), `${name}.svg e' da rigenerare: npm run assets`).toBe(
        buildShape(name),
      );
      const pieno = resolve(process.cwd(), `public/brand/desk/${name}-fill.svg`);
      expect(
        readFileSync(pieno, "utf8"),
        `${name}-fill.svg e' da rigenerare: npm run assets`,
      ).toBe(buildFill(name));
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

/**
 * Il secondo strato. Una maschera CSS dipinge un colore solo: finche' la
 * sagoma era un tracciato e basta, foglio, scheda e telefono erano lo stesso
 * grigio identico. Il pieno e' il file che restituisce i materiali — il solo
 * contorno esterno, chiuso, sotto il tracciato.
 */
describe("i pieni delle sagome", () => {
  it("escono identici a ogni build, come i contorni", () => {
    for (const name of Object.keys(SHAPES)) {
      expect(buildFill(name), name).toBe(buildFill(name));
    }
  });

  it("sono LO STESSO contorno esterno, non un secondo tremolio", () => {
    // E' la prova che tiene i due strati a registro. Un contorno tremolato a
    // parte non combacerebbe con quello disegnato sopra, e ogni oggetto del
    // tavolo avrebbe un alone dove il pieno sborda o si ritira.
    for (const name of Object.keys(SHAPES)) {
      const d = buildFill(name).match(/ d="([^"]+)"/);
      expect(d, `${name}: il pieno non ha un path`).not.toBeNull();
      expect(buildShape(name), `${name}: il pieno non ricalca il contorno`).toContain(
        `d="${d![1]}"`,
      );
    }
  });

  it("hanno un path solo: e' una superficie, non un disegno", () => {
    for (const name of Object.keys(SHAPES)) {
      expect(buildFill(name).match(/<path/g)?.length, name).toBe(1);
      expect(buildFill(name), name).not.toContain("stroke");
    }
  });

  it("prendono il colore da chi li contiene e dichiarano il viewBox della sagoma", () => {
    for (const [name, spec] of Object.entries(SHAPES)) {
      const svg = buildFill(name);
      expect(svg, name).toContain('fill="currentColor"');
      expect(svg, name).toContain('aria-hidden="true"');
      expect(svg, name).toContain(`viewBox="0 0 ${spec.w} ${spec.h}"`);
    }
  });
});
