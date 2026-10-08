import { describe, it, expect } from "vitest";
import { services } from "@/content/services";
import {
  CHARS_PER_TICK,
  DELAYS,
  FIGURE_SHAPES,
  LINE_WIDTH,
  SLOTS,
  alignEnds,
  callout,
  dotLeader,
  initialPrinter,
  linesAtTicks,
  printerReducer,
  receiptLines,
  ticksToFigure,
  totalTicks,
  type PrinterEvent,
  type PrinterState,
  type ReceiptData,
} from "../receipt";

const receiptData = (index: number, date = ""): ReceiptData => ({
  name: "ANDREA GHIDARA",
  trade: "sviluppo web · full stack",
  date,
  number: "N.",
  index,
  count: 4,
  title: "Siti e landing",
  text: "Niente temi comprati.",
  pieces: ["struttura", "parole", "immagini"],
  total: "TOTALE",
  toDiscuss: "DA PARLARNE",
});

describe("le righe dello scontrino", () => {
  it("intestazione, titolo, testo, figura, pezzi numerati e il totale, in quest'ordine", () => {
    const lines = receiptLines(receiptData(0));
    expect(lines.map((r) => r.text)).toEqual([
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
    expect(lines.find((r) => r.kind === "large")?.text).toBe("SITI E LANDING");
    expect(lines.filter((r) => r.kind === "item")).toHaveLength(3);
  });

  it("la figura sta subito prima della lista che spiega, e non ha testo", () => {
    // Sul telefono e' il disegno della tavola stampato sulla carta; sul
    // desktop non si vede. Senza testo costa un colpo solo: il desktop non
    // se ne accorge.
    const lines = receiptLines(receiptData(0));
    const figure = lines.findIndex((r) => r.kind === "figure");
    expect(lines.filter((r) => r.kind === "figure")).toHaveLength(1);
    expect(lines[figure + 1]).toEqual({ text: "1 struttura", kind: "item" });
    expect(lines[figure].text).toBe("");
  });

  it("il numero e il totale vengono dall'elenco, non da un 04 scritto a mano", () => {
    expect(receiptLines({ ...receiptData(2), count: 7 })[2].text).toMatch(/N\. 03\/07$/);
  });

  it("la data non cambia la lunghezza della riga: il server la scrive vuota", () => {
    // La data esiste solo nel browser (sul server sarebbe quella della build):
    // se allungasse la riga, lo scontrino fantasma e i tempi di stampa
    // cambierebbero dopo il montaggio.
    const without = receiptLines(receiptData(0, ""))[2].text;
    const withDate = receiptLines(receiptData(0, "27/09/2026"))[2].text;
    expect(without).toHaveLength(LINE_WIDTH);
    expect(withDate).toHaveLength(LINE_WIDTH);
    expect(withDate.startsWith("27/09/2026")).toBe(true);
    expect(withDate.endsWith("N. 01/04")).toBe(true);
  });

  it("il totale riempie la riga di puntini, con uno spazio ai due capi", () => {
    const line = dotLeader("TOTALE", "DA PARLARNE");
    expect(line).toHaveLength(LINE_WIDTH);
    expect(line).toMatch(/^TOTALE \.+ DA PARLARNE$/);
    expect(dotLeader("TOTAL", "LET'S TALK")).toMatch(/^TOTAL \.+ LET'S TALK$/);
  });
});

describe("la stampa carattere per carattere", () => {
  const lines = receiptLines(receiptData(0));

  it("tre caratteri a colpo, uno solo sul titolo grande", () => {
    expect(CHARS_PER_TICK.line).toBe(3);
    expect(CHARS_PER_TICK.large).toBe(1);
    const afterOne = linesAtTicks(lines, 1);
    expect(afterOne).toEqual([{ text: "AND", kind: "line" }]);
  });

  it("una riga finita lascia il colpo dopo alla riga seguente", () => {
    // «ANDREA GHIDARA» e' lunga 14: cinque colpi.
    expect(linesAtTicks(lines, 5).map((r) => r.text)).toEqual(["ANDREA GHIDARA"]);
    expect(linesAtTicks(lines, 6).map((r) => r.text)).toEqual(["ANDREA GHIDARA", "svi"]);
  });

  it("sa a quale colpo esce la figura: e' l'ultima riga stampata", () => {
    const figureTick = ticksToFigure(lines);
    expect(linesAtTicks(lines, figureTick).at(-1)?.kind).toBe("figure");
    expect(linesAtTicks(lines, figureTick - 1).some((r) => r.kind === "figure")).toBe(false);
    expect(ticksToFigure(lines.filter((r) => r.kind !== "figure"))).toBe(-1);
  });

  it("a colpi finiti lo scontrino e' intero", () => {
    const total = totalTicks(lines);
    expect(linesAtTicks(lines, total)).toEqual(lines);
    expect(linesAtTicks(lines, total + 50)).toEqual(lines);
    expect(linesAtTicks(lines, total - 1)).not.toEqual(lines);
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
      const toLeft = SLOTS[k].l[0] < 300;
      expect(r.anchor).toBe(toLeft ? "end" : "start");
      expect(r.x < SLOTS[k].l[0]).toBe(toLeft);
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
  const TOTALS = [40, 30, 20, 10];
  const run = (s: PrinterState, ...events: PrinterEvent[]) =>
    events.reduce((acc, e) => printerReducer(acc, e, TOTALS), s);
  const empty = run(initialPrinter(TOTALS), { type: "clear" });

  it("parte con il primo servizio gia' stampato: e' il markup del server", () => {
    const s = initialPrinter(TOTALS);
    expect(s).toMatchObject({ phase: "idle", service: 0, ticks: 40, drawing: 0 });
  });

  it("un tasto su una stampante vuota comincia a stampare", () => {
    const s = run(empty, { type: "press", service: 2, immediate: false });
    expect(s).toMatchObject({ phase: "printing", service: 2, ticks: 0, drawing: 2 });
    expect(s.traced).toBe(empty.traced + 1);
  });

  it("stampa un colpo alla volta e si ferma a scontrino finito", () => {
    let s = run(empty, { type: "press", service: 3, immediate: false });
    for (let i = 0; i < 9; i++) s = run(s, { type: "tick", gen: s.gen });
    expect(s).toMatchObject({ phase: "printing", ticks: 9 });
    s = run(s, { type: "tick", gen: s.gen });
    expect(s).toMatchObject({ phase: "idle", service: 3, ticks: 10 });
  });

  it("un colpo di un'altra generazione non stampa niente", () => {
    const s = run(empty, { type: "press", service: 1, immediate: false });
    expect(run(s, { type: "tick", gen: s.gen - 1 })).toBe(s);
  });

  it("un altro tasto strappa il vecchio e stampa il nuovo quando e' caduto", () => {
    let s = run(empty, { type: "press", service: 0, immediate: false });
    s = run(s, { type: "press", service: 1, immediate: false });
    expect(s).toMatchObject({ phase: "tearing", service: 0, next: 1 });
    s = run(s, { type: "dropped", gen: s.gen });
    expect(s).toMatchObject({ phase: "printing", service: 1, ticks: 0, next: null });
  });

  it("due tocchi di fila non fanno mai due scontrini", () => {
    let s = run(empty, { type: "press", service: 0, immediate: false });
    s = run(s, { type: "press", service: 1, immediate: false });
    const firstDropGen = s.gen;
    s = run(s, { type: "press", service: 2, immediate: false });
    // Il secondo tocco cambia solo cosa si stampa dopo: lo strappo resta uno.
    expect(s).toMatchObject({ phase: "tearing", next: 2, gen: firstDropGen });
    s = run(s, { type: "dropped", gen: firstDropGen });
    expect(s).toMatchObject({ phase: "printing", service: 2 });
    // Un secondo «caduto» con la stessa generazione (lo StrictMode, un timer
    // rimasto) non ricomincia niente.
    expect(run(s, { type: "dropped", gen: firstDropGen })).toBe(s);
  });

  it("l'autostampa non passa sopra a chi ha gia' toccato", () => {
    const touched = run(empty, { type: "press", service: 3, immediate: false });
    expect(run(touched, { type: "autoprint" })).toBe(touched);
    const torn = run(touched, { type: "tear", immediate: true });
    expect(run(torn, { type: "autoprint" })).toBe(torn);
  });

  it("svuota toglie anche il disegno, e la tavola resta bianca fino alla stampa", () => {
    // Tracciata dal server e poi cancellata e ridisegnata sotto gli occhi
    // all'autostampa, era un salto. Sul telefono la tavola non c'e' piu': il
    // disegno si stampa sulla carta.
    const initial = initialPrinter(TOTALS);
    expect(initial.emptyPlate).toBe(false);
    const s = run(initial, { type: "clear" });
    expect(s.emptyPlate).toBe(true);
    expect(s.traced).toBe(initial.traced + 1);
    const printing = run(s, { type: "autoprint" });
    expect(printing).toMatchObject({ phase: "printing", emptyPlate: false });
    expect(printing.traced).toBe(s.traced + 1);
    // Se il movimento si spegne prima, la tavola torna disegnata.
    expect(run(s, { type: "complete" }).emptyPlate).toBe(false);
  });

  it("svuota non toglie mai uno scontrino chiesto da qualcuno", () => {
    // Lo svuotamento arriva alla prima osservazione della stampante, un
    // fotogramma dopo il montaggio: se nel frattempo c'e' stato un tocco, lo
    // scontrino e' suo.
    const touched = run(initialPrinter(TOTALS), { type: "press", service: 2, immediate: false });
    expect(run(touched, { type: "clear" })).toBe(touched);
  });

  it("l'autostampa stampa il primo servizio, una volta", () => {
    const s = run(empty, { type: "autoprint" });
    expect(s).toMatchObject({ phase: "printing", service: 0 });
    expect(run(s, { type: "tear", immediate: true }, { type: "autoprint" })).toMatchObject({
      service: null,
    });
  });

  it("strappa senza un tasto dopo: lo scontrino cade e la stampante resta vuota", () => {
    let s = run(empty, { type: "press", service: 1, immediate: false });
    s = run(s, { type: "tear", immediate: false });
    expect(s).toMatchObject({ phase: "tearing", service: 1, next: null });
    s = run(s, { type: "dropped", gen: s.gen });
    expect(s).toMatchObject({ phase: "idle", service: null });
    // Il disegno resta quello di prima: la tavola non si cancella.
    expect(s.drawing).toBe(1);
  });

  it("senza movimento il tasto sostituisce subito lo scontrino, gia' stampato", () => {
    const s = run(initialPrinter(TOTALS), { type: "press", service: 2, immediate: true });
    expect(s).toMatchObject({ phase: "idle", service: 2, ticks: 20, drawing: 2 });
  });

  it("se il movimento si spegne a meta', lo scontrino resta intero", () => {
    let s = run(empty, { type: "press", service: 1, immediate: false }, { type: "complete" });
    expect(s).toMatchObject({ phase: "idle", service: 1, ticks: 30 });
    s = run(empty, { type: "press", service: 0, immediate: false });
    s = run(s, { type: "press", service: 3, immediate: false }, { type: "complete" });
    expect(s).toMatchObject({ phase: "idle", service: 3, ticks: 10, drawing: 3 });
    // Prima di qualunque tocco la sezione si deve leggere: torna il primo.
    expect(run(empty, { type: "complete" })).toMatchObject({ service: 0, ticks: 40 });
  });
});
