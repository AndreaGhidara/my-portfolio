/**
 * Le corse del filo attraverso la pagina.
 *
 * Non tutte le sezioni ne hanno una: «Il tavolo» NON disegna il filo, ed e' una
 * scelta, non una dimenticanza. Quella sezione e' una camera alta 380vh con il
 * palco inchiodato al centro dello schermo: una linea che la attraversa o passa
 * SOPRA il tavolo, e allora taglia in diagonale la scena, o passa DIETRO, e
 * allora resta coperta dal palco per tutta la corsa. Non esiste una terza
 * possibilita' finche' quella sezione e' una camera. Il filo quindi si
 * interrompe alla fine di «Cosa stai cercando?» e riprende con «I lavori».
 */
export type SectionId = "hero" | "seeking" | "works" | "process" | "journey" | "contact";

/** L'ordine in cui il filo attraversa la pagina. */
export const SECTION_ORDER: SectionId[] = [
  "hero", "seeking", "works", "process", "journey", "contact",
];

/**
 * L'unico punto in cui il filo si interrompe, dichiarato invece che dedotto.
 * Fra queste due sezioni c'e' il tavolo, che non lo disegna: la prova di
 * continuita' salta questa coppia e pretende che sia esattamente questa.
 * Aggiungerne una seconda vuol dire aver spezzato il filo per sbaglio.
 */
export const INTERRUZIONE: readonly [SectionId, SectionId] = ["seeking", "works"];

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
  /**
   * Entra all'88% e non al 14% dove il filo si era interrotto: in mezzo c'e'
   * il tavolo, alto quattro schermate, quindi i due capi non si vedono mai
   * insieme e non c'e' nessun salto da percepire. Cambiarlo per «farli
   * combaciare» costerebbe la corsa di questa sezione o di quella prima, che
   * diventerebbe una riga quasi verticale.
   */
  works: { in: 88, out: 20 },
  process: { in: 20, out: 50 },
  journey: { in: 50, out: 10 },
  contact: { in: 10, out: 50 },
};
