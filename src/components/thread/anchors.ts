export type SectionId =
  | "hero" | "seeking" | "services" | "works" | "process" | "journey" | "contact";

/** L'ordine in cui il filo attraversa la pagina. */
export const SECTION_ORDER: SectionId[] = [
  "hero", "seeking", "services", "works", "process", "journey", "contact",
];

/**
 * Il filo NON è un unico path globale: sarebbe fragile e impossibile da
 * tenere allineato al variare delle altezze delle sezioni. Ogni sezione
 * disegna il proprio segmento, e la continuità visiva è garantita dal
 * fatto che l'uscita di una coincide con l'entrata della successiva — è
 * esattamente ciò che verifica il test.
 * I valori sono percentuali della larghezza della pagina.
 */
export const THREAD_ANCHORS: Record<SectionId, { in: number; out: number }> = {
  hero: { in: 6, out: 82 },
  seeking: { in: 82, out: 14 },
  services: { in: 14, out: 88 },
  works: { in: 88, out: 20 },
  process: { in: 20, out: 50 },
  journey: { in: 50, out: 10 },
  contact: { in: 10, out: 50 },
};
