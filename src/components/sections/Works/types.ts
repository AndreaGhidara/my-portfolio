import type { WorkStatus } from "@/content/works";

export type WorkMetric = { id: string; value: string; label: string; estimated: boolean };

/** Misure e anteprima le genera scripts/build-works-shots.mjs dal file vero, e
 *  arrivano insieme al percorso: senza misure il riquadro non si riserva, senza
 *  anteprima resta vuoto. */
export type WorkScreenshot = {
  src: string;
  width: number;
  height: number;
  blurDataURL: string;
};

export type WorkCaseData = {
  id: string;
  name: string;
  /** Si legge sulla cartella chiusa. */
  tagline: string;
  work: string;
  choice: string;
  approach: string;
  /** Assente se il progetto non e' mai andato online. */
  url?: string;
  screenshot?: WorkScreenshot;
  /** Gia' tradotto e col nome dentro: il dialogo non compone testo. */
  screenshotAlt: string;
  year: number;
  status: WorkStatus;
  tech: string[];
  metrics: WorkMetric[];
};

export type WorkCaseLabels = {
  work: string;
  choice: string;
  approach: string;
  visit: string;
  /** Al posto di `visit` quando non c'e' un sito da visitare. */
  confidential: string;
  open: string;
  close: string;
  /** Per chi legge a voce: la linguetta non apre il caso, lo riporta davanti. */
  putBack: string;
  archive: string;
  dossier: string;
  before: string;
  client: string;
  year: string;
  status: string;
  online: string;
  attachment: string;
  measured: string;
  /** Al posto di `measured` su un lavoro ancora in corso. */
  measuredSoFar: string;
  estimate: string;
  delivered: string;
  inProgress: string;
  signatureName: string;
  signatureRole: string;
};
