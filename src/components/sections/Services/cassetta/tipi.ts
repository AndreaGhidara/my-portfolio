import type { ZonaId } from "@/content/cassetta";

/**
 * Tutti i testi della cassetta, gia' tradotti dal server. Passano al client
 * una volta sola: la mappa, l'editor e l'etichetta leggono da qui, e nessuno
 * dei tre ne tiene una copia sua.
 */
export type TestiCassetta = {
  cuciPer: string;
  tutta: string;
  partenza: string;
  elenco: string;
  radice: { nome: string; cosa: string };
  zone: Record<
    ZonaId,
    {
      nome: string;
      snodo: string;
      corto: string;
      chiave: string;
      cosa: string;
      conta: string;
    }
  >;
  attrezzi: Record<string, { cosa: string; breve: string }>;
  capi: Record<
    string,
    {
      nome: string;
      /** Il tipo del capo nel codice finto dell'editor, nella lingua della pagina. */
      slug: string;
      perche: string;
      alt: Record<string, string>;
      taglia: string;
      stato: string;
    }
  >;
  etichetta: {
    nome: string;
    marca: string;
    composizione: string;
    stima: string;
    fibre: string;
    cura: string;
    curaSe: string;
    alPosto: string;
    contiene: string;
    scomparto: string;
    entraIn: string;
    suRichiesta: string;
    siAbbina: string;
    provato: string;
    lavoro: string;
    conosciuto: string;
    /** «MADE TO MEASURE · 1 PEZZO»: quella di un attrezzo o di uno scomparto. */
    tagliaUno: string;
    indietro: string;
    chiudi: string;
  };
  editor: {
    nome: string;
    cartelle: string;
    file: string;
    cartella: string;
    pacchetto: string;
    funzione: string;
    tipo: string;
    vuoto: string;
    seServe: string;
    serve: string;
    zeroErrori: string;
  };
};

/** Un passo della cronologia: un nodo della mappa (attrezzo, snodo, cartellino) o un capo. */
export type Passo = { tipo: "nodo"; id: string } | { tipo: "capo"; id: string };
