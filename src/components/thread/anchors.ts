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
  works: { in: 88, out: 50 },
  /**
   * Il corridoio, non la diagonale. Da 20 a 50 il filo tagliava in obliquo
   * tutta la sezione e passava in mezzo al testo della seconda consegna: una
   * linea che attraversa un paragrafo si legge come una cancellatura.
   *
   * Le quattro consegne stanno su due colonne che si alternano, e fra le due
   * c'e' un corridoio. Misurato sulla pagina resa a 1400px, escludendo i
   * filetti orizzontali che per forza attraversano ogni colonna, l'unico
   * corridoio senza UN SOLO pixel di contenuto va dal 50,00% al 52,14%.
   * Due punti scarsi: non c'e' spazio per curvare, e infatti la corsa e' quasi
   * verticale. Non e' pigrizia, e' l'unica larghezza disponibile.
   *
   * Non i margini esterni, che pure sono vuoti e larghi venti punti: li' il
   * filo sembrerebbe scansare la sezione invece di attraversarla, e questa e'
   * la sezione di quello che ricevi, non un'illustrazione di lato.
   *
   * Sotto i 900px le voci si impilano su una colonna sola e il testo prende
   * tutta la larghezza: li' il corridoio non esiste e nessun valore lo salva.
   * Vale gia' adesso, con qualunque ancoraggio.
   *
   * Le due sezioni vicine si adeguano perche' l'uscita di una e' l'entrata
   * della successiva e una prova lo verifica: i Lavori escono al 50 (sotto la
   * mensola, dove non c'e' niente) e il percorso entra al 52.
   */
  process: { in: 50, out: 52 },
  journey: { in: 52, out: 10 },
  contact: { in: 10, out: 50 },
};
