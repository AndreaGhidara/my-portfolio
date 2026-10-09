export type Service = {
  /** E' anche la chiave di traduzione: services.list.<id>.title */
  id: string;
  /** Le voci numerate dello scontrino e i richiami della tavola accanto. Sono
   *  chiavi: services.list.<id>.pezzi.<pezzo>. Fra quattro e sei, perche' la
   *  tavola ha sei posti. */
  pieces: string[];
};

/** L'ordine e' deliberato: dal servizio d'ingresso al piu' impegnativo. */
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
