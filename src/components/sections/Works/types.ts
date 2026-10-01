import type { StatoLavoro } from "@/content/works";

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
  stato: StatoLavoro;
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
  visita: string;
  /** Sostituisce `visita` quando non c'è un sito da visitare. */
  riservato: string;
  apri: string;
  chiudi: string;
  /** Il nome della linguetta per chi legge a voce: cosa fa il bottone. */
  riporta: string;
  /** Le voci della pratica, il foglio che il dossier apre. */
  archivio: string;
  /** «Pratica n.», davanti al numero della cartella. */
  pratica: string;
  /** L'intestazione della riga: la situazione trovata. */
  comEra: string;
  cliente: string;
  anno: string;
  stato: string;
  online: string;
  /** La didascalia della schermata. */
  allegato: string;
  /** L'intestazione dei numeri a lavoro consegnato. */
  rilevato: string;
  /** La stessa, su un lavoro ancora in corso. */
  rilevatoFinora: string;
  /** Accanto a ogni numero non misurato. */
  stima: string;
  consegnato: string;
  inCorso: string;
  firmaNome: string;
  firmaRuolo: string;
};
