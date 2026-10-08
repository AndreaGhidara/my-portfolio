/**
 * La stampante dei servizi senza DOM: le righe dello scontrino, la stampa a
 * colpi, la macchina a stati della stampante, le forme della tavola e dove
 * vanno i richiami. Il componente porta eventi dentro e disegna quello che
 * esce; la parte che si sbaglia (due tocchi di fila, un timer rimasto indietro)
 * si prova qui.
 *
 * Numeri e disegni sono quelli del prototipo approvato
 * (docs/prototipi/2026-09-27-scontrino-tre-proposte.html, proposta G1):
 * cambiarli qui senza ripassare da li' e' ritarare a occhio chiuso.
 */

import { pad2 } from "@/lib/format";

/** Caratteri di una riga dello scontrino: i separatori e le righe allineate ai due capi. */
export const LINE_WIDTH = 32;

/** Caratteri stampati a ogni colpo. Il titolo grande va piano, uno alla volta. */
export const CHARS_PER_TICK = { line: 3, large: 1 } as const;

/** Millisecondi fra un colpo e l'altro. */
export const TICK_MS = 16;

/** Millisecondi che lo scontrino strappato impiega a cadere prima del prossimo. */
export const DROP_MS = 420;

/**
 * Millisecondi in cui la carta esce sopra la figura stampata, sul telefono: la
 * stampa del testo aspetta, come in una stampante vera.
 */
export const FIGURE_MS = 650;

/** «figura»: il disegno della tavola stampato sulla carta, solo sul telefono. */
export type ReceiptLineKind = "line" | "large" | "item" | "figure";
export type ReceiptLine = { text: string; kind: ReceiptLineKind };

export type ReceiptData = {
  name: string;
  trade: string;
  /** Vuota sul server: la data della build non e' quella di chi guarda. */
  date: string;
  /** «N.», «No.». */
  number: string;
  /** Il posto del servizio nell'elenco, da zero. */
  index: number;
  /** Quanti sono i servizi: il «/04» viene da qui. */
  count: number;
  title: string;
  text: string;
  pieces: string[];
  total: string;
  toDiscuss: string;
};

/** Due testi ai capi della riga, con gli spazi in mezzo. */
export function alignEnds(left: string, right: string): string {
  const gap = Math.max(1, LINE_WIDTH - left.length - right.length);
  return left + " ".repeat(gap) + right;
}

/** «TOTALE ........ DA PARLARNE»: i puntini riempiono la riga. */
export function dotLeader(left: string, right: string): string {
  const dots = Math.max(3, LINE_WIDTH - left.length - right.length - 2);
  return `${left} ${".".repeat(dots)} ${right}`;
}

export function receiptLines(d: ReceiptData): ReceiptLine[] {
  const line = (text: string, kind: ReceiptLineKind = "line"): ReceiptLine => ({ text, kind });
  const separator = line("-".repeat(LINE_WIDTH));
  return [
    line(d.name),
    line(d.trade),
    line(alignEnds(d.date, `${d.number} ${pad2(d.index + 1)}/${pad2(d.count)}`)),
    separator,
    line(d.title.toUpperCase(), "large"),
    line(d.text),
    separator,
    // Senza testo: costa un colpo, e sul desktop non si vede.
    line("", "figure"),
    // Le stesse voci dei richiami sulla tavola, nello stesso ordine.
    ...d.pieces.map((p, k) => line(`${k + 1} ${p}`, "item")),
    separator,
    line(dotLeader(d.total, d.toDiscuss)),
  ];
}

/** Quanti colpi servono a una riga. Anche una riga vuota ne prende uno. */
const ticksFor = (r: ReceiptLine) => Math.max(1, Math.ceil(r.text.length / CHARS_PER_TICK[r.kind === "large" ? "large" : "line"]));

export function totalTicks(lines: ReceiptLine[]): number {
  return lines.reduce((sum, r) => sum + ticksFor(r), 0);
}

/** Il colpo con cui esce la figura: da li' la stampa aspetta la carta. -1 se non c'e'. */
export function ticksToFigure(lines: ReceiptLine[]): number {
  const figureAt = lines.findIndex((r) => r.kind === "figure");
  return figureAt < 0 ? -1 : totalTicks(lines.slice(0, figureAt + 1));
}

/** Lo scontrino dopo `scatti` colpi: le righe finite e quella a meta'. */
export function linesAtTicks(lines: ReceiptLine[], ticks: number): ReceiptLine[] {
  const out: ReceiptLine[] = [];
  let remaining = ticks;
  for (const r of lines) {
    if (remaining <= 0) break;
    const needed = ticksFor(r);
    if (remaining >= needed) {
      out.push(r);
    } else {
      const step = r.kind === "large" ? CHARS_PER_TICK.large : CHARS_PER_TICK.line;
      out.push({ text: r.text.slice(0, remaining * step), kind: r.kind });
    }
    remaining -= needed;
  }
  return out;
}

/* ── La stampante ───────────────────────────────────────────────────────── */

/**
 * Uno stato solo. `gen` cambia a ogni cosa che rende vecchi i timer in volo
 * (una stampa che parte, uno strappo): il colpo e la caduta portano la
 * generazione in cui sono nati, e se non e' piu' quella non fanno niente. E'
 * cosi' che due tocchi di fila, l'autostampa con un tocco, o lo StrictMode che
 * monta due volte non producono mai due scontrini.
 */
export type PrinterState = {
  phase: "idle" | "printing" | "tearing";
  /** Il servizio sullo scontrino, anche mentre cade. null: niente scontrino. */
  service: number | null;
  /** Colpi gia' stampati. */
  ticks: number;
  /** Solo durante lo strappo: cosa stampare appena lo scontrino e' caduto. */
  next: number | null;
  /** Il servizio sulla tavola. Resta anche quando lo scontrino se ne va. */
  drawing: number;
  /** Quante volte la tavola ha ricominciato a tracciarsi: la chiave del disegno. */
  traced: number;
  /** La tavola e' bianca e aspetta la prossima stampa per tracciarsi. */
  emptyPlate: boolean;
  gen: number;
  /** Qualcuno ha gia' premuto: l'autostampa non gli passa sopra. */
  touched: boolean;
};

export type PrinterEvent =
  /** `subito`: senza movimento, niente stampa a colpi e niente caduta. */
  | { type: "press"; service: number; immediate: boolean }
  | { type: "tear"; immediate: boolean }
  | { type: "autoprint" }
  | { type: "tick"; gen: number }
  | { type: "dropped"; gen: number }
  /** La stampante e' ancora sotto lo schermo: si toglie lo scontrino del server e si aspetta l'autostampa. */
  | { type: "clear" }
  /** Il movimento si spegne: quello che c'e' (o stava per arrivare) resta intero. */
  | { type: "complete" };

/** Il markup del server: il primo servizio gia' stampato e disegnato. */
export function initialPrinter(totals: readonly number[]): PrinterState {
  return {
    phase: "idle",
    service: 0,
    ticks: totals[0] ?? 0,
    next: null,
    drawing: 0,
    traced: 0,
    emptyPlate: false,
    gen: 0,
    touched: false,
  };
}

const start = (s: PrinterState, service: number): PrinterState => ({
  ...s,
  phase: "printing",
  service,
  ticks: 0,
  next: null,
  drawing: service,
  traced: s.traced + 1,
  emptyPlate: false,
  gen: s.gen + 1,
  touched: true,
});

const whole = (s: PrinterState, service: number | null, totals: readonly number[]): PrinterState => ({
  ...s,
  phase: "idle",
  service,
  ticks: service === null ? 0 : (totals[service] ?? 0),
  next: null,
  drawing: service ?? s.drawing,
  emptyPlate: false,
  gen: s.gen + 1,
});

export function printerReducer(s: PrinterState, e: PrinterEvent, totals: readonly number[]): PrinterState {
  switch (e.type) {
    case "press":
      if (e.immediate) {
        return { ...whole(s, e.service, totals), traced: s.traced + 1, touched: true };
      }
      // Gia' in caduta: cambia solo cosa esce dopo, lo strappo resta uno.
      if (s.phase === "tearing") return { ...s, next: e.service, touched: true };
      if (s.service !== null) {
        return { ...s, phase: "tearing", next: e.service, gen: s.gen + 1, touched: true };
      }
      return start(s, e.service);

    case "tear":
      if (s.service === null || s.phase === "tearing") return s;
      if (e.immediate) return { ...whole(s, null, totals), touched: true };
      return { ...s, phase: "tearing", next: null, gen: s.gen + 1, touched: true };

    case "autoprint":
      if (s.touched || s.service !== null || s.phase !== "idle") return s;
      return start(s, 0);

    case "tick": {
      if (e.gen !== s.gen || s.phase !== "printing" || s.service === null) return s;
      const total = totals[s.service] ?? 0;
      const ticks = s.ticks + 1;
      return ticks >= total ? { ...s, phase: "idle", ticks: total } : { ...s, ticks };
    }

    case "dropped":
      if (e.gen !== s.gen || s.phase !== "tearing") return s;
      return s.next === null ? whole(s, null, totals) : start(s, s.next);

    case "clear":
      if (s.touched) return s;
      // Via anche il disegno: la tavola si ritraccia con la stampa, e
      // tracciata dal server per poi cancellarsi all'autostampa sarebbe un
      // salto. Sul telefono la tavola non c'e': il disegno esce sulla carta.
      return {
        ...s,
        phase: "idle",
        service: null,
        ticks: 0,
        next: null,
        traced: s.traced + 1,
        emptyPlate: true,
        gen: s.gen + 1,
        touched: false,
      };

    case "complete": {
      const after = s.phase === "tearing" ? s.next : s.service;
      // Prima di qualunque tocco la sezione si deve leggere: torna il primo.
      return whole(s, after ?? (s.touched ? null : 0), totals);
    }
  }
}

/* ── La tavola ─────────────────────────────────────────────────────────── */

/**
 * I disegni dei servizi, in unita' del viewBox 600 x 460, centrati attorno a
 * (300, 215): la finestra del sito, la borsa, il pannello, la nuvoletta della
 * chat. Il primo tratto e' il contorno, gli altri sono i dettagli, piu' fiochi.
 */
export const FIGURE_SHAPES: Record<string, readonly string[]> = {
  sites: [
    "M190 145 H410 V285 H190 Z",
    "M190 165 H410",
    "M200 155 h0.1 M210 155 h0.1 M220 155 h0.1",
    "M210 185 H330",
    "M210 200 H300",
    "M210 222 H270 V240 H210 Z",
    "M345 180 H390 V240 H345 Z",
    "M345 180 L390 240 M390 180 L345 240",
    "M210 262 H390",
  ],
  ecommerce: [
    "M215 170 H385 L400 290 H200 Z",
    "M255 170 C255 125 345 125 345 170",
    "M270 170 C270 140 330 140 330 170",
    "M240 215 H360",
    "M240 235 H330",
    "M300 255 m-10 0 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0",
  ],
  webapp: [
    "M185 145 H415 V285 H185 Z",
    "M185 170 H415",
    "M235 170 V285",
    "M195 185 H225 M195 200 H225 M195 215 H225",
    "M250 185 H300 V225 H250 Z",
    "M315 185 H400 V225 H315 Z",
    "M250 240 H400 V270 H250 Z",
    "M260 260 L290 248 L320 256 L350 244 L390 250",
  ],
  ai: [
    "M200 150 H380 A20 20 0 0 1 400 170 V235 A20 20 0 0 1 380 255 H270 L240 285 V255 H220 A20 20 0 0 1 200 235 V170 A20 20 0 0 1 220 150 Z",
    "M225 180 H370",
    "M225 198 H340",
    "M225 216 H355",
    "M395 285 m-12 0 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0",
    "M375 318 C375 300 415 300 415 318",
  ],
};

/** La cornice della tavola, il cartiglio e il suo divisorio, tre tratti. */
export const FRAME = "M20 20 H580 V440 H20 Z";
export const TITLE_BLOCK = "M290 390 H580 M290 390 V440";
export const DIVIDER = "M500 390 V440";

/**
 * Dove vanno le annotazioni: `p` il punto sul disegno, `l` il gomito dove
 * finisce la linea di richiamo. Il testo parte da li' verso l'esterno. I gomiti
 * stanno 20 unita' piu' dentro che nel prototipo: le voci inglesi piu' lunghe
 * uscivano dalla cornice.
 */
export const SLOTS: readonly { p: readonly [number, number]; l: readonly [number, number] }[] = [
  { p: [205, 150], l: [185, 80] },
  { p: [395, 150], l: [415, 80] },
  { p: [190, 220], l: [170, 215] },
  { p: [410, 225], l: [430, 215] },
  { p: [220, 280], l: [185, 345] },
  { p: [380, 283], l: [415, 345] },
];

/** Secondi di ritardo: le righe del disegno una dopo l'altra, poi i richiami. */
export const DELAYS = {
  line: (k: number) => 0.15 * k,
  callout: (k: number) => 1.1 + k * 0.28,
  text: 0.3,
} as const;

/** Il richiamo del pezzo `k`: la linea, dove sta il testo e quando compare. */
export function callout(k: number) {
  const { p, l } = SLOTS[k];
  const [x, y] = l;
  const toLeft = x < 300;
  const delay = DELAYS.callout(k);
  return {
    point: p,
    d: `M${p[0]} ${p[1]} L${x} ${y} L${toLeft ? x - 12 : x + 12} ${y}`,
    x: toLeft ? x - 18 : x + 18,
    y: y + 4,
    anchor: toLeft ? ("end" as const) : ("start" as const),
    delay,
    textDelay: delay + DELAYS.text,
  };
}
