import type { WorkStatus } from "@/content/works";

/** `estimated`: il numero non e' misurato, e la pratica lo dice accanto. */
export type WorkMetric = { id: string; value: string; label: string; estimated: boolean };

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
  tagline: string;
  /** Cos'era il lavoro: per chi, con che vincolo addosso. */
  work: string;
  /** La soluzione scelta, e in una riga perche' quella e non un'altra. */
  choice: string;
  /** Come e' stata condotta: a fasi, con che ritmo, cosa andava in produzione
   *  quando. E' il campo che distingue un caso da un elenco di tecnologie. */
  approach: string;
  /** Assente se il progetto non è mai andato online. */
  url?: string;
  /** Assente quando non c'e' niente da mostrare. */
  screenshot?: WorkScreenshot;
  /** Gia' tradotto e gia' col nome dentro: il dialogo non compone testo. */
  screenshotAlt: string;
  year: number;
  status: WorkStatus;
  tech: string[];
  metrics: WorkMetric[];
};

export type WorkCaseLabels = {
  /** Cos'era il lavoro. */
  work: string;
  /** La soluzione scelta. */
  choice: string;
  /** Come e' stata condotta. */
  approach: string;
  visit: string;
  /** Sostituisce `visita` quando non c'è un sito da visitare. */
  confidential: string;
  open: string;
  close: string;
  /** Il nome della linguetta per chi legge a voce: cosa fa il bottone. */
  putBack: string;
  /** Le voci della pratica, il foglio che il dossier apre. */
  archive: string;
  /** «Pratica n.», davanti al numero della cartella. */
  dossier: string;
  /** L'intestazione della riga: la situazione trovata. */
  before: string;
  client: string;
  year: string;
  status: string;
  online: string;
  /** La didascalia della schermata. */
  attachment: string;
  /** L'intestazione dei numeri a lavoro consegnato. */
  measured: string;
  /** La stessa, su un lavoro ancora in corso. */
  measuredSoFar: string;
  /** Accanto a ogni numero non misurato. */
  estimate: string;
  delivered: string;
  inProgress: string;
  signatureName: string;
  signatureRole: string;
};
