/**
 * Le corse del filo attraverso la pagina. Quasi tutte coincidono con una
 * sezione, ma non e' una regola: `services` ne contiene DUE — i cavi del tavolo
 * e poi la scena di «E in pratica?», che e' `practice`. Il filo non sa niente
 * dei `<section id>`: sa da dove entra e dove esce.
 */
export type SectionId =
  | "hero" | "seeking" | "services" | "practice" | "works" | "process" | "journey" | "contact";

/** L'ordine in cui il filo attraversa la pagina. */
export const SECTION_ORDER: SectionId[] = [
  "hero", "seeking", "services", "practice", "works", "process", "journey", "contact",
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
  /**
   * Entra e esce dallo stesso punto, ed e' giusto: in mezzo serpeggia. Il
   * tavolo consegna il filo all'88% (sono i cavi, e li' non si tocca niente) e
   * questa scena lo riconsegna ai Lavori dov'era. La prova di continuita' di
   * ThreadSegment.test.tsx copre tutti e due i giunti da sola.
   */
  practice: { in: 88, out: 88 },
  works: { in: 88, out: 20 },
  process: { in: 20, out: 50 },
  journey: { in: 50, out: 10 },
  contact: { in: 10, out: 50 },
};
