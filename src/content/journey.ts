export type JourneyEntry = {
  /** E' anche la chiave di traduzione: journey.list.<id>.role */
  id: string;
  company: string;
  year: number;
  /** Da freelance no: il cartellino resta tratteggiato e vuoto. E' l'unico dato
   *  che dice qualcosa sul tipo di rapporto invece che sul lavoro. */
  badge: boolean;
};

/** Dal piu' recente: il test lo verifica. */
export const journey: JourneyEntry[] = [
  { id: "freelanceOggi", company: "Freelance", year: 2026, badge: false },
  { id: "dlab", company: "D.lab", year: 2025, badge: true },
  { id: "eroi", company: "E.ROI srl", year: 2024, badge: true },
  { id: "freelanceInizio", company: "Freelance", year: 2023, badge: false },
];
