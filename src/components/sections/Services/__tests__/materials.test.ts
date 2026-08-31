import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import { contrastRatio } from "@/styles/contrast";
import { palette } from "@/styles/palette";
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

const TEMI: Theme[] = ["light", "dark"];
const NOMI = Object.keys(SURFACES) as SurfaceName[];

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
 * di cosa invece di quattro contorni della stessa famiglia — che e' esattamente
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

  for (const tema of TEMI) {
    describe(`tema ${tema}`, () => {
      const fondo = THEME_TOKENS[tema].bg;

      it("ogni pieno si stacca dal fondo: una superficie che non si vede non e' una superficie", () => {
        for (const nome of NOMI) {
          const superficie = SURFACES[nome];
          // Il post-it e' l'eccezione dichiarata, ed e' una scelta e non una
          // dimenticanza: un post-it giallo e' giallo di notte. Su carta fa
          // 1.08:1 — a tenerlo su sono la tinta e il bordo, non la luminanza.
          if (superficie.family === "fisso") continue;
          const pieno = tint(tema, superficie[tema].fill);
          expect(
            contrastRatio(pieno, fondo),
            `${nome}: il pieno ${pieno} sparisce nel fondo ${fondo}`,
          ).toBeGreaterThanOrEqual(THRESHOLD.ground);
        }
      });

      it("la carta e l'apparecchio restano due famiglie", () => {
        // E' il difetto che ha fatto nascere questa prova: in tema scuro
        // `card` (#302d29) e `rack` (#302d27) erano lo stesso colore, 1.00:1.
        const carta = NOMI.filter((n) => SURFACES[n].family === "carta");
        const apparecchi = NOMI.filter((n) => SURFACES[n].family === "apparecchio");
        expect(carta.length).toBeGreaterThan(0);
        expect(apparecchi.length).toBeGreaterThan(0);
        for (const c of carta) {
          for (const a of apparecchi) {
            expect(
              separation(tema, SURFACES[c][tema].fill, SURFACES[a][tema].fill),
              `${c} e ${a} sono la stessa cosa: ${tint(tema, SURFACES[c][tema].fill)} contro ${tint(tema, SURFACES[a][tema].fill)}`,
            ).toBeGreaterThanOrEqual(THRESHOLD.families);
          }
        }
      });

      it("i gradini della carta restano tre gradini", () => {
        const carta: SurfaceName[] = ["sheet", "card", "plate"];
        for (let i = 0; i < carta.length; i++) {
          for (let j = i + 1; j < carta.length; j++) {
            expect(
              separation(tema, SURFACES[carta[i]][tema].fill, SURFACES[carta[j]][tema].fill),
              `${carta[i]} e ${carta[j]} sono lo stesso cartoncino`,
            ).toBeGreaterThanOrEqual(THRESHOLD.steps);
          }
        }
      });

      it("ogni tratto si stacca dal suo pieno: e' il tratto a fare il disegno", () => {
        for (const nome of NOMI) {
          const { fill, line } = SURFACES[nome][tema];
          // Il post-it bianco non dichiara il suo tratto: eredita quello degli
          // altri post-it, ed e' quello che va misurato sul pieno nuovo.
          const tratto = line ?? SURFACES.postit[tema].line;
          if (!tratto) continue;
          expect(
            separation(tema, fill, tratto),
            `${nome}: il tratto sparisce dentro il suo pieno`,
          ).toBeGreaterThanOrEqual(THRESHOLD.outline);
        }
      });

      it("l'ombra portata esiste davvero, composta sul fondo", () => {
        // Era `--ink` al 26% in tutti e due i temi. In tema scuro `--bg` E'
        // `--ink`: l'ombra aveva la luminanza esatta del fondo su cui cadeva,
        // cioe' 1.00:1 — matematicamente non c'era, e il report la dava per
        // verificata in tutti e due i temi.
        const composta = shadowOverBg(tema);
        expect(
          contrastRatio(composta, fondo),
          `l'ombra ${composta} e' il fondo ${fondo}`,
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
    for (const tema of TEMI) {
      expect(recipeCss(SURFACES.blank[tema].fill)).toBe(recipeCss(SURFACES.sheet[tema].fill));
    }
  });

  it("la domanda si legge dentro il post-it bianco, in tutti e due i temi", () => {
    // `[data-desk-ask]` e' inchiostro fisso: e' il nome del comando, ed e'
    // l'unico testo del tavolo che sta DENTRO una superficie.
    for (const tema of TEMI) {
      const pieno = tint(tema, SURFACES.blank[tema].fill);
      expect(contrastRatio(palette.ink, pieno), `${tema}: la domanda non si legge`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

/**
 * IL CONTRATTO CSS-COME-TESTO.
 *
 * Il modulo qui sopra e' la specifica; `tokens.css` e' l'unico che dipinge. Se
 * i due divergono, la prova della scala misura un tavolo che nessuno vede — che
 * e' il modo piu' silenzioso di non provare niente. E' lo stesso pattern gia'
 * in uso per il contratto dell'etichetta e per la porta del movimento.
 */
const TOKENS = readFileSync(resolve(process.cwd(), "src/styles/tokens.css"), "utf8").replace(
  /\/\*[\s\S]*?\*\//g,
  "",
);

/** Il selettore si cerca ANCORATO A CAPO RIGA: `[data-desk-shape] {` e'
 *  contenuto per intero dentro `[data-theme="dark"] [data-desk-shape] {`. */
function blocco(selettore: string): string | null {
  const ancorato = new RegExp(`^[ \\t]*${selettore.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "m");
  const trovato = TOKENS.match(ancorato);
  if (!trovato || trovato.index === undefined) return null;
  const apre = TOKENS.indexOf("{", trovato.index);
  return TOKENS.slice(apre + 1, TOKENS.indexOf("}", apre));
}

function pretende(selettore: string): string {
  const testo = blocco(selettore);
  if (testo === null) throw new Error(`tokens.css non ha la regola ${selettore}`);
  return testo;
}

describe("tokens.css dichiara esattamente la tavola dei materiali", () => {
  it("il tema scuro inverte i token come li inverte il modulo", () => {
    // THEME_TOKENS e' l'assunto su cui poggia ogni numero della scala: se un
    // giorno --fg-muted scuro cambiasse mestiere nel CSS, il modulo
    // continuerebbe a calcolare il tavolo di ieri.
    const scuro = pretende('[data-theme="dark"] {');
    expect(scuro).toMatch(/--bg:\s*var\(--ink\)/);
    expect(scuro).toMatch(/--fg:\s*var\(--paper\)/);
    expect(scuro).toMatch(new RegExp(`--fg-muted:\\s*${palette.mutedDark}`, "i"));
  });

  for (const nome of NOMI) {
    const superficie = SURFACES[nome];
    const fisso =
      recipeCss(superficie.light.fill) === recipeCss(superficie.dark.fill) &&
      (superficie.light.line === null) === (superficie.dark.line === null) &&
      (superficie.light.line === null ||
        recipeCss(superficie.light.line) === recipeCss(superficie.dark.line!));

    it(`${nome}: il tema chiaro dipinge la ricetta del modulo`, () => {
      const testo = pretende(superficie.anchor);
      expect(testo).toContain(`--desk-pieno: ${recipeCss(superficie.light.fill)}`);
      if (superficie.light.line) {
        expect(testo).toContain(`--desk-tratto: ${recipeCss(superficie.light.line)}`);
      } else {
        // Il post-it bianco eredita il suo tratto: dichiararlo qui sarebbe una
        // seconda copia dello stesso giallo.
        expect(testo).not.toContain("--desk-tratto");
      }
    });

    it(
      fisso
        ? `${nome}: e' fisso, e il tema scuro non lo ridichiara`
        : `${nome}: il tema scuro dipinge la sua ricetta, che e' un'altra`,
      () => {
        const scuro = blocco(`[data-theme="dark"] ${superficie.anchor}`);
        if (fisso) {
          expect(scuro, `${nome} e' dichiarato due volte per niente`).toBeNull();
          return;
        }
        expect(scuro, `${nome} non ha la sua regola in tema scuro`).not.toBeNull();
        expect(scuro).toContain(`--desk-pieno: ${recipeCss(superficie.dark.fill)}`);
        if (superficie.dark.line) {
          expect(scuro).toContain(`--desk-tratto: ${recipeCss(superficie.dark.line)}`);
        }
      },
    );
  }

  it("i led sono le due tinte del modulo, e non seguono il tema", () => {
    const led = pretende("[data-desk-leds] {");
    expect(led).toContain(recipeCss(LEDS.on));
    expect(led).toContain(recipeCss(LEDS.off));
    expect(blocco('[data-theme="dark"] [data-desk-leds]')).toBeNull();
  });

  it("i led sono ritagliati sulla sagoma che li porta", () => {
    // Ereditavano mask-repeat/position/size da `[data-desk-shape] > *` senza
    // mask-image: stavano dentro il rack solo perche' le percentuali capitavano
    // giuste, e nessuna regola lo diceva.
    const led = pretende("[data-desk-leds] {");
    expect(led).toMatch(/mask-image:\s*url\("\/brand\/desk\/rack/);
  });
});

/**
 * L'OMBRA. E' l'unico divieto esplicito di §4.4 bis — «un'ombra portata sulle
 * sole superfici, MAI sull'etichetta» — e non aveva una prova: spostare il
 * filtro su `[data-desk-object]` lasciava verdi tutte e 210 le prove e metteva
 * un'ombra sotto ogni parola del tavolo.
 */
describe("l'ombra sta sulle superfici e su niente altro", () => {
  it("la dichiara la sagoma, e nessun'altra regola del foglio di stile", () => {
    const regole = [...TOKENS.matchAll(/(^|\})([^{}]+)\{([^{}]*)\}/g)];
    const conOmbra = regole
      .filter((r) => /drop-shadow/.test(r[3]))
      .map((r) => r[2].trim().replace(/\s+/g, " "));
    expect(conOmbra).toEqual(["[data-desk-shape]"]);
  });

  it("l'etichetta non prende nessun filtro", () => {
    expect(pretende("[data-desk-object] [data-desk-label] {")).not.toContain("filter");
  });

  it("il colore lo porta --desk-ombra, dichiarata una volta per tema", () => {
    const sagoma = pretende("[data-desk-shape] {");
    expect(sagoma).toContain(`--desk-ombra: ${shadowCss("light")}`);
    expect(sagoma).toMatch(/filter:\s*drop-shadow\([^)]*var\(--desk-ombra\)\)/);
    const scuro = pretende('[data-theme="dark"] [data-desk-shape] {');
    expect(scuro).toContain(`--desk-ombra: ${shadowCss("dark")}`);
  });

  it("resta corta: sborda meno dell'aria che la geometria tiene fra due oggetti", () => {
    // L'ombra non entra in objectFootprint. Il pavimento di 1,2 punti del mondo
    // vale circa 6,3px a 1440: finche' scostamento + sfocatura stanno sotto
    // meta' di quel franco, due ombre non si toccano mai.
    const sagoma = pretende("[data-desk-shape] {");
    const misure = sagoma.match(/drop-shadow\(0\s+([\d.]+)em\s+([\d.]+)em/);
    expect(misure, "l'ombra non e' piu' scritta in em").not.toBeNull();
    const [scostamento, sfocatura] = misure!.slice(1).map(Number);
    expect((scostamento + sfocatura) * 16).toBeLessThanOrEqual(3.15);
  });
});

describe("nessun materiale scrive un colore a mano", () => {
  it("ogni ricetta spende solo token del tema", () => {
    for (const tema of TEMI) {
      for (const nome of NOMI) {
        for (const ricetta of [SURFACES[nome][tema].fill, SURFACES[nome][tema].line]) {
          if (!ricetta) continue;
          expect(recipeCss(ricetta)).not.toMatch(/#[0-9a-f]{3,6}/i);
        }
      }
      expect(shadowCss(tema)).not.toMatch(/#[0-9a-f]{3,6}/i);
    }
  });
});
