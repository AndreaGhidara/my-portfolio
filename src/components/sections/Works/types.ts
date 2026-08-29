export type WorkMetric = { id: string; value: string; label: string };

export type WorkCaseData = {
  id: string;
  name: string;
  symptom: string;
  decision: string;
  outcome: string;
  url: string;
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
  open: string;
  close: string;
};
