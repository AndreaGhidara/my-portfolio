import { describe, it, expect } from "vitest";
import { contrastRatio, relativeLuminance } from "../contrast";
import { palette } from "../palette";
import { LINGUETTA, PARAMETRI, tonoLinguetta } from "../../components/sections/Works/archive";

describe("relativeLuminance", () => {
  it("vale 0 sul nero e 1 sul bianco", () => {
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 5);
    expect(relativeLuminance("#FFFFFF")).toBeCloseTo(1, 5);
  });
});

describe("contrastRatio", () => {
  it("dà 21:1 tra bianco e nero", () => {
    expect(contrastRatio("#FFFFFF", "#000000")).toBeCloseTo(21, 1);
  });

  it("è simmetrico", () => {
    expect(contrastRatio(palette.ink, palette.orange))
      .toBeCloseTo(contrastRatio(palette.orange, palette.ink), 5);
  });
});

describe("vincoli di accessibilità della spec", () => {
  it("inchiostro su carta supera AAA per il testo corrente", () => {
    expect(contrastRatio(palette.ink, palette.paper)).toBeGreaterThanOrEqual(7);
  });

  it("inchiostro su arancio supera AA: è il colore obbligatorio delle descrizioni nel blocco servizi", () => {
    expect(contrastRatio(palette.ink, palette.orange)).toBeGreaterThanOrEqual(4.5);
  });

  it("carta su arancio NON raggiunge AA: ammessa solo per testo grande", () => {
    const ratio = contrastRatio(palette.paper, palette.orange);
    expect(ratio).toBeGreaterThanOrEqual(3);
    expect(ratio).toBeLessThan(4.5);
  });

  it("arancio su carta NON raggiunge AA: mai testo corrente arancione", () => {
    expect(contrastRatio(palette.orange, palette.paper)).toBeLessThan(4.5);
  });

  it("testo secondario su carta supera AA", () => {
    expect(contrastRatio(palette.muted, palette.paper)).toBeGreaterThanOrEqual(4.5);
  });

  it("il verde dell'esito supera AA sulla carta: e' segno e bordo, e un giorno puo' essere testo", () => {
    expect(contrastRatio(palette.green, palette.paper)).toBeGreaterThanOrEqual(4.5);
  });

  it("il verde si legge sul fondo VERO del riquadro, nei due temi", () => {
    // Il fondo del riquadro non e' un token: e' il verde tinto al 9% dentro la
    // superficie, cioe' una color-mix che sa risolvere solo il browser. I due
    // valori qui sotto sono quelli letti da li', disegnando il colore su una
    // tela e leggendo il pixel: a mente non si ricavano.
    const fondoChiaro = "#E3E5D9";
    const fondoScuro = "#292B24";
    // 3:1 e' la soglia WCAG per gli elementi non testuali, e la spunta con la
    // barra di bordo stanno li' dentro.
    expect(contrastRatio(palette.green, fondoChiaro)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(palette.greenDark, fondoScuro)).toBeGreaterThanOrEqual(3);
    // Ed ecco perche' i verdi sono due: quello di carta, sul fondo scuro, fa
    // 2,39:1. Un "e' andata bene" che in tema scuro non si vede.
    expect(contrastRatio(palette.green, fondoScuro)).toBeLessThan(3);
  });
});

describe("tema scuro", () => {
  it("il testo secondario scuro supera AA su inchiostro", () => {
    expect(contrastRatio(palette.mutedDark, palette.ink)).toBeGreaterThanOrEqual(4.5);
  });

  it("l'arancio su inchiostro è ammesso solo per testo grande", () => {
    expect(contrastRatio(palette.orange, palette.ink)).toBeGreaterThanOrEqual(3);
  });

  it("il border scuro (--line = --muted in tema scuro) supera 3:1 su inchiostro: soglia WCAG per elementi non testuali", () => {
    expect(contrastRatio(palette.muted, palette.ink)).toBeGreaterThanOrEqual(3);
  });

  it("la lampadina accesa supera 3:1 su inchiostro: soglia WCAG per elementi non testuali", () => {
    expect(contrastRatio(palette.bulb, palette.ink)).toBeGreaterThanOrEqual(3);
  });

  it("la lampadina accesa e' invisibile su carta: per questo si accende solo in tema scuro", () => {
    expect(contrastRatio(palette.bulb, palette.paper)).toBeLessThan(1.5);
  });
});

describe("l'archivio dei Lavori", () => {
  // Anche qui i fondi e i testi sono color-mix: i valori sono quelli risolti da
  // Chrome (disegnati su una tela e letti dal pixel), non ricavati a mente.
  const dorsoChiaro = "#DBD7CF"; // inchiostro al 10% nella carta
  const tenueChiaro = "#5A5449"; // --fg-muted all'80% verso --fg
  const facciaScura = "#262420"; // inchiostro al 90% con la carta
  const dorsoScuro = "#1F1D19"; // inchiostro al 94% con la carta
  const riquadroScuro = "#383531"; // carta al 10% nella faccia scura
  const accentoScuro = "#E86944"; // arancio al 90% verso la carta

  it("sul chiaro l'anno della linguetta e la scritta del riservato superano AA", () => {
    // Col tenue globale erano 3,90:1: il dorso e' piu' scuro della carta.
    expect(contrastRatio(palette.muted, dorsoChiaro)).toBeLessThan(4.5);
    expect(contrastRatio(tenueChiaro, dorsoChiaro)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(tenueChiaro, palette.paper)).toBeGreaterThanOrEqual(4.5);
  });

  it("sullo scuro il tenue globale basta gia'", () => {
    expect(contrastRatio(palette.mutedDark, dorsoScuro)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(palette.mutedDark, riquadroScuro)).toBeGreaterThanOrEqual(4.5);
  });

  /**
   * Il fondo della linguetta a profondita' p: il dorso mischiato con
   * l'inchiostro in sRGB, come fa il CSS (color-mix in srgb), che e' la stessa
   * cosa di un velo d'inchiostro sopra. Nel tono chiaro il velo non scende
   * sotto LINGUETTA.buioMinimo.
   */
  const fondoLinguetta = (dorso: string, p: number) => {
    const quota = Math.min(
      1,
      tonoLinguetta(p) === 2
        ? Math.max(p * PARAMETRI.scurisce, LINGUETTA.buioMinimo)
        : p * PARAMETRI.scurisce,
    );
    const canali = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const a = canali(dorso);
    const b = canali(palette.ink);
    return (
      "#" +
      a.map((v, i) => Math.round(v * (1 - quota) + b[i] * quota).toString(16).padStart(2, "0")).join("")
    );
  };
  /** Nome e anno nei tre toni: sul chiaro cambiano, sullo scuro no. */
  const testiChiaro = (p: number) =>
    [
      [palette.ink, tenueChiaro],
      [palette.ink, palette.ink],
      [palette.paper, palette.paper],
    ][tonoLinguetta(p)];
  const testiScuro = [palette.paper, palette.mutedDark];

  it("la linguetta si legge alle due profondita' estreme, nei due temi", () => {
    for (const p of [0, 3]) {
      for (const testo of testiChiaro(p)) {
        expect(contrastRatio(testo, fondoLinguetta(dorsoChiaro, p)), `chiaro a ${p}`).toBeGreaterThanOrEqual(4.5);
      }
      for (const testo of testiScuro) {
        expect(contrastRatio(testo, fondoLinguetta(dorsoScuro, p)), `scuro a ${p}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("e anche a ogni profondita' di mezzo, mentre la cartella scende", () => {
    for (let p = 0; p <= 3.0001; p += 0.01) {
      for (const testo of testiChiaro(p)) {
        expect(
          contrastRatio(testo, fondoLinguetta(dorsoChiaro, p)),
          `chiaro a ${p.toFixed(2)}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
      for (const testo of testiScuro) {
        expect(
          contrastRatio(testo, fondoLinguetta(dorsoScuro, p)),
          `scuro a ${p.toFixed(2)}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("«Apri il caso» sullo scuro supera AA solo con l'arancio schiarito", () => {
    // Pieno faceva 4,21:1 sulla faccia, che e' un gradino sopra l'inchiostro.
    expect(contrastRatio(palette.orange, facciaScura)).toBeLessThan(4.5);
    expect(contrastRatio(accentoScuro, facciaScura)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("la pratica dei Lavori, carta in tutti e due i temi", () => {
  // Il foglio non segue il tema: --carta, --tenue e --arancio valgono uguali
  // sul chiaro e sullo scuro, e le coppie qui sotto valgono per tutti e due.
  // Valori risolti da Chrome (disegnati su una tela e letti dal pixel).
  const arancio = "#A44428"; // --accento-su-carta: arancio al 72% nell'inchiostro
  const allegato = "#EBE7DE"; // il fondo dell'allegato: inchiostro al 4% nella carta

  it("il tenue supera AA sulla carta e sul fondo dell'allegato", () => {
    expect(contrastRatio(palette.muted, palette.paper)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(palette.muted, allegato)).toBeGreaterThanOrEqual(4.5);
  });

  it("l'arancio del timbro e dei numeri supera AA sulla carta, dove l'arancio pieno no", () => {
    expect(contrastRatio(arancio, palette.paper)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(palette.orange, palette.paper)).toBeLessThan(4.5);
  });
});

describe("l'editor della cassetta, scuro in tutti e due i temi", () => {
  // I fondi sono quelli risolti da Chrome (disegnati su una tela e letti dal
  // pixel): la riga nuova e' l'arancio al 10% nell'inchiostro, le barre la
  // carta al 6%. Il codice sta sull'inchiostro pieno.
  const rigaNuova = "#261913";
  const barra = "#1F1D19";

  it("i commenti che portano contenuto sono mutedDark, e superano AA sui tre fondi", () => {
    // Il perche' di un capo e le alternative sono commenti: in muted sul fondo
    // scuro farebbero 3,34:1, sotto AA per un testo di dodici pixel.
    for (const fondo of [palette.ink, rigaNuova, barra]) {
      expect(contrastRatio(palette.mutedDark, fondo)).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrastRatio(palette.muted, palette.ink)).toBeLessThan(4.5);
  });

  it("parole chiave, nomi e stringhe superano AA sul codice e sulla riga nuova", () => {
    for (const fondo of [palette.ink, rigaNuova]) {
      expect(contrastRatio(palette.orange, fondo)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(palette.graph, fondo)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(palette.paper, fondo)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("la barra di stato si legge", () => {
    expect(contrastRatio(palette.graph, barra)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("la mappa della cassetta: i conti degli scomparti", () => {
  // Il conto («5 attrezzi») e' --fg all'80% nel fondo, e le pezze sono toni
  // della famiglia: tutti valori risolti da Chrome, letti dal pixel. Con
  // --fg-muted le pezze piu' cariche del chiaro (front-end, back-end, dati,
  // nel mezzo) scendevano sotto il 4,5:1.
  const pezzeChiare = ["#F6D1C1", "#F6E1D4", "#E3DFD7", "#D4D0C8", "#F6DED1", "#DEDAD2", "#EBE7DE", "#F6E8DD", "#F5F1E8"];
  const pezzeScure = ["#3C2218", "#281A14", "#211E1B", "#2C2A26", "#2B1B14", "#24221E", "#1B1916", "#1F1612", "#14120F"];

  it("si legge su ogni pezza, nei due temi", () => {
    for (const fondo of pezzeChiare) expect(contrastRatio("#3A3733", fondo), fondo).toBeGreaterThanOrEqual(4.5);
    for (const fondo of pezzeScure) expect(contrastRatio("#C2BEB7", fondo), fondo).toBeGreaterThanOrEqual(4.5);
  });

  it("il tenue di prima non bastava sulle pezze cariche: e' il difetto che questa prova blocca", () => {
    expect(contrastRatio(palette.muted, "#D4D0C8")).toBeLessThan(4.5);
  });

  it("i numeri di riga dell'editor sono mutedDark, non muted", () => {
    expect(contrastRatio(palette.mutedDark, palette.ink)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("il bancone delle notizie: le tre categorie, fisse nei due temi", () => {
  // Il corpo della macchina prende il colore della categoria scelta, e sopra
  // ci sono le scritte dei pulsanti (0,62rem) e l'anello di fuoco della
  // manopola e dei pulsanti: tutti nel colore --on-… della categoria.
  const categorie = [
    { nome: "I.A.", fondo: palette.orange, testo: palette.ink },
    { nome: "Design", fondo: palette.bulb, testo: palette.ink },
    { nome: "Codice", fondo: palette.green, testo: palette.paper },
  ];

  it("le scritte e l'anello si leggono sul corpo di ogni categoria", () => {
    for (const c of categorie) {
      expect(contrastRatio(c.testo, c.fondo), c.nome).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("sull'arancio la carta non basta: per questo il testo della I.A. e' inchiostro", () => {
    expect(contrastRatio(palette.paper, palette.orange)).toBeLessThan(4.5);
  });

  it("il giallo sulla carta non si vede: per questo porta il contorno d'inchiostro", () => {
    expect(contrastRatio(palette.bulb, palette.paper)).toBeLessThan(1.5);
    expect(contrastRatio(palette.ink, palette.paper)).toBeGreaterThanOrEqual(3);
  });

  it("il verde e' quello di carta anche nel tema scuro: col verde schiarito la carta sopra non si leggerebbe", () => {
    expect(contrastRatio(palette.paper, palette.greenDark)).toBeLessThan(4.5);
  });

  it("la targa e' inchiostro su carta", () => {
    expect(contrastRatio(palette.ink, palette.paper)).toBeGreaterThanOrEqual(7);
  });
});

describe("il ritaglio delle notizie, carta in tutti e due i temi", () => {
  // Come la pratica dei Lavori: --carta, --tenue e --arancio non seguono il tema.
  const arancio = "#A44428"; // --accento-su-carta: arancio al 72% nell'inchiostro

  it("la riga della fonte, i dati e il timbro superano AA sulla carta", () => {
    expect(contrastRatio(palette.muted, palette.paper)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(arancio, palette.paper)).toBeGreaterThanOrEqual(4.5);
  });
});
