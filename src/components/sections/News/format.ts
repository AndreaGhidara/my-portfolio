import { CATEGORIES, type CategoryId, type StorySource, type Story } from "@/lib/news/types";
import type { NewsCopy } from "./types";

/** Riempie un modello dei messaggi: «Leggi su {sito}». */
export function fillTemplate(modello: string, valori: Record<string, string | number>): string {
  return modello.replace(/\{(\w+)\}/g, (tutto, chiave: string) =>
    chiave in valori ? String(valori[chiave]) : tutto,
  );
}

/** Il titolo come si stampa: per una release «e' uscito» lo aggiunge la pagina, nella sua lingua. */
export function storyTitle(n: Story, testi: Pick<NewsCopy, "release">): string {
  return n.stamp === "release" ? fillTemplate(testi.release, { titolo: n.title }) : n.title;
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
export function timeAgo(quando: string, locale: string, adesso: Date): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const s = (adesso.getTime() - Date.parse(quando)) / 1000;
  if (s < 3600) return rtf.format(-Math.max(1, Math.round(s / 60)), "minute");
  if (s < 86400) return rtf.format(-Math.round(s / 3600), "hour");
  return rtf.format(-Math.round(s / 86400), "day");
}

const stessoGiorno = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/**
 * «Notizie raccolte alle 16:40 di oggi», nel fuso di chi guarda. Se la raccolta
 * e' di un altro giorno «di oggi» sarebbe falso: si dice il giorno.
 */
export function collectedLabel(
  iso: string,
  locale: string,
  adesso: Date,
  modelli: { collectedToday: string; collectedOn: string },
): string {
  const quando = new Date(iso);
  const ora = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }).format(quando);
  if (stessoGiorno(quando, adesso)) return fillTemplate(modelli.collectedToday, { ora });
  const giorno = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long" }).format(quando);
  return fillTemplate(modelli.collectedOn, { giorno, ora });
}

export type Ball = { cat: CategoryId; i: number; x: number; y: number };

/**
 * Le palline delle tre categorie mescolate nel globo, a strati dal fondo, in
 * percentuali del globo. Il caso entra qui, e solo sul client quando le
 * notizie sono arrivate: nel markup del server il globo e' vuoto.
 */
export function layoutBalls(conte: Record<CategoryId, number>, caso: () => number = Math.random): Ball[] {
  const tutte = CATEGORIES.flatMap((cat) => Array.from({ length: conte[cat] }, (_, i) => ({ cat, i })));
  for (let k = tutte.length - 1; k > 0; k--) {
    const j = Math.floor(caso() * (k + 1));
    [tutte[k], tutte[j]] = [tutte[j], tutte[k]];
  }
  const d = 16.5;
  const perRiga = 5;
  return tutte.map((p, k) => {
    const riga = Math.floor(k / perRiga);
    const colonna = k % perRiga;
    return {
      ...p,
      x: 7 + colonna * d + (riga % 2) * d * 0.45 + caso() * 1.2,
      y: 100 - d * (riga + 1) * 0.9 - 6 + caso() * 1.2,
    };
  });
}
