export type Work = {
  /** È anche la chiave di traduzione: works.list.<id>.riga */
  id: string;
  /**
   * Assente quando non c'e' un sito da visitare. Oggi ce l'hanno tutti e tre,
   * quindi il ramo non si accende mai: resta perche' il quarto caso in arrivo
   * e' coperto da un accordo di riservatezza e non avra' ne' indirizzo ne'
   * schermata. Un "Visita il sito" che porta nel vuoto costa piu' del caso.
   */
  url?: string;
  /**
   * Assente quando non c'e' niente da mostrare. Il caso riservato non ha una
   * schermata per lo stesso motivo per cui non ha un indirizzo.
   */
  screenshot?: string;
  year: number;
  tech: string[];
  /** Riferimenti a src/content/metrics.ts */
  metricIds: string[];
};

export const works: Work[] = [
  {
    /**
     * Il lavoro di adesso, coperto da un accordo di riservatezza: niente nome,
     * niente indirizzo, niente schermata. E' l'unico modo di far entrare qui
     * dentro quello che sto facendo ORA — gli altri tre vengono tutti da
     * D.lab, finita ad aprile — e sta in cima perche' e' il piu' recente.
     */
    id: "riservato",
    year: 2026,
    tech: ["Next.js", "TypeScript", "Node.js", "PostgreSQL"],
    metricIds: [],
  },
  {
    id: "bdroppy",
    url: "https://www.bdroppy.com",
    screenshot: "/works/bdroppy.webp",
    year: 2025,
    tech: ["Next.js", "TypeScript", "SEO"],
    metricIds: ["bdroppyComponents", "bdroppyDowntime"],
  },
  {
    id: "aidify",
    url: "https://aidify.cx",
    screenshot: "/works/aidify.webp",
    year: 2025,
    tech: ["Next.js", "TypeScript", "GraphQL", "Supabase"],
    metricIds: ["aidifyConversations"],
  },
  {
    id: "visualboost",
    url: "https://visual-boost.com",
    screenshot: "/works/visualboost.webp",
    year: 2025,
    tech: ["Next.js", "TypeScript", "SEO"],
    metricIds: ["visualboostCatalog"],
  },
];
