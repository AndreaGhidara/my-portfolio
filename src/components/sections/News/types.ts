import type { CategoryId, StoryFigure, StoryStamp } from "@/lib/news/types";

/**
 * I testi della sezione, gia' tradotti dal server. Quelli con le graffe
 * ({n}, {sito}, {ora}) sono modelli: li riempie la macchina con i valori che
 * conosce solo dopo, quando le notizie sono arrivate.
 */
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
