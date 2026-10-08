import { describe, it, expect } from "vitest";
import { services } from "@/content/services";
import {
  FIGURE_SHAPES,
  LINE_WIDTH,
  CHARS_PER_TICK,
  SLOTS,
  DELAYS,
  alignEnds,
  linesAtTicks,
  dotLeader,
  callout,
  receiptLines,
  ticksToFigure,
  totalTicks,
  printerReducer,
  initialPrinter,
  type ReceiptData,
  type PrinterEvent,
  type PrinterState,
} from "../receipt";

const dati = (indice: number, data = ""): ReceiptData => ({
  name: "ANDREA GHIDARA",
  trade: "sviluppo web · full stack",
  date: data,
  number: "N.",
  index: indice,
  count: 4,
  title: "Siti e landing",
  text: "Niente temi comprati.",
  pieces: ["struttura", "parole", "immagini"],
  total: "TOTALE",
  toDiscuss: "DA PARLARNE",
});

describe("le righe dello scontrino", () => {
  it("intestazione, titolo, testo, figura, pezzi numerati e il totale, in quest'ordine", () => {
    const righe = receiptLines(dati(0));
    expect(righe.map((r) => r.text)).toEqual([
      "ANDREA GHIDARA",
      "sviluppo web · full stack",
      alignEnds("", "N. 01/04"),
      "-".repeat(LINE_WIDTH),
      "SITI E LANDING",
      "Niente temi comprati.",
      "-".repeat(LINE_WIDTH),
      "",
      "1 struttura",
      "2 parole",
      "3 immagini",
      "-".repeat(LINE_WIDTH),
      dotLeader("TOTALE", "DA PARLARNE"),
    ]);
    expect(righe.find((r) => r.kind === "grosso")?.text).toBe("SITI E LANDING");
    expect(righe.filter((r) => r.kind === "voce")).toHaveLength(3);
  });

  it("la figura sta subito prima della lista che spiega, e non ha testo", () => {
    // Sul telefono e' il disegno della tavola stampato sulla carta; sul
    // desktop non si vede. Senza testo costa un colpo solo: il desktop non
    // se ne accorge.
    const righe = receiptLines(dati(0));
    const figura = righe.findIndex((r) => r.kind === "figura");
    expect(righe.filter((r) => r.kind === "figura")).toHaveLength(1);
    expect(righe[figura + 1]).toEqual({ text: "1 struttura", kind: "voce" });
    expect(righe[figura].text).toBe("");
  });

  it("il numero e il totale vengono dall'elenco, non da un 04 scritto a mano", () => {
    expect(receiptLines({ ...dati(2), count: 7 })[2].text).toMatch(/N\. 03\/07$/);
  });

  it("la data non cambia la lunghezza della riga: il server la scrive vuota", () => {
    // La data esiste solo nel browser (sul server sarebbe quella della build):
    // se allungasse la riga, lo scontrino fantasma e i tempi di stampa
    // cambierebbero dopo il montaggio.
    const senza = receiptLines(dati(0, ""))[2].text;
    const con = receiptLines(dati(0, "27/09/2026"))[2].text;
    expect(senza).toHaveLength(LINE_WIDTH);
    expect(con).toHaveLength(LINE_WIDTH);
    expect(con.startsWith("27/09/2026")).toBe(true);
    expect(con.endsWith("N. 01/04")).toBe(true);
  });

  it("il totale riempie la riga di puntini, con uno spazio ai due capi", () => {
    const riga = dotLeader("TOTALE", "DA PARLARNE");
    expect(riga).toHaveLength(LINE_WIDTH);
    expect(riga).toMatch(/^TOTALE \.+ DA PARLARNE$/);
    expect(dotLeader("TOTAL", "LET'S TALK")).toMatch(/^TOTAL \.+ LET'S TALK$/);
  });
});

describe("la stampa carattere per carattere", () => {
  const righe = receiptLines(dati(0));

  it("tre caratteri a colpo, uno solo sul titolo grande", () => {
    expect(CHARS_PER_TICK.riga).toBe(3);
    expect(CHARS_PER_TICK.grosso).toBe(1);
    const dopoUno = linesAtTicks(righe, 1);
    expect(dopoUno).toEqual([{ text: "AND", kind: "riga" }]);
  });

  it("una riga finita lascia il colpo dopo alla riga seguente", () => {
    // «ANDREA GHIDARA» e' lunga 14: cinque colpi.
    expect(linesAtTicks(righe, 5).map((r) => r.text)).toEqual(["ANDREA GHIDARA"]);
    expect(linesAtTicks(righe, 6).map((r) => r.text)).toEqual(["ANDREA GHIDARA", "svi"]);
  });

  it("sa a quale colpo esce la figura: e' l'ultima riga stampata", () => {
    const soglia = ticksToFigure(righe);
    expect(linesAtTicks(righe, soglia).at(-1)?.kind).toBe("figura");
    expect(linesAtTicks(righe, soglia - 1).some((r) => r.kind === "figura")).toBe(false);
    expect(ticksToFigure(righe.filter((r) => r.kind !== "figura"))).toBe(-1);
  });

  it("a colpi finiti lo scontrino e' intero", () => {
    const totale = totalTicks(righe);
    expect(linesAtTicks(righe, totale)).toEqual(righe);
    expect(linesAtTicks(righe, totale + 50)).toEqual(righe);
    expect(linesAtTicks(righe, totale - 1)).not.toEqual(righe);
  });
});

describe("la tavola", () => {
  it("ogni servizio ha il suo disegno", () => {
    expect(Object.keys(FIGURE_SHAPES).sort()).toEqual(services.map((s) => s.id).sort());
    for (const s of services) expect(FIGURE_SHAPES[s.id].length, s.id).toBeGreaterThan(3);
  });

  it("ci sono abbastanza posti per i pezzi di ogni servizio", () => {
    for (const s of services) expect(s.pieces.length, s.id).toBeLessThanOrEqual(SLOTS.length);
  });

  it("i richiami a sinistra scrivono verso sinistra, quelli a destra verso destra", () => {
    // Il testo parte dal gomito verso l'esterno: al contrario finirebbe sopra
    // il disegno.
    for (let k = 0; k < SLOTS.length; k++) {
      const r = callout(k);
      const aSinistra = SLOTS[k].l[0] < 300;
      expect(r.anchor).toBe(aSinistra ? "end" : "start");
      expect(r.x < SLOTS[k].l[0]).toBe(aSinistra);
      expect(r.d.startsWith(`M${SLOTS[k].p[0]} ${SLOTS[k].p[1]}`)).toBe(true);
    }
  });

  it("i tempi sono quelli del prototipo: righe ogni 0,15s, richiami da 1,1s ogni 0,28s", () => {
    expect(DELAYS.line(2)).toBeCloseTo(0.3);
    expect(callout(0).delay).toBeCloseTo(1.1);
    expect(callout(3).delay).toBeCloseTo(1.1 + 3 * 0.28);
    expect(callout(3).textDelay).toBeCloseTo(callout(3).delay + 0.3);
  });
});

/**
 * La stampante e' uno stato solo, e ogni callback ritardato (il colpo di
 * stampa, lo scontrino che finisce di cadere) porta la generazione in cui e'
 * nato: se nel frattempo e' successo altro, arriva e non fa niente.
 */
describe("la stampante", () => {
  const TOTALI = [40, 30, 20, 10];
  const fai = (s: PrinterState, ...eventi: PrinterEvent[]) =>
    eventi.reduce((acc, e) => printerReducer(acc, e, TOTALI), s);
  const vuota = fai(initialPrinter(TOTALI), { type: "svuota" });

  it("parte con il primo servizio gia' stampato: e' il markup del server", () => {
    const s = initialPrinter(TOTALI);
    expect(s).toMatchObject({ phase: "ferma", service: 0, ticks: 40, drawing: 0 });
  });

  it("un tasto su una stampante vuota comincia a stampare", () => {
    const s = fai(vuota, { type: "premi", service: 2, immediate: false });
    expect(s).toMatchObject({ phase: "stampa", service: 2, ticks: 0, drawing: 2 });
    expect(s.traced).toBe(vuota.traced + 1);
  });

  it("stampa un colpo alla volta e si ferma a scontrino finito", () => {
    let s = fai(vuota, { type: "premi", service: 3, immediate: false });
    for (let i = 0; i < 9; i++) s = fai(s, { type: "scatto", gen: s.gen });
    expect(s).toMatchObject({ phase: "stampa", ticks: 9 });
    s = fai(s, { type: "scatto", gen: s.gen });
    expect(s).toMatchObject({ phase: "ferma", service: 3, ticks: 10 });
  });

  it("un colpo di un'altra generazione non stampa niente", () => {
    const s = fai(vuota, { type: "premi", service: 1, immediate: false });
    expect(fai(s, { type: "scatto", gen: s.gen - 1 })).toBe(s);
  });

  it("un altro tasto strappa il vecchio e stampa il nuovo quando e' caduto", () => {
    let s = fai(vuota, { type: "premi", service: 0, immediate: false });
    s = fai(s, { type: "premi", service: 1, immediate: false });
    expect(s).toMatchObject({ phase: "strappo", service: 0, next: 1 });
    s = fai(s, { type: "caduto", gen: s.gen });
    expect(s).toMatchObject({ phase: "stampa", service: 1, ticks: 0, next: null });
  });

  it("due tocchi di fila non fanno mai due scontrini", () => {
    let s = fai(vuota, { type: "premi", service: 0, immediate: false });
    s = fai(s, { type: "premi", service: 1, immediate: false });
    const cadutoDelPrimo = s.gen;
    s = fai(s, { type: "premi", service: 2, immediate: false });
    // Il secondo tocco cambia solo cosa si stampa dopo: lo strappo resta uno.
    expect(s).toMatchObject({ phase: "strappo", next: 2, gen: cadutoDelPrimo });
    s = fai(s, { type: "caduto", gen: cadutoDelPrimo });
    expect(s).toMatchObject({ phase: "stampa", service: 2 });
    // Un secondo «caduto» con la stessa generazione (lo StrictMode, un timer
    // rimasto) non ricomincia niente.
    expect(fai(s, { type: "caduto", gen: cadutoDelPrimo })).toBe(s);
  });

  it("l'autostampa non passa sopra a chi ha gia' toccato", () => {
    const toccata = fai(vuota, { type: "premi", service: 3, immediate: false });
    expect(fai(toccata, { type: "autostampa" })).toBe(toccata);
    const strappata = fai(toccata, { type: "strappa", immediate: true });
    expect(fai(strappata, { type: "autostampa" })).toBe(strappata);
  });

  it("svuota toglie anche il disegno, e la tavola resta bianca fino alla stampa", () => {
    // Tracciata dal server e poi cancellata e ridisegnata sotto gli occhi
    // all'autostampa, era un salto. Sul telefono la tavola non c'e' piu': il
    // disegno si stampa sulla carta.
    const iniziale = initialPrinter(TOTALI);
    expect(iniziale.emptyPlate).toBe(false);
    const s = fai(iniziale, { type: "svuota" });
    expect(s.emptyPlate).toBe(true);
    expect(s.traced).toBe(iniziale.traced + 1);
    const stampa = fai(s, { type: "autostampa" });
    expect(stampa).toMatchObject({ phase: "stampa", emptyPlate: false });
    expect(stampa.traced).toBe(s.traced + 1);
    // Se il movimento si spegne prima, la tavola torna disegnata.
    expect(fai(s, { type: "completa" }).emptyPlate).toBe(false);
  });

  it("svuota non toglie mai uno scontrino chiesto da qualcuno", () => {
    // Lo svuotamento arriva alla prima osservazione della stampante, un
    // fotogramma dopo il montaggio: se nel frattempo c'e' stato un tocco, lo
    // scontrino e' suo.
    const toccata = fai(initialPrinter(TOTALI), { type: "premi", service: 2, immediate: false });
    expect(fai(toccata, { type: "svuota" })).toBe(toccata);
  });

  it("l'autostampa stampa il primo servizio, una volta", () => {
    const s = fai(vuota, { type: "autostampa" });
    expect(s).toMatchObject({ phase: "stampa", service: 0 });
    expect(fai(s, { type: "strappa", immediate: true }, { type: "autostampa" })).toMatchObject({
      service: null,
    });
  });

  it("strappa senza un tasto dopo: lo scontrino cade e la stampante resta vuota", () => {
    let s = fai(vuota, { type: "premi", service: 1, immediate: false });
    s = fai(s, { type: "strappa", immediate: false });
    expect(s).toMatchObject({ phase: "strappo", service: 1, next: null });
    s = fai(s, { type: "caduto", gen: s.gen });
    expect(s).toMatchObject({ phase: "ferma", service: null });
    // Il disegno resta quello di prima: la tavola non si cancella.
    expect(s.drawing).toBe(1);
  });

  it("senza movimento il tasto sostituisce subito lo scontrino, gia' stampato", () => {
    const s = fai(initialPrinter(TOTALI), { type: "premi", service: 2, immediate: true });
    expect(s).toMatchObject({ phase: "ferma", service: 2, ticks: 20, drawing: 2 });
  });

  it("se il movimento si spegne a meta', lo scontrino resta intero", () => {
    let s = fai(vuota, { type: "premi", service: 1, immediate: false }, { type: "completa" });
    expect(s).toMatchObject({ phase: "ferma", service: 1, ticks: 30 });
    s = fai(vuota, { type: "premi", service: 0, immediate: false });
    s = fai(s, { type: "premi", service: 3, immediate: false }, { type: "completa" });
    expect(s).toMatchObject({ phase: "ferma", service: 3, ticks: 10, drawing: 3 });
    // Prima di qualunque tocco la sezione si deve leggere: torna il primo.
    expect(fai(vuota, { type: "completa" })).toMatchObject({ service: 0, ticks: 40 });
  });
});
