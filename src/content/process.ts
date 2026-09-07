import type { DeskShape } from "./desk";
import type { Lato } from "./practice";

/**
 * Quello che ti resta in mano, e quando.
 *
 * La sezione diceva «quattro passi, sempre gli stessi», ed erano quattro cose
 * che faccio io: vere, e indistinguibili da quelle di chiunque altro. Adesso
 * dice quattro cose che RICEVI: un documento, uno schermo disegnato, un link,
 * un numero di telefono, e la differenza non e' di tono: una promessa non si
 * puo' verificare, un oggetto consegnato si'. E' la stessa mossa de «la prova
 * che puoi fare oggi» nella casella di posta.
 *
 * L'ordine e' quello del lavoro e non e' scambiabile: e' meta' del titolo, ed
 * e' anche il motivo per cui in pagina resta una lista ordinata invece di
 * quattro riquadri.
 */
export type ProcessSample = "accordo" | "bozza" | "indirizzo" | "numero";

export type ProcessDelivery = {
  /** E' anche la chiave di traduzione: process.list.<id>.* */
  id: string;
  /**
   * Da che parte sta il disegno; il testo sta dall'altra. Si alternano, e una
   * prova lo verifica: due voci di fila dallo stesso lato lasciano una colonna
   * vuota alta mezzo schermo, ed e' il difetto che questo impaginato ha per
   * costruzione se nessuno lo guarda.
   */
  lato: Lato;
  /**
   * La sagoma e' quella del tavolo (le stesse di `public/brand/desk/`) e non
   * un disegno nuovo. La regola sta scritta in PracticeBlock.tsx e vale anche
   * qui: il sito non aggiunge vocabolari di illustrazione, li riusa.
   *
   * Due consegne su quattro sono lo stesso `sheet`, ed e' voluto: un documento
   * e un wireframe SONO due fogli. A distinguerli e' il campione, che e' la
   * cosa che i campioni esistono per fare.
   */
  shape: DeskShape;
  /**
   * Il campione: NON uno di quelli del tavolo. La regola del sito e' che un
   * campione e' un frammento della cosa, e queste quattro cose non sono i
   * livelli del tavolo: sono quello che ti resta in mano. Stessa mano, stesse
   * marche, contenuto proprio; per questo il tipo e' suo e la tavola dei
   * disegni sta in ProcessSpecimen, non in DeskSpecimen (dove una prova esige
   * che ogni disegno sia reclamato da un oggetto del tavolo, e questi non lo
   * sono).
   */
  campione: ProcessSample;
};

export const processDeliveries: ProcessDelivery[] = [
  { id: "documento", lato: "sx", shape: "sheet", campione: "accordo" },
  { id: "schermo", lato: "dx", shape: "sheet", campione: "bozza" },
  { id: "link", lato: "sx", shape: "phone", campione: "indirizzo" },
  { id: "numero", lato: "dx", shape: "card", campione: "numero" },
];
