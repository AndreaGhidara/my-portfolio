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

/**
 * LA PROVA DELLA SCALA.
 *
 * Il difetto che questa prova esiste per cogliere e' passato attraverso una
 * suite da 210 prove senza che una sola lo vedesse, e nessuna prova testuale lo
 * avrebbe visto: il cartoncino e la scocca erano due ricette DIVERSE che in
 * tema scuro cadevano sullo stesso colore. Un collasso numerico si coglie solo
 * calcolando i numeri.
 *
 * Le soglie non sono gusto. Sono il minimo perche' il tavolo resti quattro tipi
 * di cosa invece di quattro contorni della stessa famiglia, che e' esattamente
 * cio' che §4.4 bis della spec esiste per superare.
 */
describe("la scala dei materiali", () => {
  it("la miscelazione in oklab e' quella del browser, non un'approssimazione", () => {
    // Ancorata a valori letti dai PIXEL veri (colore dipinto in un canvas 1x1 e
    // riletto): le custom property escono come oklab() non risolto, e leggerle
    // come stringa da' numeri falsi. Se questa cade, tutte le altre misurano
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
          // Il post-it e' l'eccezione dichiarata, ed e' una scelta e non una
          // dimenticanza: un post-it giallo e' giallo di notte. Su carta fa
          // 1.08:1: a tenerlo su sono la tinta e il bordo, non la luminanza.
          if (surface.family === "fixed") continue;
          const fill = tint(theme, surface[theme].fill);
          expect(
            contrastRatio(fill, ground),
            `${name}: il pieno ${fill} sparisce nel fondo ${ground}`,
          ).toBeGreaterThanOrEqual(THRESHOLD.ground);
        }
      });

      it("la carta e l'apparecchio restano due famiglie", () => {
        // E' il difetto che ha fatto nascere questa prova: in tema scuro
        // `card` (#302d29) e `rack` (#302d27) erano lo stesso colore, 1.00:1.
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
          // Il post-it bianco non dichiara il suo tratto: eredita quello degli
          // altri post-it, ed e' quello che va misurato sul pieno nuovo.
          const stroke = line ?? SURFACES.postit[theme].line;
          if (!stroke) continue;
          expect(
            separation(theme, fill, stroke),
            `${name}: il tratto sparisce dentro il suo pieno`,
          ).toBeGreaterThanOrEqual(THRESHOLD.outline);
        }
      });

      it("l'ombra portata esiste davvero, composta sul fondo", () => {
        // Era `--ink` al 26% in tutti e due i temi. In tema scuro `--bg` E'
        // `--ink`: l'ombra aveva la luminanza esatta del fondo su cui cadeva,
        // cioe' 1.00:1: matematicamente non c'era, e il report la dava per
        // verificata in tutti e due i temi.
        const composite = shadowOverBg(theme);
        expect(
          contrastRatio(composite, ground),
          `l'ombra ${composite} e' il fondo ${ground}`,
        ).toBeGreaterThanOrEqual(THRESHOLD.shadow);
      });
    });
  }

  it("il post-it e i led non seguono il tema: sono colore vero", () => {
    // Un post-it giallo e' giallo di notte, e una spia accesa e' accesa.
    expect(recipeCss(SURFACES.postit.light.fill)).toBe(recipeCss(SURFACES.postit.dark.fill));
    expect(recipeCss(SURFACES.postit.light.line!)).toBe(recipeCss(SURFACES.postit.dark.line!));
    expect(recipeCss(LEDS.on)).toBe("var(--bulb)");
  });

  it("il post-it bianco e' bianco: prende la carta piu' chiara, non il giallo", () => {
    // §3.2 lo chiama «il post-it bianco»: e' la ventiquattresima cosa, quella
    // che si preme, e non e' un'etichetta del tavolo. Finche' tutto era
    // contorno la differenza non si vedeva; adesso che i pieni esistono, un
    // giallo identico agli altri cinque e' un'altra cosa.
    for (const theme of THEMES) {
      expect(recipeCss(SURFACES.blank[theme].fill)).toBe(recipeCss(SURFACES.sheet[theme].fill));
    }
  });

  it("la domanda si legge dentro il post-it bianco, in tutti e due i temi", () => {
    // `[data-desk-ask]` e' inchiostro fisso: e' il nome del comando, ed e'
    // l'unico testo del tavolo che sta DENTRO una superficie.
    for (const theme of THEMES) {
      const fill = tint(theme, SURFACES.blank[theme].fill);
      expect(contrastRatio(palette.ink, fill), `${theme}: la domanda non si legge`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

/**
 * IL CONTRATTO CSS-COME-TESTO.
 *
 * Il modulo qui sopra e' la specifica; il CSS (tokens.css e
 * sections/desk.css) e' l'unico che dipinge. Se i due divergono, la prova
 * della scala misura un tavolo che nessuno vede, che
 * e' il modo piu' silenzioso di non provare niente. E' lo stesso pattern gia'
 * in uso per il contratto dell'etichetta e per la porta del movimento.
 */
/** Il selettore si cerca INTERO: `[data-desk-shape]` e' contenuto per intero
 *  dentro `[data-theme="dark"] [data-desk-shape]`. Le ancore di materials.ts
 *  finiscono con la graffa o con la virgola della lista: si tolgono. */
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
    // THEME_TOKENS e' l'assunto su cui poggia ogni numero della scala: se un
    // giorno --fg-muted scuro cambiasse mestiere nel CSS, il modulo
    // continuerebbe a calcolare il tavolo di ieri.
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
        // Il post-it bianco eredita il suo tratto: dichiararlo qui sarebbe una
        // seconda copia dello stesso giallo.
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
    // Ereditavano mask-repeat/position/size da `[data-desk-shape] > *` senza
    // mask-image: stavano dentro il rack solo perche' le percentuali capitavano
    // giuste, e nessuna regola lo diceva.
    const leds = requireRule("[data-desk-leds] {");
    expect(leds).toMatch(/mask-image:\s*url\("\/brand\/desk\/rack/);
  });
});

/**
 * L'OMBRA. E' l'unico divieto esplicito di §4.4 bis: «un'ombra portata sulle
 * sole superfici, MAI sull'etichetta», e non aveva una prova: spostare il
 * filtro su `[data-desk-object]` lasciava verdi tutte e 210 le prove e metteva
 * un'ombra sotto ogni parola del tavolo.
 */
describe("l'ombra sta sulle superfici e su niente altro", () => {
  it("la dichiara la sagoma, e nessun'altra regola del foglio di stile", () => {
    // Tutte le regole del sito, anche la prima di ogni media query: l'ombra
    // delle palline di carta dell'apertura c'e', ma il tavolo e' quello che
    // conta qui, e le palline non sono una superficie del tavolo.
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
    // L'ombra non entra in objectFootprint. Il pavimento di 1,2 punti del mondo
    // vale circa 6,3px a 1440: finche' scostamento + sfocatura stanno sotto
    // meta' di quel franco, due ombre non si toccano mai.
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
