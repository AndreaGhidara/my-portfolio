/**
 * Quello che /api/notizie restituisce. Non contiene una parola di italiano o di
 * inglese: codici, numeri e date ISO. I testi, «n giorni fa» e le ore li scrive
 * la sezione con la lingua della pagina, cosi' la stessa risposta in cache vale
 * per /it e per /en. Le notizie restano nella loro lingua, che e' l'inglese.
 */

export const CATEGORIE = ["ia", "design", "codice"] as const;
export type CategoriaId = (typeof CATEGORIE)[number];

/** Da dove viene: il nome della fonte lo scrive la sezione, qui c'e' solo chi e'. */
export type Fonte =
  | { id: "hn" }
  | { id: "hf" }
  | { id: "dev"; tag: string }
  | { id: "github"; repo: string };

export type Timbro = "prima-pagina" | "paper" | "piu-letto" | "release";

/** I numeri in fondo al ritaglio. `versione` e' l'unico che non e' un numero. */
export type Dato =
  | { codice: "punti" | "commenti" | "voti" | "autori" | "reazioni" | "lettura"; valore: number }
  | { codice: "versione"; valore: string };

export type Notizia = {
  /** L'indirizzo, che e' anche la chiave dei doppioni. */
  id: string;
  /** Per le release e' «Next.js 15.5.0»: «e' uscito» lo aggiunge la sezione. */
  titolo: string;
  url: string;
  /** Il dominio del link, senza www: «Leggi su …». */
  hostname: string;
  /** ISO. */
  quando: string;
  fonte: Fonte;
  timbro: Timbro;
  riassunto?: string;
  dati: Dato[];
};

export type Raccolta = {
  /** ISO: quando le notizie sono state chieste alle fonti, non quando e' partita questa risposta. */
  raccolteAlle: string;
  categorie: Record<CategoriaId, Notizia[]>;
};
