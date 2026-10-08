/**
 * Quello che /api/notizie restituisce. Non contiene una parola di italiano o di
 * inglese: codici, numeri e date ISO. I testi, «n giorni fa» e le ore li scrive
 * la sezione con la lingua della pagina, cosi' la stessa risposta in cache vale
 * per /it e per /en. Le notizie restano nella loro lingua, che e' l'inglese.
 */

export const CATEGORIES = ["ia", "design", "codice"] as const;
export type CategoryId = (typeof CATEGORIES)[number];

/** Da dove viene: il nome della fonte lo scrive la sezione, qui c'e' solo chi e'. */
export type StorySource =
  | { id: "hn" }
  | { id: "hf" }
  | { id: "dev"; tag: string }
  | { id: "github"; repo: string };

export type StoryStamp = "prima-pagina" | "paper" | "piu-letto" | "release";

/** I numeri in fondo al ritaglio. `versione` e' l'unico che non e' un numero. */
export type StoryFigure =
  | { code: "punti" | "commenti" | "voti" | "autori" | "reazioni" | "lettura"; value: number }
  | { code: "versione"; value: string };

export type Story = {
  /** L'indirizzo, che e' anche la chiave dei doppioni. */
  id: string;
  /** Per le release e' «Next.js 15.5.0»: «e' uscito» lo aggiunge la sezione. */
  title: string;
  url: string;
  /** Il dominio del link, senza www: «Leggi su …». */
  hostname: string;
  /** ISO. */
  when: string;
  source: StorySource;
  stamp: StoryStamp;
  summary?: string;
  figures: StoryFigure[];
};

export type NewsCollection = {
  /** ISO: quando le notizie sono state chieste alle fonti, non quando e' partita questa risposta. */
  collectedAt: string;
  categories: Record<CategoryId, Story[]>;
};
