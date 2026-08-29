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
    id: "customertrackBrands",
    value: "3",
    estimated: true,
    howToVerify: "Contare le istanze white-label attive in produzione.",
  },
  {
    id: "visualboostCatalog",
    value: "12.000",
    estimated: true,
    howToVerify: "Contare le righe della tabella immagini nel database di VisualBoost.",
  },
  {
    id: "years",
    value: "6",
    estimated: true,
    howToVerify: "Contare gli anni dal primo incarico retribuito. Questo è verificabile subito.",
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
