export type Service = {
  /** È anche la chiave di traduzione: services.list.<id>.title */
  id: string;
  /**
   * I pezzi del servizio, tirati fuori dal suo testo: sono le voci numerate
   * dello scontrino e i richiami della tavola accanto, la stessa lista. Anche
   * questi sono chiavi: services.list.<id>.pezzi.<pezzo>. Fra quattro e sei,
   * perche' la tavola ha sei posti.
   */
  pieces: string[];
};

/** L'ordine è deliberato: dal servizio d'ingresso al più impegnativo. */
export const services: Service[] = [
  {
    id: "sites",
    pieces: ["treSecondi", "struttura", "parole", "immagini", "velocita", "indicizzazione"],
  },
  {
    id: "ecommerce",
    pieces: ["catalogo", "gestionale", "magazzino", "corriere", "pagamenti", "spedizioni"],
  },
  { id: "webapp", pieces: ["versionePiccola", "utentiVeri", "ruoli", "permessi", "abbonamenti"] },
  { id: "ai", pieces: ["dati", "assistente", "nonSa", "persona"] },
];
