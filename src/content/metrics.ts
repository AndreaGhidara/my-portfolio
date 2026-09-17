export type Metric = {
  id: string;
  /** Già formattato per la resa: può contenere +, k, h. */
  value: string;
  /** true finché il numero non è stato misurato davvero. */
  estimated: boolean;
  /** Come si otterrebbe il dato reale. Obbligatorio se estimated. */
  howToVerify: string;
};

/**
 * ATTENZIONE — decisione presa consapevolmente dall'utente.
 * Tutti i numeri qui sotto sono PLAUSIBILI MA INVENTATI: non sono stati
 * misurati. Sono di scala (componenti, volumi, durate) e non commerciali
 * (conversioni, fatturato), perché sono meno contestabili.
 * Non citarli in una call senza averli prima verificati.
 * Quando arriva il dato reale: sostituisci `value` e metti `estimated: false`.
 */
export const metrics: Metric[] = [
  {
    /**
     * Il caso riservato non aveva numeri, ed era l'unico: senza, il dossier
     * del lavoro di adesso raccontava una scelta senza dire cosa ha prodotto.
     * Il numero arriva dal CV, dov'era scritto e basta: qui dentro almeno
     * porta con se' come si verifica.
     */
    id: "riservatoCycleTime",
    value: "15 min",
    estimated: true,
    howToVerify:
      "Cronometrare il passaggio dentro la piattaforma con chi lo esegue davvero, e confrontarlo con quanto durava sui vecchi strumenti. Finche' non e' misurato, in call si dice \"si e' passati da ore a minuti\" senza dare il numero.",
  },
  {
    id: "bdroppyComponents",
    value: "120",
    estimated: true,
    howToVerify: "Contare i componenti migrati nel repo BDroppy fra il primo e l'ultimo commit della migrazione.",
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
    /**
     * Il numero si misura da solo, ma non piu' su visual-boost.com: la landing
     * pubblica e' stata rifatta da altri dopo, quindi Lighthouse oggi da' il
     * voto al lavoro di qualcun altro. Per questo resta stimato: il 90+ e' un
     * ricordo di una misura vera, e un ricordo non e' una misura.
     */
    id: "visualboostLighthouse",
    value: "90+",
    estimated: true,
    howToVerify:
      "Recuperare il report Lighthouse salvato all'epoca, o rilanciarlo su una copia del progetto di allora. La pagina online oggi non vale: l'ha rifatta qualcun altro.",
  },
  {
    // Il post-it grigio del tavolo. E' l'unico numero del sito che non e' una
    // metrica di lavoro: e' una battuta, e va letta come tale. Sta qui lo stesso
    // — e con estimated: true come gli altri — perche' la regola di questo file
    // e' "ogni numero inventato sta in un posto solo e si dichiara inventato",
    // e un numero che si autorizza l'eccezione perche' e' simpatico e' esatta-
    // mente il modo in cui quella regola smette di valere.
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
