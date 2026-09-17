export type WorkMetric = { id: string; value: string; label: string };

/**
 * La schermata gia' risolta: percorso, misure e anteprima sfocata.
 *
 * works.ts dichiara SE un caso ha una schermata; quanto e' alta e di che
 * colore e' la sua anteprima lo genera scripts/build-works-shots.mjs a partire
 * dal file vero. Al dossier arrivano gia' insieme: senza misure non puo'
 * riservare il riquadro, senza anteprima il riquadro resta vuoto.
 */
export type WorkScreenshot = {
  src: string;
  width: number;
  height: number;
  blurDataURL: string;
};

export type WorkCaseData = {
  id: string;
  name: string;
  /** Il lavoro in una frase. Si legge sulla cartella chiusa, ed e' l'amo. */
  riga: string;
  /** Cos'era il lavoro: per chi, con che vincolo addosso. */
  lavoro: string;
  /** La soluzione scelta, e in una riga perche' quella e non un'altra. */
  scelta: string;
  /** Come e' stata condotta: a fasi, con che ritmo, cosa andava in produzione
   *  quando. E' il campo che distingue un caso da un elenco di tecnologie. */
  conduzione: string;
  /** Assente se il progetto non è mai andato online. */
  url?: string;
  /** Assente quando non c'e' niente da mostrare. */
  screenshot?: WorkScreenshot;
  /** Gia' tradotto e gia' col nome dentro: il dialogo non compone testo. */
  screenshotAlt: string;
  year: number;
  tech: string[];
  metrics: WorkMetric[];
};

export type WorkCaseLabels = {
  /** Cos'era il lavoro. */
  lavoro: string;
  /** La soluzione scelta. */
  scelta: string;
  /** Come e' stata condotta. */
  conduzione: string;
  visit: string;
  /** Sostituisce `visit` quando non c'è un sito da visitare. */
  riservato: string;
  open: string;
  close: string;
};
