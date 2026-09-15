import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { palette } from "../palette";

const css = readFileSync(path.resolve(__dirname, "../tokens.css"), "utf8");

describe("tokens.css", () => {
  it("l'anello dei bottoni dell'apertura sta DENTRO, perche' il fuoco sta fuori", () => {
    // Il fuoco da tastiera di tutto il sito e' `outline: 2px solid var(--accent)`
    // con `outline-offset: 3px` (globals.css): un anello arancione fuori dal
    // bordo. Disegnando anche questo fuori, i due segnali diventerebbero lo
    // stesso disegno: chi naviga da tastiera non saprebbe piu' dove si trova, e
    // chi usa il mouse vedrebbe comparire in hover la cosa che altrove
    // significa «sei qui». Dentro contro fuori e' tutta la differenza.
    const blocco = css.match(/\[data-hero-cta\][\s\S]*?@media \(prefers-reduced-motion[^}]*\}[^}]*\}/)?.[0];
    expect(blocco, "le regole dei bottoni dell'apertura non ci sono piu'").toBeTruthy();
    expect(blocco).toMatch(/box-shadow:\s*inset/);
    expect(blocco, "l'anello e' diventato un outline: si confonde col fuoco").not.toMatch(
      /\boutline\s*:/,
    );
    // E si sposta solo dove il puntatore esiste: su touch l'hover resta
    // appiccicato dopo il tocco e lascerebbe l'anello sul bottone sbagliato.
    expect(blocco).toContain("@media (hover: hover)");
  });

  it("sotto i 1024px il filo non attraversa la pagina", () => {
    // Il filo misura quanto si e' scesi serpeggiando fra i due bordi: su uno
    // schermo stretto i bordi sono vicini, la corsa taglia il testo in
    // diagonale e non misura piu' niente. Il disegnatore e' uno solo da quando
    // il tavolo non disegna piu' niente (vedi anchors.ts).
    const blocco = css.match(
      /@media \(max-width: 1023px\) \{[^}]*\[data-thread\][\s\S]*?\}\s*\}/,
    )?.[0];
    expect(blocco, "la regola che spegne il filo sul telefono non c'e' piu'").toBeTruthy();
    expect(blocco, "[data-thread] disegna ancora il filo sul telefono").toContain("[data-thread]");
    expect(blocco).toMatch(/display:\s*none/);
  });

  it("il filo ha un token suo, e sulle sezioni a fondo pieno cambia", () => {
    // --line e' il colore dei bordi, scelto contro il fondo di pagina. Il filo
    // attraversa anche l'arancio, dove --line fa 2.47:1 in chiaro e 1.52:1 in
    // scuro: sotto la soglia 3:1. Serve un token suo, che le sezioni a fondo
    // pieno ridefiniscono senza toccare i bordi di tutto il resto del sito.
    expect(css).toMatch(/:root\s*\{[^}]*--filo:\s*var\(--muted\)/);
    expect(css).toMatch(/\[data-fondo="accento"\][^{]*\{[^}]*--filo:\s*var\(--on-accent\)/);
  });

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

  it("il paese sul francobollo non e' carta su arancio: e' testo piccolo", () => {
    // carta su arancio fa 3,27:1, sotto AA: ammessa solo per testo grande, ed
    // e' il test che sta in contrast.test.ts. Sul francobollo della busta la
    // sigla e' a 1,5rem e puo' restare carta; «ITALIA» e' a 0,5rem e deve
    // stare in --on-accent, che fa 5,08:1. Il prototipo le aveva tutte e due
    // in carta, ed e' il difetto che questa prova blocca.
    const sigla = css.match(/\[data-francobollo-sigla\]\s*\{[^}]*\}/)?.[0];
    const paese = css.match(/\[data-francobollo-paese\]\s*\{[^}]*\}/)?.[0];
    expect(sigla, "la sigla del francobollo non c'e' piu'").toBeTruthy();
    expect(paese, "il paese del francobollo non c'e' piu'").toBeTruthy();
    expect(sigla).toMatch(/font-size:\s*1\.5rem/);
    expect(sigla).toMatch(/color:\s*var\(--paper\)/);
    expect(paese, "«ITALIA» e' tornato carta su arancio, sotto AA").toMatch(
      /color:\s*var\(--on-accent\)/,
    );
  });

  it("la busta riempie il piede: niente cornice e niente larghezza massima", () => {
    // Il piede non mette padding proprio, o quel padding diventerebbe una
    // cornice del colore del blocco tutto intorno alla busta: e' esattamente
    // cio' che la busta doveva smettere di avere.
    const piede = css.match(/\[data-footer\]\s*\{[^}]*\}/)?.[0];
    const busta = css.match(/\[data-busta\]\s*\{[^}]*\}/)?.[0];
    expect(piede, "le regole del piede non ci sono piu'").toBeTruthy();
    expect(busta, "le regole della busta non ci sono piu'").toBeTruthy();
    expect(piede, "il piede ha di nuovo un padding: torna la cornice").not.toMatch(/padding/);
    expect(busta, "la busta ha di nuovo un tetto di larghezza").not.toMatch(/max-inline-size/);
  });

  it("la pagina ha ancora una fine quando il piede non e' piu' scuro", () => {
    // Il blocco d'inchiostro era cio' che chiudeva la pagina. Una busta color
    // carta a filo del fondo la lascerebbe aperta: e' il rischio scritto per
    // la proposta A nel prototipo, e il rimedio e' lo stesso, il taglio.
    const taglio = css.match(/\[data-busta\]::after\s*\{[^}]*\}/)?.[0];
    expect(taglio, "il taglio in fondo alla pagina non c'e' piu'").toBeTruthy();
    expect(taglio).toMatch(/background-color:\s*var\(--fg\)/);
  });
});
