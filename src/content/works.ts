export type Work = {
  /** È anche la chiave di traduzione: works.list.<id>.symptom */
  id: string;
  /**
   * Assente quando non c'e' un sito da visitare. Oggi ce l'hanno tutti e tre,
   * quindi il ramo non si accende mai: resta perche' il quarto caso in arrivo
   * e' coperto da un accordo di riservatezza e non avra' ne' indirizzo ne'
   * schermata. Un "Visita il sito" che porta nel vuoto costa piu' del caso.
   */
  url?: string;
  screenshot: string;
  year: number;
  tech: string[];
  /** Riferimenti a src/content/metrics.ts */
  metricIds: string[];
};

export const works: Work[] = [
  {
    id: "bdroppy",
    url: "https://www.bdroppy.com",
    screenshot: "/works/bdroppy.png",
    year: 2025,
    tech: ["Next.js", "TypeScript", "SEO"],
    metricIds: ["bdroppyComponents", "bdroppyDowntime"],
  },
  {
    id: "aidify",
    url: "https://aidify.cx",
    screenshot: "/works/aidify.png",
    year: 2025,
    tech: ["Next.js", "TypeScript", "GraphQL", "Supabase"],
    metricIds: ["aidifyConversations"],
  },
  {
    id: "visualboost",
    url: "https://visual-boost.com",
    screenshot: "/works/visualboost.png",
    year: 2025,
    tech: ["Next.js", "TypeScript", "SEO"],
    metricIds: ["visualboostCatalog"],
  },
];
