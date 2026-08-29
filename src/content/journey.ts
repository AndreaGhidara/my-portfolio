export type JourneyEntry = {
  /** È anche la chiave di traduzione: journey.list.<id>.role */
  id: string;
  company: string;
  year: number;
};

/** Dal più recente: il test lo verifica. */
export const journey: JourneyEntry[] = [
  { id: "idt", company: "IDT spa", year: 2025 },
  { id: "eroi", company: "E.Roi srl", year: 2024 },
  { id: "freelance", company: "Freelance", year: 2023 },
];
