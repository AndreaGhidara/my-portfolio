import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
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

  it("un dossier chiuso resta display:none", () => {
    // Difetto vero, gia' arrivato in pagina: dichiarando `display` sul
    // selettore nudo si sovrascrive il display:none che il browser da' a un
    // <dialog> chiuso. Il dossier chiuso restava disegnato e, senza figli,
    // diventava una scatola alta 2px: una linea sotto le cartelle, `fixed`
    // dopo la prima apertura, quindi incollata allo schermo mentre si scorre.
    expect(css).toMatch(/\[data-work-dialog\]:not\(\[open\]\)\s*\{[^}]*display:\s*none/);

    const bareRule = /\[data-work-dialog\]\s*\{[^}]*display\s*:/;
    expect(css).not.toMatch(bareRule);
  });

  it("ogni sagoma del tavolo ha due strati, e i due file esistono davvero", () => {
    // Il pieno e il contorno sono due maschere, e una maschera che punta a un
    // file che non c'e' non e' un errore: e' uno strato che semplicemente non
    // si dipinge. Il tavolo resterebbe verde in ogni prova e piatto in pagina.
    for (const sagoma of ["sheet", "card", "postit", "plate", "rack", "phone", "laptop"]) {
      for (const file of [`${sagoma}.svg`, `${sagoma}-fill.svg`]) {
        expect(css, `${file} non e' montato in tokens.css`).toContain(
          `url("/brand/desk/${file}")`,
        );
        expect(
          existsSync(path.resolve(__dirname, `../../../public/brand/desk/${file}`)),
          `public/brand/desk/${file} non c'e': npm run assets`,
        ).toBe(true);
      }
    }
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
