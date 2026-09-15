export type Work = {
  /** È anche la chiave di traduzione: works.list.<id>.symptom */
  id: string;
  /**
   * Assente quando il progetto non è mai stato messo online. CustomerTrack è
   * finito e mai lanciato: un "Visita il sito" che porta su un dominio che non
   * risolve costa piu' del progetto stesso, quindi il pulsante non si disegna.
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
    year: 2024,
    tech: ["Next.js", "TypeScript", "SEO"],
    metricIds: ["bdroppyComponents", "bdroppyDowntime"],
  },
  {
    id: "aidify",
    url: "https://aidify.cx",
    screenshot: "/works/aidify.png",
    year: 2024,
    tech: ["Next.js", "TypeScript", "GraphQL", "Supabase"],
    metricIds: ["aidifyConversations"],
  },
  {
    id: "customertrack",
    screenshot: "/works/customertrack.png",
    year: 2025,
    tech: ["Next.js", "TypeScript", "Analytics"],
    metricIds: ["customertrackBrands"],
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
