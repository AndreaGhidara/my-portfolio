export type WorkMetric = { id: string; value: string; label: string };

export type WorkCaseData = {
  id: string;
  name: string;
  symptom: string;
  decision: string;
  outcome: string;
  /** Assente se il progetto non è mai andato online. */
  url?: string;
  screenshot: string;
  year: number;
  tech: string[];
  metrics: WorkMetric[];
};

export type WorkCaseLabels = {
  symptom: string;
  decision: string;
  outcome: string;
  visit: string;
  /** Sostituisce `visit` quando non c'è un sito da visitare. */
  offline: string;
  open: string;
  close: string;
};
