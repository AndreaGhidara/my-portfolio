/** Scritto a mano e non ricavato dall'anno: e' il timbro della pratica, e deve
 *  essere vero. */
export type WorkStatus = "consegnato" | "in-corso";

export type Work = {
  /** E' anche la chiave di traduzione: works.list.<id>.riga */
  id: string;
  /** Assente senza un sito da visitare. Oggi ce l'hanno tutti: il ramo resta per
   *  il prossimo caso coperto da un accordo di riservatezza. */
  url?: string;
  screenshot?: string;
  year: number;
  status: WorkStatus;
  tech: string[];
  /** Riferimenti a src/content/metrics.ts */
  metricIds: string[];
};

export const works: Work[] = [
  {
    /** Il lavoro di adesso, coperto da un accordo di riservatezza: niente nome,
     *  indirizzo ne' schermata. In cima perche' e' il piu' recente. */
    id: "riservato",
    year: 2026,
    status: "in-corso",
    tech: ["Next.js", "TypeScript", "Node.js", "PostgreSQL"],
    metricIds: ["riservatoCycleTime"],
  },
  {
    id: "bdroppy",
    url: "https://www.bdroppy.com",
    screenshot: "/works/bdroppy.webp",
    year: 2025,
    status: "consegnato",
    tech: ["Next.js", "TypeScript", "SEO"],
    metricIds: ["bdroppyPagina", "bdroppyTypescript", "bdroppyDowntime"],
  },
  {
    id: "aidify",
    url: "https://aidify.cx",
    screenshot: "/works/aidify.webp",
    year: 2025,
    status: "consegnato",
    tech: ["Next.js", "TypeScript", "GraphQL", "Supabase"],
    metricIds: ["aidifyConversations"],
  },
  {
    id: "visualboost",
    url: "https://visual-boost.com",
    screenshot: "/works/visualboost.webp",
    year: 2025,
    status: "consegnato",
    tech: ["Next.js", "TypeScript", "SEO"],
    metricIds: ["visualboostCatalog", "visualboostLighthouse"],
  },
];
