import { describe, it, expect } from "vitest";
import { lunghezzaDelTratteggio, TESSITURA, INTRO_FILO } from "../presets";

/**
 * Un finto <path>: jsdom non ha ne' getTotalLength ne' getScreenCTM, e qui
 * serve poter decidere il fattore di scala fra unita' di viewBox e pixel.
 */
function finto({
  lunghezza,
  scala,
  nonScala,
}: {
  lunghezza: number;
  scala: number;
  nonScala: boolean;
}) {
  return {
    getTotalLength: () => lunghezza,
    getPointAtLength: (d: number) => ({ x: d, y: 0 }),
    getScreenCTM: () => ({ a: scala, b: 0, c: 0, d: scala, e: 0, f: 0 }),
    getAttribute: (nome: string) =>
      nome === "vector-effect" && nonScala ? "non-scaling-stroke" : null,
  } as unknown as SVGPathElement;
}

describe("lunghezzaDelTratteggio", () => {
  it("con non-scaling-stroke misura in pixel di schermo, non in unita' di viewBox", () => {
    // Il difetto vero: il filo vive in un viewBox 0-100 stirato a tutta
    // pagina, quindi getTotalLength() dice 130 mentre a schermo il tratto e'
    // lungo quasi mille pixel. Con il numero sbagliato nel dasharray il filo
    // non si disegna: sfila un tratteggio di sette trattini.
    expect(lunghezzaDelTratteggio(finto({ lunghezza: 130.9, scala: 7.6, nonScala: true })))
      .toBeCloseTo(130.9 * 7.6, 1);
  });

  it("senza quel vector-effect il tratteggio e' gia' in unita' di viewBox", () => {
    // E' il caso della ragnatela: li' getTotalLength() e' gia' la risposta.
    expect(lunghezzaDelTratteggio(finto({ lunghezza: 400, scala: 3, nonScala: false })))
      .toBe(400);
  });

  it("non esplode dove il browser non sa misurare", () => {
    // jsdom: getTotalLength e' un finto che risponde 0, e le altre non ci sono.
    const nudo = { getTotalLength: () => 0 } as unknown as SVGPathElement;
    expect(lunghezzaDelTratteggio(nudo)).toBe(0);
  });
});

describe("la finestra dello scrub del filo", () => {
  it("apre e chiude sulla STESSA riga dello schermo", () => {
    // E' l'unica cosa che rende il filo UNA linea invece di sette. Il fondo di
    // una sezione e' la cima della successiva: se la corsa di sopra chiude a
    // una quota e quella di sotto apre a un'altra, le due si sovrappongono (o
    // lasciano un buco) per tutta la distanza fra le due quote.
    //
    // Col default di prima, "top bottom" -> "bottom top", la sovrapposizione
    // era una schermata intera: misurato nel DOM al caricamento, il filo
    // dell'apertura era disegnato al 59% e quello della sezione dopo gia' al
    // 17%. Due corse in movimento insieme, e la pagina non sembrava piu' una
    // cosa sola.
    const quota = (v: string) => v.split(" ")[1];
    expect(quota(TESSITURA.inizio)).toBe(quota(TESSITURA.fine));
    expect(TESSITURA.inizio.split(" ")[0]).toBe("top");
    expect(TESSITURA.fine.split(" ")[0]).toBe("bottom");
  });
});

describe("l'entrata del filo nell'apertura", () => {
  it("sta dentro la coreografia dell'apertura, non dopo", () => {
    // I numeri non sono arbitrari, vengono dalla timeline di HeroMotion: i
    // timbri delle lettere chiudono verso 1,0s, la copy entra fra 1,15s e
    // 2,1s, e le frecce che invitano a scorrere arrivano per ultime verso
    // 2,8s. Il filo deve partire con la copy e chiudere entro le frecce: e'
    // lui l'invito a scendere, e arriva quando c'e' gia' qualcosa da
    // guardare. Se qualcuno lo sposta fuori da quella finestra, il filo si
    // disegna su una pagina ferma e sembra un ripensamento.
    expect(INTRO_FILO.ritardo).toBeGreaterThanOrEqual(0.9);
    expect(INTRO_FILO.ritardo + INTRO_FILO.durata).toBeLessThanOrEqual(2.8);
  });
});

describe("entrata e scorrimento si compongono", () => {
  /**
   * E' la parte che nessuno screenshot puo' controllare: sotto virtual time
   * l'orologio di GSAP non avanza, e infatti nei dump headless anche i timbri
   * delle lettere restano a meta'. Qui il tempo lo si muove a mano.
   *
   * Un finto path: gsap.set su un oggetto qualunque gli scrive le proprieta'
   * addosso, quindi si puo' leggere che numero e' finito nel dashoffset.
   */
  function fintoPath(lunghezza: number) {
    return {
      getTotalLength: () => lunghezza,
      getAttribute: () => null,
      strokeDasharray: 0,
      strokeDashoffset: 0,
    } as unknown as SVGPathElement & { strokeDashoffset: number };
  }

  it("senza un riquadro da cui misurare, l'entrata si fa da parte", async () => {
    // L'entrata e' una testa che scende attraverso la fascia di una sezione:
    // senza sezione non c'e' fascia, e nascondere il filo per due secondi
    // sarebbe peggio del difetto che l'entrata risolve. Comanda lo scorrimento.
    //
    // Che al primo fotogramma non sia disegnato NIENTE e' provato altrove e
    // meglio: da frazioneDiEntrata con la geometria vera (sotto), e dal DOM
    // del sito, letto tre volte a tre risoluzioni.
    const { weave } = await import("../presets");
    const path = fintoPath(1000);
    const tl = weave([path as unknown as SVGPathElement], {
      level: "full",
      scrub: true,
      intro: true,
    });
    tl?.pause();
    tl?.progress(0.9);
    expect(path.strokeDashoffset).toBeCloseTo(100, 0);
  });

  it("senza entrata il filo vale subito quello che dice lo scorrimento", async () => {
    const { weave } = await import("../presets");
    const path = fintoPath(1000);
    const tl = weave([path as unknown as SVGPathElement], { level: "full", scrub: true });
    tl?.pause();
    tl?.progress(0.9);
    expect(path.strokeDashoffset).toBeCloseTo(100, 0);
  });
});

describe("l'entrata e' una testa sola che scende", () => {
  /**
   * I numeri sono quelli veri, misurati sul sito a finestra 1280x1200:
   * l'apertura e' alta 849px, la seconda sezione comincia li' ed e' alta
   * ~900px, e la riga di tessitura sta a 0,85 x 1200 = 1020px. E' proprio la
   * misura in cui si vedeva il difetto: a caricamento fermo la riga cade DENTRO
   * la seconda sezione, che infatti partiva con il 19% gia' disegnato.
   */
  const APERTURA = { cima: 0, altezza: 849 };
  const SECONDA = { cima: 849, altezza: 900 };
  const RIGA = 1020;

  it("a meta' entrata la seconda sezione non ha ancora cominciato", async () => {
    const { frazioneDiEntrata } = await import("../presets");
    const testa = 0.5 * RIGA;
    expect(frazioneDiEntrata(testa, APERTURA.cima, APERTURA.altezza)).toBeCloseTo(0.6, 2);
    expect(frazioneDiEntrata(testa, SECONDA.cima, SECONDA.altezza)).toBe(0);
  });

  it("a fine entrata ogni corsa sta dove la vuole lo scorrimento", async () => {
    const { frazioneDiEntrata } = await import("../presets");
    // 100% e 19%: sono i due numeri letti nel DOM al caricamento, quindi la
    // consegna all'ingranaggio dello scroll avviene senza salti.
    expect(frazioneDiEntrata(RIGA, APERTURA.cima, APERTURA.altezza)).toBe(1);
    expect(frazioneDiEntrata(RIGA, SECONDA.cima, SECONDA.altezza)).toBeCloseTo(0.19, 2);
  });

  it("la riga dell'entrata e quella dello scorrimento sono la stessa", async () => {
    const { FINESTRA, TESSITURA } = await import("../presets");
    expect(FINESTRA).toBeCloseTo(Number.parseFloat(TESSITURA.fine.split(" ")[1]) / 100, 5);
  });
});
