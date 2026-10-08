import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { palette } from "../palette";
import { rules, type Rule } from "@/test/css";

const declares = (within: Rule[], declaration: RegExp) => within.some((r) => declaration.test(r.body));

describe("i fogli di stile", () => {
  it("l'anello dei bottoni dell'apertura sta DENTRO, perche' il fuoco sta fuori", () => {
    // Il fuoco da tastiera e' un outline fuori dal bordo (globals.css): un anello
    // fuori anche qui renderebbe i due segnali lo stesso disegno.
    const buttons = rules(/\[data-hero-cta\]/);
    expect(buttons.length, "le regole dei bottoni dell'apertura non ci sono piu'").toBeGreaterThan(0);
    expect(declares(buttons, /box-shadow:\s*inset/)).toBe(true);
    expect(declares(buttons, /\boutline\s*:/), "l'anello e' diventato un outline: si confonde col fuoco").toBe(
      false,
    );
    // Su touch l'hover resta appiccicato dopo il tocco.
    expect(buttons.some((r) => r.inside.includes("@media (hover: hover)"))).toBe(true);
  });

  it("definisce ogni token della palette con lo stesso valore", () => {
    const paletteVarsInCss = ["paper", "ink", "orange", "graph", "muted"];
    for (const name of paletteVarsInCss) {
      expect(rules().map((r) => r.declarations[`--${name}`])).toContain(
        palette[name as keyof typeof palette],
      );
    }
  });

  it("definisce il tema scuro invertendo carta e inchiostro", () => {
    expect(rules('[data-theme="dark"]').length).toBeGreaterThan(0);
    expect(declares(rules(/\[data-theme="dark"\]/), /--bg:\s*var\(--ink\)/)).toBe(true);
  });

  it("un dossier chiuso resta display:none", () => {
    // `display` sul selettore nudo sovrascrive il display:none del <dialog> chiuso,
    // che restava una linea di 2px incollata allo schermo.
    expect(declares(rules("[data-work-dialog]:not([open])"), /display:\s*none/)).toBe(true);

    expect(declares(rules(/\[data-work-dialog\]$/), /display\s*:/)).toBe(false);
  });

  it("ogni sagoma del tavolo ha due strati, e i due file esistono davvero", () => {
    // Una maschera su un file che non c'e' non e' un errore: lo strato non si dipinge e basta.
    for (const shape of ["sheet", "card", "postit", "plate", "rack", "phone", "laptop"]) {
      for (const file of [`${shape}.svg`, `${shape}-fill.svg`]) {
        expect(
          rules().some((r) => r.body.includes(`url("/brand/desk/${file}")`)),
          `${file} non e' montato nel foglio di stile`,
        ).toBe(true);
        expect(
          existsSync(path.resolve(__dirname, `../../../public/brand/desk/${file}`)),
          `public/brand/desk/${file} non c'e': npm run assets`,
        ).toBe(true);
      }
    }
  });

  it("contiene solo colori hex dalla palette, in tutti i fogli di stile", () => {
    // Tutti i .css sotto src/styles/, anche nelle sottocartelle come game/.
    const sheets = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
        entry.isDirectory()
          ? sheets(path.join(dir, entry.name))
          : entry.name.endsWith(".css")
            ? [path.join(dir, entry.name)]
            : [],
      );
    const all = sheets(path.resolve(__dirname, ".."));
    expect(all.length, "la ricerca dei fogli di stile non trova niente").toBeGreaterThan(1);

    const hexRegex = /#[0-9A-Fa-f]{6}/g;
    const paletteHexesLower = Object.values(palette).map((h) =>
      h.toLowerCase(),
    );
    for (const sheet of all) {
      const hexes = readFileSync(sheet, "utf8").match(hexRegex) || [];
      for (const hex of hexes) {
        expect(paletteHexesLower, `${path.relative(__dirname, sheet)}: ${hex}`).toContain(
          hex.toLowerCase(),
        );
      }
    }
  });

  it("il paese sul francobollo non e' carta su arancio: e' testo piccolo", () => {
    // Carta su arancio fa 3,27:1: va bene per la sigla a 1,5rem, non per
    // «ITALIA» a 0,5rem, che sta in --on-accent (5,08:1).
    const code = rules("[data-stamp-code]")[0]?.body;
    const country = rules("[data-stamp-country]")[0]?.body;
    expect(code, "la sigla del francobollo non c'e' piu'").toBeTruthy();
    expect(country, "il paese del francobollo non c'e' piu'").toBeTruthy();
    expect(code).toMatch(/font-size:\s*1\.5rem/);
    expect(code).toMatch(/color:\s*var\(--paper\)/);
    expect(country, "«ITALIA» e' tornato carta su arancio, sotto AA").toMatch(
      /color:\s*var\(--on-accent\)/,
    );
  });

  it("la busta riempie il piede: niente cornice e niente larghezza massima", () => {
    // Un padding sul piede diventerebbe una cornice intorno alla busta.
    const footer = rules("[data-footer]")[0]?.body;
    const envelope = rules("[data-envelope]")[0]?.body;
    expect(footer, "le regole del piede non ci sono piu'").toBeTruthy();
    expect(envelope, "le regole della busta non ci sono piu'").toBeTruthy();
    expect(footer, "il piede ha di nuovo un padding: torna la cornice").not.toMatch(/padding/);
    expect(envelope, "la busta ha di nuovo un tetto di larghezza").not.toMatch(/max-inline-size/);
  });

  it("la pagina ha ancora una fine quando il piede non e' piu' scuro", () => {
    // Una busta color carta a filo del fondo lascerebbe la pagina aperta: la chiude il taglio.
    const cut = rules("[data-envelope]::after")[0]?.body;
    expect(cut, "il taglio in fondo alla pagina non c'e' piu'").toBeTruthy();
    expect(cut).toMatch(/background-color:\s*var\(--fg\)/);
  });
});

describe("la barra in basso", () => {
  it("sparisce quando il dossier e' aperto: sono due navigazioni sovrapposte", () => {
    expect(declares(rules(/html\[data-dialog-open\].*\[data-nav-bottom\]/), /display:\s*none/)).toBe(true);
  });

  it("la busta si fa da parte, o la barra le sta sopra l'ultima riga", () => {
    // Lo spazio va dentro la busta: sul piede diventerebbe una cornice.
    const narrow = { media: "(max-width: 767px)" };
    expect(rules(undefined, narrow).length, "manca il blocco sotto i 768px").toBeGreaterThan(0);
    const space = rules(/\[data-envelope\]/, narrow).find((r) => /padding-block-end/.test(r.body));
    expect(space, "la busta non lascia spazio alla barra").toBeTruthy();
    // Dopo il `padding` della busta, o la scorciatoia se lo riprende.
    const all = rules();
    expect(all.indexOf(space!)).toBeGreaterThan(all.indexOf(rules("[data-envelope]")[0]));
  });
});

describe("la superficie del tema scuro", () => {
  it("esiste in tutti e due i temi: le cartelle non possono avere il fondo della pagina", () => {
    // Su inchiostro una cartella col fondo della pagina diventa un reticolo piatto.
    expect(declares(rules(":root"), /--surface:/)).toBe(true);
    expect(declares(rules(/\[data-theme="dark"\]$/), /--surface:/)).toBe(true);
  });
});

describe("le entrate laterali non allargano la pagina", () => {
  it("le due sezioni che le usano ritagliano in orizzontale, e con clip", () => {
    // Senza, 429px di documento su 390 di finestra. hidden ne farebbe un contenitore
    // di scorrimento, e l'intestazione sticky smetterebbe di funzionare.
    const rule = rules("#services").find((r) => r.selector === "#services, #process")?.body;
    expect(rule, "manca il ritaglio orizzontale delle sezioni con entrate laterali").toBeTruthy();
    expect(rule).toMatch(/overflow-x:\s*clip/);
    expect(rule).not.toMatch(/overflow-x:\s*hidden/);
  });
});

describe("le consegne sul tablet", () => {
  it("sotto i 900px il testo della consegna e' centrato", () => {
    // A 768px il testo restava a sinistra con 184px vuoti a destra, sopra un disegno centrato.
    const text = rules(/\[data-process-text\]/, { media: "(max-width: 899px)" });
    expect(declares(text, /margin-inline:\s*auto/), "il testo delle consegne non si centra sotto i 900px").toBe(true);
  });

  it("la testata si centra fino a 1023px, non solo dove le consegne sono una colonna", () => {
    // Fra 900 e 1023px le consegne sono a due colonne, ma la testata resterebbe a sinistra.
    const header = rules(/\[data-process-header\]/, { media: "(max-width: 1023px)" });
    expect(declares(header, /margin-inline:\s*auto/), "la testata del processo non si centra sotto i 1024px").toBe(
      true,
    );
  });
});

