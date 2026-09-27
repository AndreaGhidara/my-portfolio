/**
 * Le corse del filo attraverso la pagina.
 *
 * Non tutte le sezioni ne hanno una: la stampante dei servizi, «Il tavolo», i
 * Lavori e «Dove ho imparato» NON disegnano il filo, ed e' una scelta, non una
 * dimenticanza. Le ultime tre sono scene agganciate: qualcosa di sticky fermo
 * sullo schermo mentre la pagina gli scorre sotto per migliaia di pixel. Una
 * linea verticale che le attraversa o passa SOPRA la scena, e allora la taglia,
 * o passa DIETRO, e allora resta coperta per tutta la corsa. Non esiste una
 * terza possibilita' finche' quelle sezioni sono scene. La stampante non e'
 * agganciata, ma ha le sue linee (la tavola da progetto) e una verticale le
 * taglierebbe. Il filo quindi si interrompe prima e riprende dopo: le
 * interruzioni sono in INTERRUZIONE. Stampante, tavolo e archivio stanno di
 * fila, e li' l'interruzione e' una sola.
 */
export type SectionId = "hero" | "process" | "contact";

/** L'ordine in cui il filo attraversa la pagina, sezioni nascoste comprese. */
export const SECTION_ORDER: SectionId[] = ["hero", "process", "contact"];

/**
 * Le sezioni del filo che adesso non sono in pagina. Restano in SectionId e in
 * THREAD_ANCHORS, con la loro corsa, perche' rimetterle sia una riga: togliere
 * la voce qui e riportare il componente in page.tsx. Una prova controlla che
 * questa lista e page.tsx dicano la stessa cosa.
 */
export const NASCOSTE: readonly { sezione: SectionId; perche: string }[] = [
  {
    sezione: "process",
    perche:
      "«Come possiamo proseguire» e' nascosta per scelta, non tolta: componente, testi e prove restano, e in page.tsx c'e' scritto come rimetterla.",
  },
];

/** Le sezioni che il filo attraversa davvero, nell'ordine della pagina. */
export const IN_PAGINA: SectionId[] = SECTION_ORDER.filter(
  (sezione) => !NASCOSTE.some((n) => n.sezione === sezione),
);

/**
 * I punti in cui il filo si interrompe, dichiarati invece che dedotti. Ogni
 * coppia e' fatta di due sezioni consecutive del filo, e ognuna deve dire
 * PERCHE' li' il filo non passa: la prova di continuita' salta esattamente
 * queste coppie e nessun'altra. Una rottura senza una voce qui, o una voce
 * senza una ragione, e' un filo spezzato per sbaglio.
 *
 * Le coppie che toccano una sezione nascosta restano scritte e non contano
 * finche' lei non torna; quella fra le due sezioni rimaste vicine conta solo
 * finche' e' nascosta.
 */
export const INTERRUZIONE: readonly { tra: readonly [SectionId, SectionId]; perche: string }[] = [
  {
    tra: ["hero", "process"],
    perche:
      "Stampante, tavolo e archivio, tre scene di fila: la stampante ha le linee della sua tavola da progetto, il tavolo e' una camera alta 380vh col palco inchiodato, l'archivio sono quattro cartelle sticky che si salgono sopra a tutta pagina. Il filo o taglia le scene o resta coperto per tutta la corsa.",
  },
  {
    tra: ["process", "contact"],
    perche:
      "In mezzo c'e' il percorso, una scena agganciata che scorre in orizzontale: una linea verticale non la attraversa senza tagliarla. La riga di quella sezione e' la sua onda, dello stesso colore.",
  },
  {
    tra: ["hero", "contact"],
    perche:
      "Con «Come lavoro» nascosta il filo va dall'apertura al «tuo turno», e in mezzo ci sono quattro scene di fila: la stampante, il tavolo, l'archivio e il percorso. Nessuna lascia passare una linea verticale.",
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
   * Entra al 50 e non all'82 dove il filo esce dall'apertura: in mezzo ci sono
   * la stampante, il tavolo e l'archivio dei Lavori, alti diverse schermate, e
   * i due capi non si vedono mai insieme. Un'entrata che combaciasse costerebbe il
   * corridoio.
   */
  process: { in: 50, out: 52 },
  /**
   * Entra al 10 e non al 52 dove il filo esce da «Come lavoro»: in mezzo c'e'
   * il percorso, alto diverse schermate, e i due capi non si vedono mai
   * insieme. E' la stessa ragione per cui «Come lavoro» entra al 50. Il 10 e'
   * la corsa che questa sezione aveva gia', quando il filo ci arrivava dal
   * percorso: spostarlo per farlo combaciare costerebbe il suo disegno.
   */
  contact: { in: 10, out: 50 },
};
