import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { palette } from "../palette";
import { regole, type Regola } from "@/test/css";

const dice = (dove: Regola[], dichiarazione: RegExp) => dove.some((r) => dichiarazione.test(r.corpo));

describe("i fogli di stile", () => {
  it("l'anello dei bottoni dell'apertura sta DENTRO, perche' il fuoco sta fuori", () => {
    // Il fuoco da tastiera di tutto il sito e' `outline: 2px solid var(--accent)`
    // con `outline-offset: 3px` (globals.css): un anello arancione fuori dal
    // bordo. Disegnando anche questo fuori, i due segnali diventerebbero lo
    // stesso disegno: chi naviga da tastiera non saprebbe piu' dove si trova, e
    // chi usa il mouse vedrebbe comparire in hover la cosa che altrove
    // significa «sei qui». Dentro contro fuori e' tutta la differenza.
    const bottoni = regole(/\[data-hero-cta\]/);
    expect(bottoni.length, "le regole dei bottoni dell'apertura non ci sono piu'").toBeGreaterThan(0);
    expect(dice(bottoni, /box-shadow:\s*inset/)).toBe(true);
    expect(dice(bottoni, /\boutline\s*:/), "l'anello e' diventato un outline: si confonde col fuoco").toBe(
      false,
    );
    // E si sposta solo dove il puntatore esiste: su touch l'hover resta
    // appiccicato dopo il tocco e lascerebbe l'anello sul bottone sbagliato.
    expect(bottoni.some((r) => r.dentro.includes("@media (hover: hover)"))).toBe(true);
  });

  it("definisce ogni token della palette con lo stesso valore", () => {
    const paletteVarsInCss = ["paper", "ink", "orange", "graph", "muted"];
    for (const name of paletteVarsInCss) {
      expect(regole().map((r) => r.dichiarazioni[`--${name}`])).toContain(
        palette[name as keyof typeof palette],
      );
    }
  });

  it("definisce il tema scuro invertendo carta e inchiostro", () => {
    expect(regole('[data-theme="dark"]').length).toBeGreaterThan(0);
    expect(dice(regole(/\[data-theme="dark"\]/), /--bg:\s*var\(--ink\)/)).toBe(true);
  });

  it("un dossier chiuso resta display:none", () => {
    // Difetto vero, gia' arrivato in pagina: dichiarando `display` sul
    // selettore nudo si sovrascrive il display:none che il browser da' a un
    // <dialog> chiuso. Il dossier chiuso restava disegnato e, senza figli,
    // diventava una scatola alta 2px: una linea sotto le cartelle, `fixed`
    // dopo la prima apertura, quindi incollata allo schermo mentre si scorre.
    expect(dice(regole("[data-work-dialog]:not([open])"), /display:\s*none/)).toBe(true);

    expect(dice(regole(/\[data-work-dialog\]$/), /display\s*:/)).toBe(false);
  });

  it("ogni sagoma del tavolo ha due strati, e i due file esistono davvero", () => {
    // Il pieno e il contorno sono due maschere, e una maschera che punta a un
    // file che non c'e' non e' un errore: e' uno strato che semplicemente non
    // si dipinge. Il tavolo resterebbe verde in ogni prova e piatto in pagina.
    for (const sagoma of ["sheet", "card", "postit", "plate", "rack", "phone", "laptop"]) {
      for (const file of [`${sagoma}.svg`, `${sagoma}-fill.svg`]) {
        expect(
          regole().some((r) => r.corpo.includes(`url("/brand/desk/${file}")`)),
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
    // Non solo tokens.css: tutti i .css sotto src/styles/, a qualunque
    // profondita'. Il gioco del metodo ha i suoi file in gioco/, e un
    // esadecimale scritto li' sarebbe un colore fuori tavolozza che questa
    // prova non vedeva.
    const fogli = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((voce) =>
        voce.isDirectory()
          ? fogli(path.join(dir, voce.name))
          : voce.name.endsWith(".css")
            ? [path.join(dir, voce.name)]
            : [],
      );
    const tutti = fogli(path.resolve(__dirname, ".."));
    expect(tutti.length, "la ricerca dei fogli di stile non trova niente").toBeGreaterThan(1);

    const hexRegex = /#[0-9A-Fa-f]{6}/g;
    const paletteHexesLower = Object.values(palette).map((h) =>
      h.toLowerCase(),
    );
    for (const foglio of tutti) {
      const hexes = readFileSync(foglio, "utf8").match(hexRegex) || [];
      for (const hex of hexes) {
        expect(paletteHexesLower, `${path.relative(__dirname, foglio)}: ${hex}`).toContain(
          hex.toLowerCase(),
        );
      }
    }
  });

  it("il paese sul francobollo non e' carta su arancio: e' testo piccolo", () => {
    // carta su arancio fa 3,27:1, sotto AA: ammessa solo per testo grande, ed
    // e' il test che sta in contrast.test.ts. Sul francobollo della busta la
    // sigla e' a 1,5rem e puo' restare carta; «ITALIA» e' a 0,5rem e deve
    // stare in --on-accent, che fa 5,08:1. Il prototipo le aveva tutte e due
    // in carta, ed e' il difetto che questa prova blocca.
    const sigla = regole("[data-francobollo-sigla]")[0]?.corpo;
    const paese = regole("[data-francobollo-paese]")[0]?.corpo;
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
    const piede = regole("[data-footer]")[0]?.corpo;
    const busta = regole("[data-busta]")[0]?.corpo;
    expect(piede, "le regole del piede non ci sono piu'").toBeTruthy();
    expect(busta, "le regole della busta non ci sono piu'").toBeTruthy();
    expect(piede, "il piede ha di nuovo un padding: torna la cornice").not.toMatch(/padding/);
    expect(busta, "la busta ha di nuovo un tetto di larghezza").not.toMatch(/max-inline-size/);
  });

  it("la pagina ha ancora una fine quando il piede non e' piu' scuro", () => {
    // Il blocco d'inchiostro era cio' che chiudeva la pagina. Una busta color
    // carta a filo del fondo la lascerebbe aperta: e' il rischio scritto per
    // la proposta A nel prototipo, e il rimedio e' lo stesso, il taglio.
    const taglio = regole("[data-busta]::after")[0]?.corpo;
    expect(taglio, "il taglio in fondo alla pagina non c'e' piu'").toBeTruthy();
    expect(taglio).toMatch(/background-color:\s*var\(--fg\)/);
  });
});

describe("la barra in basso", () => {
  it("sparisce quando il dossier e' aperto: sono due navigazioni sovrapposte", () => {
    // Il dossier dei Lavori sta a tutto schermo e ha una sua uscita. Una barra
    // di sezioni appiccicata sopra sarebbe una seconda navigazione dentro una
    // cosa che ne ha gia' una, e coprirebbe il contenuto che sei appena andato
    // ad aprire.
    expect(dice(regole(/html\[data-dialog-open\].*\[data-nav-basso\]/), /display:\s*none/)).toBe(true);
  });

  it("la busta si fa da parte, o la barra le sta sopra l'ultima riga", () => {
    // Lo spazio va DENTRO la busta: sul piede diventerebbe una cornice del
    // colore del blocco tutto intorno, che e' cio' che la busta ha smesso di
    // avere (vedi la prova qui sopra).
    const stretto = { media: "(max-width: 767px)" };
    expect(regole(undefined, stretto).length, "manca il blocco sotto i 768px").toBeGreaterThan(0);
    const spazio = regole(/\[data-busta\]/, stretto).find((r) => /padding-block-end/.test(r.corpo));
    expect(spazio, "la busta non lascia spazio alla barra").toBeTruthy();
    // E deve stare DOPO la dichiarazione di `padding` della busta, o la
    // scorciatoia se lo riprende.
    const tutte = regole();
    expect(tutte.indexOf(spazio!)).toBeGreaterThan(tutte.indexOf(regole("[data-busta]")[0]));
  });
});

describe("la superficie del tema scuro", () => {
  it("esiste in tutti e due i temi: le cartelle non possono avere il fondo della pagina", () => {
    // Su carta una cartella col fondo della pagina si legge lo stesso, perche'
    // il bordo basta. Su inchiostro no: lo schedario diventa un reticolo
    // piatto e l'accostamento delle cartelle non si vede piu'. Sul chiaro il
    // token resta il fondo di pagina, quindi li' non cambia niente.
    expect(dice(regole(":root"), /--superficie:/)).toBe(true);
    expect(dice(regole(/\[data-theme="dark"\]$/), /--superficie:/)).toBe(true);
  });
});

describe("le entrate laterali non allargano la pagina", () => {
  it("le due sezioni che le usano ritagliano in orizzontale, e con clip", () => {
    // Misurato prima del ritaglio: 429px di documento su una finestra da 390,
    // cioe' la pagina trascinabile di lato per tutta la durata dell'entrata.
    // hidden non va bene: farebbe di queste due un contenitore di scorrimento,
    // e l'intestazione appiccicata in cima smetterebbe di appiccicarsi.
    const regola = regole("#services").find((r) => r.selettore === "#services, #process")?.corpo;
    expect(regola, "manca il ritaglio orizzontale delle sezioni con entrate laterali").toBeTruthy();
    expect(regola).toMatch(/overflow-x:\s*clip/);
    expect(regola).not.toMatch(/overflow-x:\s*hidden/);
  });
});

describe("le consegne sul tablet", () => {
  it("sotto i 900px il testo della consegna e' centrato", () => {
    // Misurato a 768px prima della correzione: il testo si fermava a 34rem e
    // restava a sinistra, con 184px di vuoto a destra e il disegno centrato
    // sotto. Tutto spinto da una parte.
    const testo = regole(/\[data-process-text\]/, { media: "(max-width: 899px)" });
    expect(dice(testo, /margin-inline:\s*auto/), "il testo delle consegne non si centra sotto i 900px").toBe(true);
  });

  it("la testata si centra fino a 1023px, non solo dove le consegne sono una colonna", () => {
    // Fra i 900 e i 1023 le consegne sono gia' a due colonne, ma la testata
    // col suo tetto stretto resterebbe appoggiata a sinistra.
    const testata = regole(/\[data-process-testata\]/, { media: "(max-width: 1023px)" });
    expect(dice(testata, /margin-inline:\s*auto/), "la testata del processo non si centra sotto i 1024px").toBe(
      true,
    );
  });
});

