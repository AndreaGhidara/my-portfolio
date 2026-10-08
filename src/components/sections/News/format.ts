import { CATEGORIES, type CategoryId, type Story, type StorySource } from "@/lib/news/types";
import type { NewsCopy } from "./types";

/** Riempie un modello dei messaggi: «Leggi su {sito}». */
export function fillTemplate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

/** Il titolo come si stampa: per una release «e' uscito» lo aggiunge la pagina, nella sua lingua. */
export function storyTitle(n: Story, copy: Pick<NewsCopy, "release">): string {
  return n.stamp === "release" ? fillTemplate(copy.release, { titolo: n.title }) : n.title;
}

/** I nomi delle fonti sono nomi propri: non si traducono. */
export function sourceName(f: StorySource): string {
  switch (f.id) {
    case "hn":
      return "Hacker News";
    case "hf":
      return "Hugging Face Papers";
    case "dev":
      return `DEV Community · #${f.tag}`;
    case "github":
      return `GitHub · ${f.repo}`;
  }
}

/** «3 giorni fa», «ieri», «2 hours ago»: nella lingua della pagina. */
export function timeAgo(when: string, locale: string, now: Date): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const s = (now.getTime() - Date.parse(when)) / 1000;
  if (s < 3600) return rtf.format(-Math.max(1, Math.round(s / 60)), "minute");
  if (s < 86400) return rtf.format(-Math.round(s / 3600), "hour");
  return rtf.format(-Math.round(s / 86400), "day");
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/**
 * «Notizie raccolte alle 16:40 di oggi», nel fuso di chi guarda. Se la raccolta
 * e' di un altro giorno «di oggi» sarebbe falso: si dice il giorno.
 */
export function collectedLabel(
  iso: string,
  locale: string,
  now: Date,
  templates: { collectedToday: string; collectedOn: string },
): string {
  const when = new Date(iso);
  const time = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }).format(when);
  if (sameDay(when, now)) return fillTemplate(templates.collectedToday, { ora: time });
  const day = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long" }).format(when);
  return fillTemplate(templates.collectedOn, { giorno: day, ora: time });
}

export type Ball = { cat: CategoryId; i: number; x: number; y: number };

/**
 * Le palline delle tre categorie mescolate nel globo, a strati dal fondo, in
 * percentuali del globo. Il caso entra qui, e solo sul client quando le
 * notizie sono arrivate: nel markup del server il globo e' vuoto.
 */
export function layoutBalls(counts: Record<CategoryId, number>, random: () => number = Math.random): Ball[] {
  const all = CATEGORIES.flatMap((cat) => Array.from({ length: counts[cat] }, (_, i) => ({ cat, i })));
  for (let k = all.length - 1; k > 0; k--) {
    const j = Math.floor(random() * (k + 1));
    [all[k], all[j]] = [all[j], all[k]];
  }
  const d = 16.5;
  const perRow = 5;
  return all.map((p, k) => {
    const row = Math.floor(k / perRow);
    const col = k % perRow;
    return {
      ...p,
      x: 7 + col * d + (row % 2) * d * 0.45 + random() * 1.2,
      y: 100 - d * (row + 1) * 0.9 - 6 + random() * 1.2,
    };
  });
}
