/**
 * Solo codici, numeri e date ISO: i testi li scrive la sezione nella lingua della
 * pagina, cosi' la stessa risposta in cache vale per /it e per /en.
 */

export const CATEGORIES = ["ia", "design", "codice"] as const;
export type CategoryId = (typeof CATEGORIES)[number];

export type StorySource =
  | { id: "hn" }
  | { id: "hf" }
  | { id: "dev"; tag: string }
  | { id: "github"; repo: string };

export type StoryStamp = "prima-pagina" | "paper" | "piu-letto" | "release";

export type StoryFigure =
  | { code: "punti" | "commenti" | "voti" | "autori" | "reazioni" | "lettura"; value: number }
  | { code: "versione"; value: string };

export type Story = {
  /** L'indirizzo, che e' anche la chiave dei doppioni. */
  id: string;
  /** Per le release e' «Next.js 15.5.0»: «e' uscito» lo aggiunge la sezione. */
  title: string;
  url: string;
  /** Senza www. */
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
