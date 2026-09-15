export type JourneyEntry = {
  /** È anche la chiave di traduzione: journey.list.<id>.role */
  id: string;
  company: string;
  year: number;
  /**
   * Se quel posto un tesserino te lo ha dato. Da freelance no, e in pagina si
   * vede: il cartellino resta tratteggiato e vuoto al posto del nome
   * dell'azienda. Non è una decorazione, è l'unico dato di questo file che
   * dice qualcosa sul tipo di rapporto invece che sul lavoro.
   */
  tesserino: boolean;
};

/** Dal più recente: il test lo verifica. */
export const journey: JourneyEntry[] = [
  { id: "freelanceOggi", company: "Freelance", year: 2026, tesserino: false },
  { id: "dlab", company: "D.lab", year: 2025, tesserino: true },
  { id: "eroi", company: "E.Roi srl", year: 2024, tesserino: true },
  { id: "freelanceInizio", company: "Freelance", year: 2023, tesserino: false },
];
