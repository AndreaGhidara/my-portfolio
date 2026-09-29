import type { CategoriaId, Dato, Timbro } from "@/lib/notizie/tipi";

/**
 * I testi della sezione, gia' tradotti dal server. Quelli con le graffe
 * ({n}, {sito}, {ora}) sono modelli: li riempie la macchina con i valori che
 * conosce solo dopo, quando le notizie sono arrivate.
 */
export type TestiNotizie = {
  categorie: Record<CategoriaId, { nome: string; testata: string }>;
  timbri: Record<Timbro, string>;
  dati: Record<Dato["codice"], string>;
  minuti: string;
  rilascio: string;
  leggiSu: string;
  targa: string;
  targaUna: string;
  gruppo: string;
  manopola: string;
  aiuto: string;
  attesa: string;
  vuota: string;
  errore: string;
  finite: string;
  giaUscite: string;
  testata: string;
  nessunaUscita: string;
  senzaRiassunto: string;
  raccolteOggi: string;
  raccolteIl: string;
};
