import type { DeskShape } from "./desk";

export type ProcessSample = "accordo" | "bozza" | "indirizzo" | "numero";

/** Da che parte sta il disegno. Il testo sta dall'altra. */
export type ProcessSide = "right" | "left";

export type ProcessDelivery = {
  /** E' anche la chiave di traduzione: process.list.<id>.* */
  id: string;
  /** Si alternano, e una prova lo verifica: due voci di fila dallo stesso lato
   *  lasciano una colonna vuota alta mezzo schermo. */
  side: ProcessSide;
  /** Le sagome del tavolo (`public/brand/desk/`), non disegni nuovi. Due consegne
   *  sono lo stesso `sheet`, ed e' voluto: a distinguerle e' il campione. */
  shape: DeskShape;
  /** NON uno dei campioni del tavolo: la tavola sta in ProcessSpecimen, perche'
   *  la prova di DeskSpecimen esige che ogni disegno sia di un oggetto del tavolo. */
  sample: ProcessSample;
};

/** L'ordine e' quello del lavoro e non e' scambiabile: e' meta' del titolo, e
 *  per questo in pagina resta una lista ordinata. */
export const processDeliveries: ProcessDelivery[] = [
  { id: "documento", side: "left", shape: "sheet", sample: "accordo" },
  { id: "schermo", side: "right", shape: "sheet", sample: "bozza" },
  { id: "link", side: "left", shape: "phone", sample: "indirizzo" },
  { id: "numero", side: "right", shape: "card", sample: "numero" },
];
