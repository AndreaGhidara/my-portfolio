export type Metric = {
  id: string;
  /** Gia' formattato per la resa: puo' contenere +, k, h. */
  value: string;
  /** true finche' il numero non e' stato misurato davvero. */
  estimated: boolean;
  /** Obbligatorio se estimated. */
  howToVerify: string;
};

// ATTENZIONE, scelta consapevole: i numeri stimati sono PLAUSIBILI MA
// INVENTATI, di scala e non commerciali. Non citarli in una call senza averli
// verificati; col dato reale si sostituisce `value` e si mette
// `estimated: false`.
export const metrics: Metric[] = [
  {
    /** Il numero arriva dal CV, confermato vero dall'utente il 2026-09-29: non e'
     *  piu' una stima. */
    id: "riservatoCycleTime",
    value: "< 15 min",
    estimated: false,
    howToVerify:
      "Cronometrare il passaggio dentro la piattaforma con chi lo esegue davvero, e confrontarlo con quanto durava sui vecchi strumenti. Finche' non e' misurato, in call si dice \"si e' passati da ore a minuti\" senza dare il numero.",
  },
  {
    id: "bdroppyPagina",
    value: "< 2 s",
    estimated: true,
    howToVerify: "Misurare il caricamento del contenuto principale (LCP) di una pagina prodotto con PageSpeed Insights, prima e dopo l'aggiornamento, sulla stessa pagina.",
  },
  {
    id: "bdroppyTypescript",
    value: "40%",
    estimated: true,
    howToVerify: "Contare i file .ts/.tsx sul totale dei file sorgente nel repo BDroppy, prima e dopo l'aggiornamento.",
  },
  {
    id: "bdroppyDowntime",
    value: "0",
    estimated: true,
    howToVerify: "Controllare lo storico di uptime del monitoraggio nel periodo della migrazione.",
  },
  {
    id: "aidifyConversations",
    value: "5.000+",
    estimated: true,
    howToVerify: "Esportare il conteggio mensile delle conversazioni dal pannello di Aidify.",
  },
  {
    id: "visualboostCatalog",
    value: "12.000",
    estimated: true,
    howToVerify: "Contare le righe della tabella immagini nel database di VisualBoost.",
  },
  {
    /** Resta stimato: la landing e' stata rifatta da altri, e Lighthouse oggi da'
     *  il voto al lavoro di qualcun altro. */
    id: "visualboostLighthouse",
    value: "90+",
    estimated: true,
    howToVerify:
      "Recuperare il report Lighthouse salvato all'epoca, o rilanciarlo su una copia del progetto di allora. La pagina online oggi non vale: l'ha rifatta qualcun altro.",
  },
  {
    // Il post-it del tavolo: una battuta, non una metrica. Sta qui e stimato
    // perche' ogni numero inventato sta in un posto solo e si dichiara inventato,
    // senza eccezioni.
    id: "coffees",
    value: "23.777",
    estimated: true,
    howToVerify:
      "Non si verifica, ed e' l'unico di questo file per cui va bene: e' una battuta sul lavoro fatto, non un dato. Se qualcuno lo cita in call, la risposta e' \"quello e' il post-it\".",
  },
  {
    id: "years",
    value: "3",
    estimated: false,
    howToVerify: "",
  },
  {
    id: "responseTime",
    value: "24h",
    estimated: false,
    howToVerify: "",
  },
];

export function metricById(id: string): Metric {
  const metric = metrics.find((m) => m.id === id);
  if (!metric) {
    throw new Error(`Metrica "${id}" non trovata in src/content/metrics.ts`);
  }
  return metric;
}
