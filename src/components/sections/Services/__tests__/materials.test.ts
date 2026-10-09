import { describe, it, expect } from "vitest";
import { contrastRatio } from "@/styles/contrast";
import { palette } from "@/styles/palette";
import { rules } from "@/test/css";
import {
  LEDS,
  SURFACES,
  THEME_TOKENS,
  THRESHOLD,
  mixOklab,
  recipeCss,
  separation,
  shadowCss,
  shadowOverBg,
  tint,
  type SurfaceName,
  type Theme,
} from "../materials";

const THEMES: Theme[] = ["light", "dark"];
const NAMES = Object.keys(SURFACES) as SurfaceName[];

describe("la scala dei materiali", () => {
  it("la miscelazione in oklab e' quella del browser, non un'approssimazione", () => {
    // Valori letti dai pixel di un canvas 1x1: se cade questa, le altre misurano
    // un tavolo che non esiste.
    expect(mixOklab(palette.ink, 15, palette.paper)).toBe("#cfcbc3");
    expect(mixOklab(palette.paper, 15, palette.ink)).toBe("#302d29");
    expect(mixOklab(palette.ink, 78, palette.mutedDark)).toBe("#302d27");
    expect(mixOklab(palette.ink, 78, palette.muted)).toBe("#26231e");
  });

  for (const theme of THEMES) {
    describe(`tema ${theme}`, () => {
      const ground = THEME_TOKENS[theme].bg;

      it("ogni pieno si stacca dal fondo: una superficie che non si vede non e' una superficie", () => {
        for (const name of NAMES) {
          const surface = SURFACES[name];
          // Eccezione dichiarata: su carta il post-it fa 1.08:1, lo tengono tinta e bordo.
          if (surface.family === "fixed") continue;
          const fill = tint(theme, surface[theme].fill);
          expect(
            contrastRatio(fill, ground),
            `${name}: il pieno ${fill} sparisce nel fondo ${ground}`,
          ).toBeGreaterThanOrEqual(THRESHOLD.ground);
        }
      });

      it("la carta e l'apparecchio restano due famiglie", () => {
        // In tema scuro card e rack erano lo stesso colore, 1.00:1.
        const paper = NAMES.filter((n) => SURFACES[n].family === "paper");
        const devices = NAMES.filter((n) => SURFACES[n].family === "device");
        expect(paper.length).toBeGreaterThan(0);
        expect(devices.length).toBeGreaterThan(0);
        for (const c of paper) {
          for (const a of devices) {
            expect(
              separation(theme, SURFACES[c][theme].fill, SURFACES[a][theme].fill),
              `${c} e ${a} sono la stessa cosa: ${tint(theme, SURFACES[c][theme].fill)} contro ${tint(theme, SURFACES[a][theme].fill)}`,
            ).toBeGreaterThanOrEqual(THRESHOLD.families);
          }
        }
      });

      it("i gradini della carta restano tre gradini", () => {
        const paper: SurfaceName[] = ["sheet", "card", "plate"];
        for (let i = 0; i < paper.length; i++) {
          for (let j = i + 1; j < paper.length; j++) {
            expect(
              separation(theme, SURFACES[paper[i]][theme].fill, SURFACES[paper[j]][theme].fill),
              `${paper[i]} e ${paper[j]} sono lo stesso cartoncino`,
            ).toBeGreaterThanOrEqual(THRESHOLD.steps);
          }
        }
      });

      it("ogni tratto si stacca dal suo pieno: e' il tratto a fare il disegno", () => {
        for (const name of NAMES) {
          const { fill, line } = SURFACES[name][theme];
          // Il post-it bianco eredita il tratto degli altri post-it.
          const stroke = line ?? SURFACES.postit[theme].line;
          if (!stroke) continue;
          expect(
            separation(theme, fill, stroke),
            `${name}: il tratto sparisce dentro il suo pieno`,
          ).toBeGreaterThanOrEqual(THRESHOLD.outline);
        }
      });

      it("l'ombra portata esiste davvero, composta sul fondo", () => {
        // In tema scuro --bg e' --ink: un'ombra d'inchiostro non si vedeva.
        const composite = shadowOverBg(theme);
        expect(
          contrastRatio(composite, ground),
          `l'ombra ${composite} e' il fondo ${ground}`,
        ).toBeGreaterThanOrEqual(THRESHOLD.shadow);
      });
    });
  }

  it("il post-it e i led non seguono il tema: sono colore vero", () => {
    expect(recipeCss(SURFACES.postit.light.fill)).toBe(recipeCss(SURFACES.postit.dark.fill));
    expect(recipeCss(SURFACES.postit.light.line!)).toBe(recipeCss(SURFACES.postit.dark.line!));
    expect(recipeCss(LEDS.on)).toBe("var(--bulb)");
  });

  it("il post-it bianco e' bianco: prende la carta piu' chiara, non il giallo", () => {
    for (const theme of THEMES) {
      expect(recipeCss(SURFACES.blank[theme].fill)).toBe(recipeCss(SURFACES.sheet[theme].fill));
    }
  });

  it("la domanda si legge dentro il post-it bianco, in tutti e due i temi", () => {
    for (const theme of THEMES) {
      const fill = tint(theme, SURFACES.blank[theme].fill);
      expect(contrastRatio(palette.ink, fill), `${theme}: la domanda non si legge`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

// Il selettore si cerca intero: `[data-desk-shape]` e' contenuto anche in
// `[data-theme="dark"] [data-desk-shape]`. Le ancore perdono graffa o virgola.
function ruleBody(selector: string): string | null {
  return rules(selector.replace(/\s*[{,]\s*$/, ""))[0]?.body ?? null;
}

function requireRule(selector: string): string {
  const body = ruleBody(selector);
  if (body === null) throw new Error(`il foglio di stile non ha la regola ${selector}`);
  return body;
}

describe("il CSS dichiara esattamente la tavola dei materiali", () => {
  it("il tema scuro inverte i token come li inverte il modulo", () => {
    const dark = requireRule('[data-theme="dark"] {');
    expect(dark).toMatch(/--bg:\s*var\(--ink\)/);
    expect(dark).toMatch(/--fg:\s*var\(--paper\)/);
    expect(dark).toMatch(new RegExp(`--fg-muted:\\s*${palette.mutedDark}`, "i"));
  });

  for (const name of NAMES) {
    const surface = SURFACES[name];
    const fixed =
      recipeCss(surface.light.fill) === recipeCss(surface.dark.fill) &&
      (surface.light.line === null) === (surface.dark.line === null) &&
      (surface.light.line === null ||
        recipeCss(surface.light.line) === recipeCss(surface.dark.line!));

    it(`${name}: il tema chiaro dipinge la ricetta del modulo`, () => {
      const body = requireRule(surface.anchor);
      expect(body).toContain(`--desk-full: ${recipeCss(surface.light.fill)}`);
      if (surface.light.line) {
        expect(body).toContain(`--desk-stroke: ${recipeCss(surface.light.line)}`);
      } else {
        expect(body).not.toContain("--desk-stroke");
      }
    });

    it(
      fixed
        ? `${name}: e' fisso, e il tema scuro non lo ridichiara`
        : `${name}: il tema scuro dipinge la sua ricetta, che e' un'altra`,
      () => {
        const dark = ruleBody(`[data-theme="dark"] ${surface.anchor}`);
        if (fixed) {
          expect(dark, `${name} e' dichiarato due volte per niente`).toBeNull();
          return;
        }
        expect(dark, `${name} non ha la sua regola in tema scuro`).not.toBeNull();
        expect(dark).toContain(`--desk-full: ${recipeCss(surface.dark.fill)}`);
        if (surface.dark.line) {
          expect(dark).toContain(`--desk-stroke: ${recipeCss(surface.dark.line)}`);
        }
      },
    );
  }

  it("i led sono le due tinte del modulo, e non seguono il tema", () => {
    const leds = requireRule("[data-desk-leds] {");
    expect(leds).toContain(recipeCss(LEDS.on));
    expect(leds).toContain(recipeCss(LEDS.off));
    expect(rules(/\[data-theme="dark"\] \[data-desk-leds\]/)).toEqual([]);
  });

  it("i led sono ritagliati sulla sagoma che li porta", () => {
    // Senza mask-image i led stavano nel rack solo per caso delle percentuali.
    const leds = requireRule("[data-desk-leds] {");
    expect(leds).toMatch(/mask-image:\s*url\("\/brand\/desk\/rack/);
  });
});

describe("l'ombra sta sulle superfici e su niente altro", () => {
  it("la dichiara la sagoma, e nessun'altra regola del foglio di stile", () => {
    const shadowed = rules()
      .filter((r) => /drop-shadow/.test(r.body))
      .map((r) => r.selector)
      .filter((selector) => /\[data-desk/.test(selector));
    expect(shadowed).toEqual(["[data-desk-shape]"]);
  });

  it("l'etichetta non prende nessun filtro", () => {
    expect(requireRule("[data-desk-object] [data-desk-label] {")).not.toContain("filter");
  });

  it("il colore lo porta --desk-shadow, dichiarata una volta per tema", () => {
    const shape = requireRule("[data-desk-shape] {");
    expect(shape).toContain(`--desk-shadow: ${shadowCss("light")}`);
    expect(shape).toMatch(/filter:\s*drop-shadow\([^)]*var\(--desk-shadow\)\)/);
    const dark = requireRule('[data-theme="dark"] [data-desk-shape] {');
    expect(dark).toContain(`--desk-shadow: ${shadowCss("dark")}`);
  });

  it("resta corta: sborda meno dell'aria che la geometria tiene fra due oggetti", () => {
    // L'ombra non entra in objectFootprint: scostamento piu' sfocatura devono stare
    // sotto meta' del pavimento di 1,2 punti (circa 6,3px a 1440).
    const shape = requireRule("[data-desk-shape] {");
    const sizes = shape.match(/drop-shadow\(0\s+([\d.]+)em\s+([\d.]+)em/);
    expect(sizes, "l'ombra non e' piu' scritta in em").not.toBeNull();
    const [offset, blur] = sizes!.slice(1).map(Number);
    expect((offset + blur) * 16).toBeLessThanOrEqual(3.15);
  });
});

describe("nessun materiale scrive un colore a mano", () => {
  it("ogni ricetta spende solo token del tema", () => {
    for (const theme of THEMES) {
      for (const name of NAMES) {
        for (const recipe of [SURFACES[name][theme].fill, SURFACES[name][theme].line]) {
          if (!recipe) continue;
          expect(recipeCss(recipe)).not.toMatch(/#[0-9a-f]{3,6}/i);
        }
      }
      expect(shadowCss(theme)).not.toMatch(/#[0-9a-f]{3,6}/i);
    }
  });
});
