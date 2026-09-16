export type WorkMetric = { id: string; value: string; label: string };

export type WorkCaseData = {
  id: string;
  name: string;
  /** Il problema che c'era. Si legge sulla cartella chiusa, ed e' l'amo. */
  symptom: string;
  /** La scelta ovvia, quella che tutti propongono per prima. */
  alternativa: string;
  /** Perche' non era quella giusta. */
  perche: string;
  /** Cosa si e' fatto invece. Prima persona plurale: era lavoro di squadra. */
  fatto: string;
  /** Assente se il progetto non è mai andato online. */
  url?: string;
  /** Assente quando non c'e' niente da mostrare. */
  screenshot?: string;
  /** Gia' tradotto e gia' col nome dentro: il dialogo non compone testo. */
  screenshotAlt: string;
  year: number;
  tech: string[];
  metrics: WorkMetric[];
};

export type WorkCaseLabels = {
  /** La scelta ovvia, quella che tutti propongono per prima. */
  alternativa: string;
  /** Perche' non era quella giusta. */
  perche: string;
  /** Cosa si e' fatto invece. Prima persona plurale: era lavoro di squadra. */
  fatto: string;
  visit: string;
  /** Sostituisce `visit` quando non c'è un sito da visitare. */
  riservato: string;
  open: string;
  close: string;
};
