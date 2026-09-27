/**
 * Le corse del filo attraverso la pagina.
 *
 * Non tutte le sezioni ne hanno una: «Il tavolo» e «Dove ho imparato» NON
 * disegnano il filo, ed e' una scelta, non una dimenticanza. Sono tutte e due
 * scene agganciate: un palco sticky fermo sullo schermo mentre la pagina gli
 * scorre sotto per migliaia di pixel. Una linea verticale che le attraversa o
 * passa SOPRA la scena, e allora la taglia, o passa DIETRO, e allora resta
 * coperta dal palco per tutta la corsa. Non esiste una terza possibilita'
 * finche' quelle sezioni sono scene. Il filo quindi si interrompe prima di
 * ciascuna e riprende dopo: le due interruzioni sono in INTERRUZIONE.
 */
export type SectionId = "hero" | "seeking" | "works" | "process" | "contact";

/** L'ordine in cui il filo attraversa la pagina. */
export const SECTION_ORDER: SectionId[] = ["hero", "seeking", "works", "process", "contact"];

/**
 * I punti in cui il filo si interrompe, dichiarati invece che dedotti. Ogni
 * coppia e' fatta di due sezioni consecutive del filo, e ognuna deve dire
 * PERCHE' li' il filo non passa: la prova di continuita' salta esattamente
 * queste coppie e nessun'altra. Una rottura senza una voce qui, o una voce
 * senza una ragione, e' un filo spezzato per sbaglio.
 */
export const INTERRUZIONE: readonly { tra: readonly [SectionId, SectionId]; perche: string }[] = [
  {
    tra: ["seeking", "works"],
    perche:
      "In mezzo c'e' il tavolo, una camera alta 380vh col palco inchiodato: il filo o taglia la scena o resta coperto per tutta la corsa.",
  },
  {
    tra: ["process", "contact"],
    perche:
      "In mezzo c'e' il percorso, una scena agganciata che scorre in orizzontale: una linea verticale non la attraversa senza tagliarla. La riga di quella sezione e' la sua onda, dello stesso colore.",
  },
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
   * mensola, dove non c'e' niente).
   */
  process: { in: 50, out: 52 },
  /**
   * Entra al 10 e non al 52 dove il filo esce da «Come lavoro»: in mezzo c'e'
   * il percorso, alto diverse schermate, e i due capi non si vedono mai
   * insieme. E' la stessa ragione per cui i Lavori entrano all'88. Il 10 e'
   * la corsa che questa sezione aveva gia', quando il filo ci arrivava dal
   * percorso: spostarlo per farlo combaciare costerebbe il suo disegno.
   */
  contact: { in: 10, out: 50 },
};
