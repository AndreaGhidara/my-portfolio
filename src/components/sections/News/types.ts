import type { CategoryId, StoryFigure, StoryStamp } from "@/lib/news/types";

// Quelli con le graffe ({n}, {sito}, {ora}) sono modelli: li riempie il client
// con valori che conosce solo a notizie arrivate.
export type NewsCopy = {
  categories: Record<CategoryId, { name: string; masthead: string }>;
  stamps: Record<StoryStamp, string>;
  figures: Record<StoryFigure["code"], string>;
  minutes: string;
  release: string;
  readOn: string;
  plate: string;
  plateOne: string;
  group: string;
  knob: string;
  help: string;
  waiting: string;
  empty: string;
  error: string;
  exhausted: string;
  alreadyDrawn: string;
  masthead: string;
  noneDrawn: string;
  noSummary: string;
  collectedToday: string;
  collectedOn: string;
};
